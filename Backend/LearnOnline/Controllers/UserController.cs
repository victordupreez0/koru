using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;
using LearnOnline.Models.DTOs;

namespace LearnOnline.Controllers
{
    // User API – handles registration, login, and CRUD for user accounts
    // Passwords are hashed with BCrypt before storage
    // Responses use UserResponseDto to avoid exposing the password hash
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        // Injected services – database access, outbound HTTP for Google, and app configuration
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public UserController(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // Helper – convert a User entity to a safe response DTO (no password hash)
        private static UserResponseDto ToResponseDto(User user) => new()
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            ProfileImageUrl = user.ProfileImageUrl,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            IsActive = user.IsActive
        };

        // GET /api/User – return all users (minus password hashes)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAll()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users.Select(ToResponseDto));
        }

        // GET /api/User/{id} – return a single user by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<UserResponseDto>> GetById(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(ToResponseDto(user));
        }

        // POST /api/User/register – create a new account
        // Checks for duplicate emails and hashes the password with BCrypt
        [HttpPost("register")]
        public async Task<ActionResult<UserResponseDto>> Register(CreateUserDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Email == email))
                return Conflict(new { message = "Email already registered" });

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Role = dto.Role,
                ProfileImageUrl = dto.ProfileImageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToResponseDto(user));
        }

        // POST /api/User/login – authenticate with email + password
        // Returns the user's profile on success, or 401 on failure
        [HttpPost("login")]
        public async Task<ActionResult> Login(LoginDto dto)
        {
            // Normalize the email before looking for a matching active user
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null || !user.IsActive)
                return Unauthorized(new { message = "Invalid email or password" });

            bool validPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!validPassword)
                return Unauthorized(new { message = "Invalid email or password" });

            return Ok(new
            {
                message = "Login successful",
                userId = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                role = user.Role.ToString(),
                profileImageUrl = user.ProfileImageUrl
            });
        }

        // GET /api/User/google-config – exposes the Google client ID used by the frontend sign-in button
        [HttpGet("google-config")]
        public ActionResult GetGoogleConfig()
        {
            return Ok(new { clientId = _configuration["GoogleAuth:ClientId"] ?? string.Empty });
        }

        // POST /api/User/google – authenticate with Google and create the account if needed
        [HttpPost("google")]
        public async Task<ActionResult> GoogleAuth(GoogleAuthDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Credential))
                return BadRequest(new { message = "Google credential is required" });

            // Ask Google to validate the received ID token and return the user's profile details
            var client = _httpClientFactory.CreateClient();
            var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(dto.Credential)}";
            var tokenInfo = await client.GetFromJsonAsync<GoogleTokenInfoDto>(url);

            if (tokenInfo == null || string.IsNullOrWhiteSpace(tokenInfo.Email))
                return Unauthorized(new { message = "Google authentication failed" });

            if (!string.Equals(tokenInfo.EmailVerified, "true", StringComparison.OrdinalIgnoreCase))
                return Unauthorized(new { message = "Google email address is not verified" });

            // If a client ID is configured, ensure the incoming token was issued for this app only
            var configuredClientId = _configuration["GoogleAuth:ClientId"];
            if (!string.IsNullOrWhiteSpace(configuredClientId) &&
                !string.Equals(tokenInfo.Audience, configuredClientId, StringComparison.Ordinal))
            {
                return Unauthorized(new { message = "Google client ID mismatch" });
            }

            // Match the Google account to an existing user or create one for first-time access
            var email = tokenInfo.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                    FirstName = string.IsNullOrWhiteSpace(tokenInfo.GivenName) ? "Google" : tokenInfo.GivenName,
                    LastName = string.IsNullOrWhiteSpace(tokenInfo.FamilyName) ? "User" : tokenInfo.FamilyName,
                    Role = dto.Role,
                    ProfileImageUrl = tokenInfo.Picture,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Users.Add(user);
            }
            else
            {
                if (!user.IsActive)
                    return Unauthorized(new { message = "This account is inactive" });

                if (!string.IsNullOrWhiteSpace(tokenInfo.Picture))
                    user.ProfileImageUrl = tokenInfo.Picture;

                user.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Google login successful",
                userId = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                role = user.Role.ToString(),
                profileImageUrl = user.ProfileImageUrl,
                provider = "Google"
            });
        }

        // PUT /api/User/{id} – update a user's profile fields
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, User updated)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.Email = updated.Email.Trim().ToLowerInvariant();
            user.FirstName = updated.FirstName;
            user.LastName = updated.LastName;
            user.Role = updated.Role;
            user.ProfileImageUrl = updated.ProfileImageUrl;
            user.IsActive = updated.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/User/{id} – permanently remove a user account
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}