using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Note entity – a text note associated with a course
    // Can be written by a teacher or student and is visible to a specific student
    public class Note
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // The note's text content
        public string? Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key to the Course the note is about
        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        // Foreign key to the Student the note is for
        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }

        // Foreign key to the User who wrote the note
        [Required]
        public string AuthorId { get; set; } = null!;

        [ForeignKey("AuthorId")]
        public User? Author { get; set; }
    }
}
