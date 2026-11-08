using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearnOnline.Models
{
    // One student's try at an interactive block on a course page.
    // Passed and Score are always worked out by the server, never sent by the client.
    public class Attempt
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        [JsonIgnore]
        public User? Student { get; set; }

        // The CourseModuleItem or CourseModule whose page holds the block
        [Required]
        public string PageId { get; set; } = null!;

        // The block's id inside the page JSON
        [Required]
        public string BlockId { get; set; } = null!;

        // What the student submitted, exactly as received
        [Required]
        public string AnswerJson { get; set; } = "{}";

        public bool Passed { get; set; }
        public double Score { get; set; }
        public double MaxScore { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
