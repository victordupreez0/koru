using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearnOnline.Models
{
    // Tracks the read status of announcements per user (student or teacher)
    public class AnnouncementReadState
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string AnnouncementId { get; set; } = null!;

        [ForeignKey("AnnouncementId")]
        public Announcement? Announcement { get; set; }

        [Required]
        public string UserId { get; set; } = null!;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        public DateTime ReadAt { get; set; } = DateTime.UtcNow;
    }
}
