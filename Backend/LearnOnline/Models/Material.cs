using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Material
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string? Title { get; set; }

        public string? FileUrl { get; set; }

        public string? FileType { get; set; }

        public string? UploadedBy { get; set; }

        public DateTime? UploadedAt { get; set; }

        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
}
