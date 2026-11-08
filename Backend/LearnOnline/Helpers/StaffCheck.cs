using LearnOnline.Data;
using LearnOnline.Models;
using Microsoft.EntityFrameworkCore;

namespace LearnOnline.Helpers
{
    public static class StaffCheck
    {
        // ponytail: trusts the id the client sends, like the rest of the API; real tokens would replace this.
        public static Task<bool> IsStaffAsync(this AppDbContext context, string? userId) =>
            userId == null
                ? Task.FromResult(false)
                : context.Users.AnyAsync(u => u.Id == userId && (u.Role == UserRole.teacher || u.Role == UserRole.admin));
    }
}
