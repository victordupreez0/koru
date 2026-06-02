using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // CourseModule entity – a named section within a course's Modules page
    // e.g. "Week 1: Introduction & Briefing", "Resources", "Overview"
    public class CourseModule
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Foreign key to the Course this module belongs to
        [Required]
        public string CourseId { get; set; } = null!;

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        // Display title for the section
        [Required]
        public string Title { get; set; } = null!;

        // Whether students can see this section
        public bool IsPublished { get; set; } = true;

        // Whether the accordion section is expanded by default
        public bool IsOpen { get; set; } = true;

        // Position in the sorted list of modules
        public int SortOrder { get; set; } = 0;

        // Optional prefix symbol (e.g. "①")
        public string? Prefix { get; set; }

        // Serialised NovelEditor page content ({ title, sections }) for this module's own page
        public string? Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Items (documents, links, attachments) nested inside this section
        public ICollection<CourseModuleItem> Items { get; set; } = new List<CourseModuleItem>();
    }
}
