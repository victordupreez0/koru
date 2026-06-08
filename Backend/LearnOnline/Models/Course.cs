using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Course entity – a specific offering of a Subject in a given term and year
    // Links a Subject to a Teacher and defines capacity for enrolments
    public class Course
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Academic term (e.g. "Term 1", "Semester 2")
        [Required]
        public string Term { get; set; } = null!;

        // Academic year (e.g. 2026)
        [Required]
        public int Year { get; set; }

        // Maximum number of students that can enrol
        public int? Capacity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key to the Subject this course is for
        [Required]
        public string SubjectId { get; set; } = null!;

        [ForeignKey("SubjectId")]
        public Subject? Subject { get; set; }

        // Foreign key to the User (teacher) who runs this course
        [Required]
        public string TeacherId { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public User? Teacher { get; set; }

        // Visibility status: true = published, false = draft
        public bool IsVisible { get; set; } = false;

        // Optional Degree program linkage
        public string? Degree { get; set; }

        // Serialised NovelEditor page content ({ sections }) for this course's homepage
        public string? Content { get; set; }
    }
}
