using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // AssignmentClassOverride entity – overrides an Assignment's DueDate (and other dates) for a specific ClassGroup
    public class AssignmentClassOverride
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string AssignmentId { get; set; } = null!;

        [ForeignKey("AssignmentId")]
        public Assignment? Assignment { get; set; }

        [Required]
        public string ClassGroupId { get; set; } = null!;

        [ForeignKey("ClassGroupId")]
        public ClassGroup? ClassGroup { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public DateTime? OpenDate { get; set; }

        public DateTime? CloseDate { get; set; }
    }
}
