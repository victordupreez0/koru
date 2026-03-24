using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Feedback
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string? Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string SubmissionId { get; set; } = null!;

        [ForeignKey("SubmissionId")]
        public Submission? Submission { get; set; }

        [Required]
        public string TeacherId { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public User? Teacher { get; set; }
    }
}
