using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;
using LearnOnline.Models.DTOs;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UserController(AppDbContext context)
        {
            _context = context;
        }

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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAll()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users.Select(ToResponseDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserResponseDto>> GetById(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(ToResponseDto(user));
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserResponseDto>> Register(CreateUserDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return Conflict(new { message = "Email already registered" });

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = dto.Role,
                ProfileImageUrl = dto.ProfileImageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToResponseDto(user));
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            bool validPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!validPassword)
                return Unauthorized(new { message = "Invalid email or password" });

            return Ok(new { message = "Login successful", userId = user.Id, role = user.Role.ToString() });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, User updated)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.Email = updated.Email;
            user.FirstName = updated.FirstName;
            user.LastName = updated.LastName;
            user.Role = updated.Role;
            user.ProfileImageUrl = updated.ProfileImageUrl;
            user.IsActive = updated.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

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