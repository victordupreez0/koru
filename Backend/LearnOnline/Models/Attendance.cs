using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Attendance
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public DateTime Date { get; set; }

        // "Present", "Absent", "Late"
        [Required]
        public string Status { get; set; } = "Present";

        // "Lecture", "Tutorial", "Practical"
        public string SessionType { get; set; } = "Lecture";

        public string? Time { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }

        [Required]
        public string RecordedById { get; set; } = null!;

        [ForeignKey("RecordedById")]
        public User? RecordedBy { get; set; }

        public string? CheckInSessionId { get; set; }

        [ForeignKey("CheckInSessionId")]
        public CheckInSession? CheckInSession { get; set; }
    }
}
