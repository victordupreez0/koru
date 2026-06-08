using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // AttendanceRecord entity – tracks if a student was Present, Absent, Late, or Excused in an AttendanceSession
    public class AttendanceRecord
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string AttendanceSessionId { get; set; } = null!;

        [ForeignKey("AttendanceSessionId")]
        public AttendanceSession? Session { get; set; }

        [Required]
        public string StudentId { get; set; } = null!;

        [ForeignKey("StudentId")]
        public User? Student { get; set; }

        [Required]
        public string Status { get; set; } = "Present"; // Present, Absent, Late, Excused

        public string? Remarks { get; set; }
    }
}
