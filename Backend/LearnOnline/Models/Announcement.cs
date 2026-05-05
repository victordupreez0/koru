using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Announcement
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Title { get; set; } = string.Empty;

        public string LecturerName { get; set; } = string.Empty;

        public DateTime DatePosted { get; set; } = DateTime.UtcNow;

        public string Preview { get; set; } = string.Empty;

        public string Label { get; set; } = string.Empty;

        public string Color { get; set; } = string.Empty;

        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
}
