using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Submission entity – a student's uploaded work for an assignment
    // Linked to both the Assignment and the Student who submitted it
    public class Submission
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // When the student submitted their work
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // URL or path to the submitted file
        public string? FileUrl { get; set; }

        // Workflow status (e.g. "Pending", "Graded", "Late")
        public string? Status { get; set; }

        // Foreign key to the Assignment this submission is for
        [Required]
        public string AssignmentId { get; set; } = null!;

        [ForeignKey("AssignmentId")]
        public Assignment? Assignment { get; set; }

        // Foreign key to the Student (User) who submitted
        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }
    }
}
