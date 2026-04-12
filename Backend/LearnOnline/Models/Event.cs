using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Event entity – a calendar event linked to a course
    // Used by the FullCalendar frontend to display lectures, exams, meetings, etc.
    public class Event
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Display name shown on the calendar tile
        public string? Title { get; set; }

        // Optional longer description shown in the event modal
        public string? Description { get; set; }

        // Category label (e.g. "Lecture", "Exam", "Workshop")
        public string? EventType { get; set; }

        // When the event starts and ends (UTC)
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        // ID of the user who created this event
        public string? CreatedBy { get; set; }

        // Calendar display colours sent to the frontend for FullCalendar rendering
        public string? BgColor { get; set; }
        public string? TextColor { get; set; }

        // Foreign key to the Course this event belongs to
        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
}
