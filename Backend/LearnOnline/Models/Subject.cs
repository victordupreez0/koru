using System.ComponentModel.DataAnnotations;

namespace LearnOnline.Models
{
    // Subject entity – a catalogue entry for a subject offered by the institution
    // e.g. "Development 300" with code "DV300"
    // A Course links a Subject to a specific term, year, and teacher
    public class Subject
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Full subject name (e.g. "Development 300")
        [Required]
        public string Name { get; set; } = null!;

        // Short code displayed in the UI (e.g. "DV300")
        [Required]
        public string Code { get; set; } = null!;

        // Optional longer description of the subject
        public string? Description { get; set; }

        // ID of the admin/teacher who created this subject
        public string? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
