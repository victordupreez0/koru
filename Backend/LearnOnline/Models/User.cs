using System.ComponentModel.DataAnnotations;

namespace LearnOnline.Models
{
    // Enum defining the three possible roles a user can have in the system
    public enum UserRole
    {
        student,
        teacher,
        admin
    }

    // User entity – represents a registered user (student, teacher, or admin)
    // Stores authentication credentials and profile information
    public class User
    {
        // Unique identifier – auto-generated GUID string
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Login email – must be unique across all users
        [Required]
        public string Email { get; set; } = null!;

        // BCrypt-hashed password – never stored in plain text
        [Required]
        public string PasswordHash { get; set; } = null!;

        [Required]
        public string FirstName { get; set; } = null!;

        [Required]
        public string LastName { get; set; } = null!;

        // Role determines what the user can access (student / teacher / admin)
        [Required]
        public UserRole Role { get; set; }

        // Optional URL to the user's profile picture
        public string? ProfileImageUrl { get; set; }

        // Timestamps for auditing account creation and last update
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Soft-delete flag – inactive users cannot log in
        public bool IsActive { get; set; } = true;
    }
}
