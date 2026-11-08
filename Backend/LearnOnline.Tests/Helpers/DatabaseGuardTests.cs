using FluentAssertions;
using LearnOnline.Helpers;

namespace LearnOnline.Tests.Helpers;

public class DatabaseGuardTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Missing_connection_string_is_refused(string? value)
    {
        var act = () => DatabaseGuard.EnsureSafe(value);
        act.Should().Throw<InvalidOperationException>().WithMessage("*not set*");
    }

    [Theory]
    [InlineData("Host=x;Database=defaultdb;Username=u;Password=p")]
    [InlineData("Host=x;Database=DefaultDB;Username=u;Password=p")]
    public void Shared_database_is_refused(string value)
    {
        var act = () => DatabaseGuard.EnsureSafe(value);
        act.Should().Throw<InvalidOperationException>().WithMessage("*shared*");
    }

    [Theory]
    [InlineData("Host=localhost;Port=5433;Database=koru;Username=postgres;Password=p")]
    [InlineData("Host=x;Database=koru_vic;Username=u;Password=p")]
    public void Own_database_is_allowed(string value)
    {
        var act = () => DatabaseGuard.EnsureSafe(value);
        act.Should().NotThrow();
    }
}
