using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Grade
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public decimal? PointsEarned { get; set; }

        public DateTime GradedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string SubmissionId { get; set; } = null!;

        [ForeignKey("SubmissionId")]
        public Submission? Submission { get; set; }

        [Required]
        public string GradedBy { get; set; } = null!;

        [ForeignKey("GradedBy")]
        public User? Grader { get; set; }
    }
}
