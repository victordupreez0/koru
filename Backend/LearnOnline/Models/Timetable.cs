using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    public class Timetable
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string? Term { get; set; }

        public int? Year { get; set; }

        public DateTime? GeneratedAt { get; set; }

        public string? GeneratedBy { get; set; }

        [Required]
        public string UserId { get; set; } = null!;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
