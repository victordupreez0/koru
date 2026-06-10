using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Timetable API – CRUD for user timetables
    // A timetable groups Class sessions for a specific user, term, and year
    [ApiController]
    [Route("api/[controller]")]
    public class TimetableController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TimetableController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Timetable – return all timetables with their associated User
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Timetable>>> GetAll()
        {
            return await _context.Timetables
                .Include(t => t.User)
                .ToListAsync();
        }

        // GET /api/Timetable/{id} – return a single timetable by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Timetable>> GetById(string id)
        {
            var timetable = await _context.Timetables
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (timetable == null) return NotFound();
            return timetable;
        }

        // POST /api/Timetable – generate a new timetable and auto-schedule all unlinked class slots
        [HttpPost]
        public async Task<ActionResult<object>> Create(Timetable timetable)
        {
            timetable.Id = Guid.NewGuid().ToString();
            timetable.GeneratedAt = DateTime.UtcNow;
            _context.Timetables.Add(timetable);

            // Reset all previously generated classes so this run produces a fresh conflict-free schedule.
            // Manually-placed classes (IsGenerated = false) keep their times and seed the conflict pool.
            var prevGenerated = await _context.Classes
                .Where(c => c.IsGenerated == true)
                .ToListAsync();
            // Remember original schedules so rescheduled classes stay near their original time
            var originalSchedules = new Dictionary<string, (string? Day, TimeOnly? Start, TimeOnly? End)>();
            foreach (var cls in prevGenerated)
            {
                if (cls.DayOfWeek != null && cls.StartTime != null)
                    originalSchedules[cls.Id] = (cls.DayOfWeek, cls.StartTime, cls.EndTime);
            }

            foreach (var cls in prevGenerated)
            {
                cls.StartTime = null;
                cls.EndTime   = null;
            }
            await _context.SaveChangesAsync();

            // Manually-placed classes that clash with another class (same day, overlapping
            // time, shared teacher/room/group) are reset too, so regeneration resolves the
            // conflict by moving one of them. The earlier-starting class keeps its slot.
            var manuallyPlaced = await _context.Classes
                .Where(c => c.StartTime != null)
                .ToListAsync();

            var conflictReset = new HashSet<string>();
            for (int i = 0; i < manuallyPlaced.Count; i++)
            {
                for (int j = i + 1; j < manuallyPlaced.Count; j++)
                {
                    var a = manuallyPlaced[i];
                    var b = manuallyPlaced[j];
                    if (conflictReset.Contains(a.Id) || conflictReset.Contains(b.Id)) continue;
                    if (a.DayOfWeek == null || a.DayOfWeek != b.DayOfWeek) continue;

                    bool sharesResource =
                        (a.TeacherId != null && a.TeacherId == b.TeacherId) ||
                        (a.Room != null && a.Room == b.Room) ||
                        (a.ClassGroupId != null && a.ClassGroupId == b.ClassGroupId);
                    if (!sharesResource) continue;

                    var aStart = a.StartTime!.Value.ToTimeSpan();
                    var aEnd = a.EndTime.HasValue ? a.EndTime.Value.ToTimeSpan()
                        : aStart.Add(TimeSpan.FromHours((double)(a.DurationHours ?? 1m)));
                    var bStart = b.StartTime!.Value.ToTimeSpan();
                    var bEnd = b.EndTime.HasValue ? b.EndTime.Value.ToTimeSpan()
                        : bStart.Add(TimeSpan.FromHours((double)(b.DurationHours ?? 1m)));

                    if (aStart < bEnd && bStart < aEnd)
                        conflictReset.Add(aStart <= bStart ? b.Id : a.Id);
                }
            }

            foreach (var cls in manuallyPlaced.Where(c => conflictReset.Contains(c.Id)))
            {
                originalSchedules[cls.Id] = (cls.DayOfWeek, cls.StartTime, cls.EndTime);
                cls.StartTime = null;
                cls.EndTime   = null;
            }
            await _context.SaveChangesAsync();

            // Classes to schedule: generated ones (just reset) + conflict-reset ones +
            // any slot without a time, grouped or not
            var unlinked = await _context.Classes
                .Where(c => c.StartTime == null)
                .ToListAsync();

            // Seed the conflict pool with manually-placed classes only
            var pool = await _context.Classes
                .Where(c => c.IsGenerated == false && c.StartTime != null)
                .ToListAsync();

            var weekdays = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };

            // Most-constrained first: preferred day + teacher hardest to place
            var toSchedule = unlinked
                .OrderByDescending(c => (c.DayOfWeek != null ? 2 : 0) + (c.TeacherId != null ? 1 : 0))
                .ToList();

            foreach (var cls in toSchedule)
            {
                cls.TimetableId = timetable.Id;
                cls.IsGenerated = true;

                if (cls.StartTime != null) continue; // already manually scheduled — just link it

                var duration = TimeSpan.FromHours((double)(cls.DurationHours ?? 1m));

                // Try preferred day first, then remaining weekdays
                var candidateDays = cls.DayOfWeek != null
                    ? new[] { cls.DayOfWeek }.Concat(weekdays.Where(d => d != cls.DayOfWeek)).ToArray()
                    : weekdays;

                bool placed = false;

                // Look up original schedule to prefer nearby placement on rescheduling
                originalSchedules.TryGetValue(cls.Id, out var origSched);

                foreach (var day in candidateDays)
                {
                    // Collect blocked windows on this day from any shared resource:
                    //   • same teacher  (can't double-book a lecturer)
                    //   • same room     (can't use the same room twice)
                    //   • same group    (students can't attend two classes at once)
                    // Fall back to startTime + durationHours when endTime is missing
                    // (classes linked by older generator runs may have no endTime stored).
                    var blocked = pool
                        .Where(s => s.StartTime != null && s.DayOfWeek == day &&
                            ((cls.TeacherId    != null && s.TeacherId    == cls.TeacherId) ||
                             (cls.Room         != null && s.Room         == cls.Room) ||
                             (cls.ClassGroupId != null && s.ClassGroupId == cls.ClassGroupId)))
                        .Select(s =>
                        {
                            var start = s.StartTime!.Value.ToTimeSpan();
                            var end   = s.EndTime.HasValue
                                ? s.EndTime.Value.ToTimeSpan()
                                : start.Add(TimeSpan.FromHours((double)(s.DurationHours ?? 1m)));
                            return (s: start, e: end);
                        })
                        .ToList();

                    var latest = new TimeSpan(18, 0, 0) - duration;

                    // On the original day, start searching from the original time so the
                    // class stays near its previous slot instead of jumping to 08:00.
                    var searchStart = new TimeSpan(8, 0, 0);
                    bool wrappedSearch = false;
                    if (origSched.Start.HasValue && origSched.Day == day)
                    {
                        searchStart = origSched.Start.Value.ToTimeSpan();
                        wrappedSearch = searchStart > new TimeSpan(8, 0, 0);
                    }

                    // First pass: from searchStart (original time or 08:00) forward
                    var slotStart = searchStart;
                    while (slotStart <= latest)
                    {
                        var slotEnd = slotStart + duration;

                        bool conflict = blocked.Any(w => slotStart < w.e && w.s < slotEnd);
                        if (!conflict)
                        {
                            cls.DayOfWeek = day;
                            cls.StartTime = TimeOnly.FromTimeSpan(slotStart);
                            cls.EndTime   = TimeOnly.FromTimeSpan(slotEnd);
                            pool.Add(cls); // track so subsequent classes avoid this slot
                            placed = true;
                            break;
                        }

                        slotStart += TimeSpan.FromMinutes(30);
                    }

                    // Second pass: if we started after 08:00 and didn't place yet,
                    // check earlier slots on the same day before moving to other days.
                    if (!placed && wrappedSearch)
                    {
                        slotStart = new TimeSpan(8, 0, 0);
                        while (slotStart < searchStart && slotStart <= latest)
                        {
                            var slotEnd = slotStart + duration;

                            bool conflict = blocked.Any(w => slotStart < w.e && w.s < slotEnd);
                            if (!conflict)
                            {
                                cls.DayOfWeek = day;
                                cls.StartTime = TimeOnly.FromTimeSpan(slotStart);
                                cls.EndTime   = TimeOnly.FromTimeSpan(slotEnd);
                                pool.Add(cls);
                                placed = true;
                                break;
                            }

                            slotStart += TimeSpan.FromMinutes(30);
                        }
                    }

                    if (placed) break;
                }
                // If no slot found across all days, the class stays unscheduled
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = timetable.Id }, new
            {
                timetable,
                linkedClassIds = unlinked.Select(c => c.Id).ToList()
            });
        }

        // PUT /api/Timetable/{id} – update timetable details (term, year, owner)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Timetable updated)
        {
            var timetable = await _context.Timetables.FindAsync(id);
            if (timetable == null) return NotFound();

            timetable.Term = updated.Term;
            timetable.Year = updated.Year;
            timetable.GeneratedBy = updated.GeneratedBy;
            timetable.UserId = updated.UserId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Timetable/{id} – permanently remove a timetable
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var timetable = await _context.Timetables.FindAsync(id);
            if (timetable == null) return NotFound();
            _context.Timetables.Remove(timetable);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
