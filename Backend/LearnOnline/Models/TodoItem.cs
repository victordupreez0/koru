using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // TodoItem – a task on the teacher's dashboard
    // Can be created by the teacher themselves or assigned by an admin
    // CreatedByAdminId == null  → teacher-created (purple)
    // CreatedByAdminId != null  → admin-assigned (orange)
    public class TodoItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Title { get; set; } = null!;

        // Free-form due date string e.g. "By Mar 5 at 10:00"
        public string? DueDate { get; set; }

        // Course code label e.g. "DV300" or "General"
        public string? CourseCode { get; set; }

        public bool IsCompleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // The teacher this todo belongs to / is assigned to
        [Required]
        public string TeacherId { get; set; } = null!;

        [ForeignKey("TeacherId")]
        public User? Teacher { get; set; }

        // Null = the teacher created it themselves
        // Set = an admin created / assigned it to the teacher
        public string? CreatedByAdminId { get; set; }

        [ForeignKey("CreatedByAdminId")]
        public User? CreatedByAdmin { get; set; }
    }
}
