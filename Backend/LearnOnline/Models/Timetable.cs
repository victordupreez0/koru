using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Timetable entity – a generated timetable for a specific user, term, and year
    // Contains Class entries that define the weekly schedule
    public class Timetable
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Academic term (e.g. "Term 1")
        public string? Term { get; set; }

        // Academic year (e.g. 2026)
        public int? Year { get; set; }

        // When the timetable was generated
        public DateTime? GeneratedAt { get; set; }

        // ID of the user/admin who generated this timetable
        public string? GeneratedBy { get; set; }

        // Foreign key to the User this timetable belongs to
        [Required]
        public string UserId { get; set; } = null!;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
