using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Note
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string? Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }

        [Required]
        public string AuthorId { get; set; } = null!;

        [ForeignKey("AuthorId")]
        public User? Author { get; set; }
    }
}
