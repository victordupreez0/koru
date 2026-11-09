using Npgsql;

namespace LearnOnline.Helpers
{
    // Every backend start writes to its database (schema patches, seeding). Set
    // KORU_DB_GUARD=true to stop the app before it connects when the connection
    // string is missing or points at the team's shared database.
    public static class DatabaseGuard
    {
        private const string EnabledVariable = "KORU_DB_GUARD";

        // The team's shared Aiven database.
        private const string SharedDatabase = "defaultdb";

        public static void EnsureSafe(string? connectionString)
        {
            if (!string.Equals(Environment.GetEnvironmentVariable(EnabledVariable), "true", StringComparison.OrdinalIgnoreCase))
                return;

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
