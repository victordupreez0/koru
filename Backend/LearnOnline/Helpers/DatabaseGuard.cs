using Npgsql;

namespace LearnOnline.Helpers
{
    // Every backend start writes to its database (schema patches, seeding), so a
    // missing or shared connection string has to stop the app before it connects.
    public static class DatabaseGuard
    {
        // The team's shared Aiven database. Nothing on this branch may ever write to it.
        private const string SharedDatabase = "defaultdb";

        public static void EnsureSafe(string? connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                throw new InvalidOperationException(
                    "ConnectionStrings__LearnOnlineDb is not set. Copy Backend/LearnOnline/.env.example to .env and fill it in.");

            var database = new NpgsqlConnectionStringBuilder(connectionString).Database;
            if (string.Equals(database, SharedDatabase, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"Refusing to start against the shared '{SharedDatabase}' database. Point ConnectionStrings__LearnOnlineDb at your own database.");
        }
    }
}
