using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Grade entity – a numeric score awarded to a student's submission
    // Tracks who graded it and when, for audit purposes
    public class Grade
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Points the student earned (compared against Assignment.MaxPoints)
        public decimal? PointsEarned { get; set; }

        // When the grade was recorded / last updated
        public DateTime GradedAt { get; set; } = DateTime.UtcNow;

        // Foreign key to the Submission being graded
        [Required]
        public string SubmissionId { get; set; } = null!;

        [ForeignKey("SubmissionId")]
        public Submission? Submission { get; set; }

        // Foreign key to the User (teacher/admin) who assigned this grade
        [Required]
        public string GradedBy { get; set; } = null!;

        [ForeignKey("GradedBy")]
        public User? Grader { get; set; }

        // Whether this grade has been released to the student
        public bool IsReleased { get; set; } = false;
    }
}
