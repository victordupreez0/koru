using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Material entity – a file or resource uploaded to a course
    // Could be lecture slides, PDFs, videos, etc.
    public class Material
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Display name for the material (e.g. "Week 3 Slides")
        public string? Title { get; set; }

        // URL or path where the file is stored
        public string? FileUrl { get; set; }

        // MIME type or extension (e.g. "pdf", "mp4")
        public string? FileType { get; set; }

        // ID of the user who uploaded this material
        public string? UploadedBy { get; set; }

        // When the file was uploaded
        public DateTime? UploadedAt { get; set; }

        // Foreign key to the Course this material belongs to
        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
}
