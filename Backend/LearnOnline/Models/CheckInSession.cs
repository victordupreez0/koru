using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class CheckInSession
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Code { get; set; } = null!;

        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [Required]
        public string TeacherId { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public User? Teacher { get; set; }

        public DateTime Date { get; set; } = DateTime.UtcNow.Date;

        public string SessionType { get; set; } = "Lecture";

        public bool IsOpen { get; set; } = true;

        public DateTime OpenedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ClosedAt { get; set; }

        // Minutes after opening before students are marked Late instead of Present (null = no threshold)
        public int? LateAfterMinutes { get; set; }

        // Automatically close the session at this UTC time (null = manual close only)
        public DateTime? AutoCloseAt { get; set; }

        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }
}
