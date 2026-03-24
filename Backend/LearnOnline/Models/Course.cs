using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Course
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Term { get; set; } = null!;

        [Required]
        public int Year { get; set; }

        public int? Capacity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string SubjectId { get; set; } = null!;

        [ForeignKey("SubjectId")]
        public Subject? Subject { get; set; }

        [Required]
        public string TeacherId { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public User? Teacher { get; set; }
    }
}
