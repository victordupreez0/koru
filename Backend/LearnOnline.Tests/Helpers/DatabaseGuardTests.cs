using FluentAssertions;
using LearnOnline.Helpers;

namespace LearnOnline.Tests.Helpers;

// xUnit runs the tests in one class one at a time, so changing this variable here is safe.
public class DatabaseGuardTests : IDisposable
{
    private const string Variable = "KORU_DB_GUARD";

    public DatabaseGuardTests() => Environment.SetEnvironmentVariable(Variable, "true");

    public void Dispose() => Environment.SetEnvironmentVariable(Variable, null);

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

    [Theory]
    [InlineData(null)]
    [InlineData("false")]
    [InlineData("1")]
    public void Does_nothing_unless_switched_on(string? setting)
    {
        Environment.SetEnvironmentVariable(Variable, setting);

        var missing = () => DatabaseGuard.EnsureSafe(null);
        var shared = () => DatabaseGuard.EnsureSafe("Host=x;Database=defaultdb;Username=u;Password=p");

        missing.Should().NotThrow();
        shared.Should().NotThrow();
    }
}
