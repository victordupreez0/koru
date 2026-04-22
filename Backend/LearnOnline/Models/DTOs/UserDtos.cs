using System.Text.Json.Serialization;

namespace LearnOnline.Models.DTOs
{
    // DTO for creating a new user (registration)
    // Accepts a plain-text password which the controller hashes before storing
    public class CreateUserDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public UserRole Role { get; set; }
        public string? ProfileImageUrl { get; set; }
    }

    // DTO for login requests – email + plain-text password
    public class LoginDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    // DTO for Google authentication using an ID token from Google Identity Services
    public class GoogleAuthDto
    {
        // Google ID token returned by Google Identity Services on the frontend
        public string Credential { get; set; } = null!;

        // Optional role chosen on the sign-up form for first-time Google users
        public UserRole Role { get; set; } = UserRole.student;
    }

    // DTO for updating the user's profile information from the settings page
    public class UpdateUserProfileDto
    {
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public UserRole Role { get; set; }
        public string? ProfileImageUrl { get; set; }
    }

    // DTO for securely changing a user's password from the settings page
    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }

    // Response from Google's tokeninfo endpoint
    public class GoogleTokenInfoDto
    {
        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("email_verified")]
        public string? EmailVerified { get; set; }

        [JsonPropertyName("given_name")]
        public string? GivenName { get; set; }

        [JsonPropertyName("family_name")]
        public string? FamilyName { get; set; }

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }

        [JsonPropertyName("aud")]
        public string? Audience { get; set; }
    }

    // DTO returned to the frontend after auth or user queries
    // Excludes sensitive fields like PasswordHash
    public class UserResponseDto
    {
        public string Id { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public UserRole Role { get; set; }
        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsActive { get; set; }
    }
}
