using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // AttendanceSession entity – represents an actual occurrence of a class session for a ClassGroup
    public class AttendanceSession
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string ClassGroupId { get; set; } = null!;

        [ForeignKey("ClassGroupId")]
        public ClassGroup? ClassGroup { get; set; }

        [Required]
        public DateTime SessionDate { get; set; }

        [Required]
        public string LecturerId { get; set; } = null!;

        [ForeignKey("LecturerId")]
        public User? Lecturer { get; set; }

        // Navigation properties
        public ICollection<AttendanceRecord> Records { get; set; } = new List<AttendanceRecord>();
    }
}
