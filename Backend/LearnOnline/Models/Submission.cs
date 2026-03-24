using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Submission
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public string? FileUrl { get; set; }

        public string? Status { get; set; }

        [Required]
        public string AssignmentId { get; set; } = null!;

        [ForeignKey("AssignmentId")]
        public Assignment? Assignment { get; set; }

        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }
    }
}
