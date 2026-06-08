using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Enrollment entity – links a Student to a Course
    // Tracks when the student enrolled and their current status (active, dropped, etc.)
    public class Enrollment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Timestamp of when the student enrolled
        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

        // Current status (e.g. "Active", "Dropped", "Completed")
        public string? Status { get; set; }

        // Foreign key to the Course the student enrolled in
        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        // Foreign key to the Student (User with role = student)
        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }

        // Optional links a student's enrollment to a specific cohort group
        public string? ClassGroupId { get; set; }

        [ForeignKey("ClassGroupId")]
        public ClassGroup? ClassGroup { get; set; }
    }
}
