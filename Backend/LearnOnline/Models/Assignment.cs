using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Assignment entity – a task or project set by a teacher for a course
    // Students submit their work via the Submission entity
    public class Assignment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Assignment title shown in the dashboard and course view
        [Required]
        public string Title { get; set; } = null!;

        // Optional instructions or brief for the assignment
        public string? Description { get; set; }

        // Deadline for student submissions
        public DateTime? DueDate { get; set; }

        // Maximum achievable points (used to calculate grades)
        public int? MaxPoints { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key to the Course this assignment belongs to
        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
}
