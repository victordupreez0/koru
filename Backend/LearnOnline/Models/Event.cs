using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Event
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string? Title { get; set; }

        public string? Description { get; set; }

        public string? EventType { get; set; }

        public DateTime? StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public string? CreatedBy { get; set; }

        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
}
