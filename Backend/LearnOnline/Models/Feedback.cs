using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Feedback entity – written comments from a teacher on a student's submission
    // Each piece of feedback is linked to exactly one Submission and one Teacher
    public class Feedback
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // The teacher's written feedback text
        public string? Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key to the Submission being reviewed
        [Required]
        public string SubmissionId { get; set; } = null!;

        [ForeignKey("SubmissionId")]
        public Submission? Submission { get; set; }

        // Foreign key to the Teacher (User) who gave the feedback
        [Required]
        public string TeacherId { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public User? Teacher { get; set; }
    }
}
