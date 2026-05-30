using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearnOnline.Models
{
    // CourseModuleItem entity – a single item nested inside a CourseModule section
    // Can be a rich-text document, an external link, or a file attachment
    public class CourseModuleItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Foreign key to the parent CourseModule section
        [Required]
        public string ModuleId { get; set; } = null!;

        // Suppress the back-reference during JSON serialisation to avoid circular cycles
        [ForeignKey("ModuleId")]
        [JsonIgnore]
        public CourseModule? Module { get; set; }

        // Display label shown in the module accordion
        [Required]
        public string Label { get; set; } = null!;

        // "document" | "link" | "attachment"
        public string Type { get; set; } = "document";

        // Whether students can see this item
        public bool IsPublished { get; set; } = true;

        // For link-type items: open in a new tab
        public bool IsExternal { get; set; } = false;

        // Position within the parent module
        public int SortOrder { get; set; } = 0;

        // Serialised NovelEditor page content ({ title, sections }) for document-type items
        public string? Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
