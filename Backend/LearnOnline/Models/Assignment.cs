using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Assignment entity – a task or project set by a teacher for a course
    // Students submit their work via the Submission entity
    public class Assignment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Assignment title shown in the dashboard and course view
        [Required]
        public string Title { get; set; } = null!;

        // Optional instructions or brief for the assignment
        public string? Description { get; set; }

        // Deadline for student submissions
        public DateTime? DueDate { get; set; }

        // When the assignment becomes visible/available to students
        public DateTime? OpenDate { get; set; }

        // When submissions are no longer accepted (date-based close)
        public DateTime? CloseDate { get; set; }

        // Maximum achievable points (used to calculate grades)
        public int? MaxPoints { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Assignment type: "online" | "quiz" | "discussion" | "paper" | "external" | "none"
        public string Type { get; set; } = "online";

        // When true the assignment is closed and hidden from students
        public bool IsClosed { get; set; } = false;

        // When false students may only submit once
        public bool AllowMultipleAttempts { get; set; } = true;

        // JSON array of quiz questions – only used when Type == "quiz"
        // Format: [{"question":"...","options":["a","b","c","d"],"correctAnswer":0}]
        public string? QuizQuestionsJson { get; set; }

        // External tool name (e.g. "Google Assignments", "Turnitin") – used when Type == "external"
        public string? ExternalToolName { get; set; }

        // Launch URL for the external tool – used when Type == "external"
        public string? ExternalToolUrl { get; set; }

        // Foreign key to the Course this assignment belongs to
        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        // When set, this assignment is only visible to students in this group.
        // Null means the assignment targets all groups in the course.
        public string? ClassGroupId { get; set; }

        [ForeignKey("ClassGroupId")]
        public ClassGroup? ClassGroup { get; set; }
    }
}
