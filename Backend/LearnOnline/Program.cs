using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;

// Load local secrets (e.g. DEEPSEEK_API_KEY) from .env before configuration is built.
// Real environment variables always win, so Docker/hosting settings are never overridden.
LoadDotEnv(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
LoadDotEnv(Path.Combine(Directory.GetCurrentDirectory(), "LearnOnline", ".env"));

var builder = WebApplication.CreateBuilder(args);

// Register MVC controllers so ASP.NET can discover our API endpoints
// Enums are serialized as strings so the React app can send readable role values
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Allow the React frontend (Vite dev server and packaged Electron app) to call our API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
                  "http://localhost:5200",
                  "http://localhost:5201",
                  "http://127.0.0.1:5200",
                  "http://127.0.0.1:5201")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Swagger / OpenAPI for interactive API docs at /swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddOpenApi();

// Register HttpClient so controllers can call external services like Google token validation
builder.Services.AddHttpClient();

// Assistant: DeepSeek first, Groq as the backup
builder.Services.AddSingleton<LearnOnline.Services.Assistant.IChatProvider>(sp => new LearnOnline.Services.Assistant.ChatProvider(
    LearnOnline.Services.Assistant.ProviderSettings.DeepSeek, sp.GetRequiredService<IConfiguration>(),
    sp.GetRequiredService<IHttpClientFactory>(), sp.GetRequiredService<ILogger<LearnOnline.Services.Assistant.ChatProvider>>()));
builder.Services.AddSingleton<LearnOnline.Services.Assistant.IChatProvider>(sp => new LearnOnline.Services.Assistant.ChatProvider(
    LearnOnline.Services.Assistant.ProviderSettings.Groq, sp.GetRequiredService<IConfiguration>(),
    sp.GetRequiredService<IHttpClientFactory>(), sp.GetRequiredService<ILogger<LearnOnline.Services.Assistant.ChatProvider>>()));
builder.Services.AddSingleton<LearnOnline.Services.Assistant.ProviderFallback>();
builder.Services.AddScoped<LearnOnline.Services.Assistant.IAssistantContextBuilder, LearnOnline.Services.Assistant.AssistantContextBuilder>();
builder.Services.AddScoped<LearnOnline.Services.Assistant.IAssistantComposer, LearnOnline.Services.Assistant.AssistantComposer>();

// Register the EF Core database context with the PostgreSQL connection string
// PendingModelChangesWarning is suppressed because migrations in this project use raw SQL
// and intentionally don't update the EF snapshot.
var connectionString = builder.Configuration.GetConnectionString("LearnOnlineDb");
LearnOnline.Helpers.DatabaseGuard.EnsureSafe(connectionString);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

var app = builder.Build();

// ----- Ensure migration history and apply pending migrations -----
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // A brand-new database has no tables, so the ALTER TABLE patches below would fail.
    // Build the schema from the model and mark every migration as already applied.
    if (context.Database.EnsureCreated())
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                ""MigrationId"" character varying(150) NOT NULL,
                ""ProductVersion"" character varying(32) NOT NULL,
                CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
            );");
        foreach (var migrationId in context.Database.GetMigrations())
            context.Database.ExecuteSqlRaw(
                @"INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") VALUES ({0}, '9.0.3') ON CONFLICT DO NOTHING;",
                migrationId);
    }

    var conn = context.Database.GetDbConnection();
    conn.Open();
    using (var cmd = conn.CreateCommand())
    {
        // Mark the two original migrations as applied if they aren't yet
        // (the tables already exist from a prior deployment without EF history)
        cmd.CommandText = @"
            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                ""MigrationId"" character varying(150) NOT NULL,
                ""ProductVersion"" character varying(32) NOT NULL,
                CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
            );
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260324193947_InitLearnOnline', '9.0.3')
            ON CONFLICT DO NOTHING;
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260422151017_AddNoteTitle', '9.0.3')
            ON CONFLICT DO NOTHING;
            ALTER TABLE ""Assignments"" ADD COLUMN IF NOT EXISTS ""AllowMultipleAttempts"" boolean NOT NULL DEFAULT FALSE;
            ALTER TABLE ""Assignments"" ADD COLUMN IF NOT EXISTS ""IsClosed"" boolean NOT NULL DEFAULT FALSE;
            ALTER TABLE ""Assignments"" ADD COLUMN IF NOT EXISTS ""QuizQuestionsJson"" text NULL;
            ALTER TABLE ""Assignments"" ADD COLUMN IF NOT EXISTS ""Type"" text NOT NULL DEFAULT 'online';
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260525083558_AddAssignmentTypeAndClose', '9.0.3')
            ON CONFLICT DO NOTHING;
            ALTER TABLE ""Assignments"" ADD COLUMN IF NOT EXISTS ""OpenDate"" timestamp with time zone NULL;
            ALTER TABLE ""Assignments"" ADD COLUMN IF NOT EXISTS ""CloseDate"" timestamp with time zone NULL;
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260525120000_AddAssignmentOpenCloseDate', '9.0.3')
            ON CONFLICT DO NOTHING;
            ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""Content"" text NULL;
            ALTER TABLE ""Attendances"" ADD COLUMN IF NOT EXISTS ""CheckInSessionId"" text NULL;
            CREATE TABLE IF NOT EXISTS ""CheckInSessions"" (
                ""Id""          text NOT NULL,
                ""Code""        text NOT NULL,
                ""CourseId""    text NOT NULL,
                ""TeacherId""   text NOT NULL,
                ""Date""        timestamp with time zone NOT NULL,
                ""SessionType"" text NOT NULL DEFAULT 'Lecture',
                ""IsOpen""      boolean NOT NULL DEFAULT TRUE,
                ""OpenedAt""    timestamp with time zone NOT NULL,
                ""ClosedAt""    timestamp with time zone NULL,
                CONSTRAINT ""PK_CheckInSessions"" PRIMARY KEY (""Id""),
                CONSTRAINT ""FK_CheckInSessions_Courses_CourseId""
                    FOREIGN KEY (""CourseId"") REFERENCES ""Courses"" (""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_CheckInSessions_Users_TeacherId""
                    FOREIGN KEY (""TeacherId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS ""IX_CheckInSessions_CourseId""  ON ""CheckInSessions"" (""CourseId"");
            CREATE INDEX IF NOT EXISTS ""IX_CheckInSessions_TeacherId"" ON ""CheckInSessions"" (""TeacherId"");
            CREATE INDEX IF NOT EXISTS ""IX_Attendances_CheckInSessionId"" ON ""Attendances"" (""CheckInSessionId"");
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260602191837_AddAttendance', '9.0.3')
            ON CONFLICT DO NOTHING;
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260603120000_AddCheckInSession', '9.0.3')
            ON CONFLICT DO NOTHING;
            ALTER TABLE ""CheckInSessions"" ADD COLUMN IF NOT EXISTS ""LateAfterMinutes"" integer NULL;
            ALTER TABLE ""CheckInSessions"" ADD COLUMN IF NOT EXISTS ""AutoCloseAt"" timestamp with time zone NULL;
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260603140000_AddCheckInSessionSettings', '9.0.3')
            ON CONFLICT DO NOTHING;
            -- Ensure IsVisible/Degree columns exist (in case Rikus's migration hasn't run yet),
            -- then flip all existing courses to published so the Courses page isn't empty.
            ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""IsVisible"" boolean NOT NULL DEFAULT FALSE;
            ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""Degree"" text NULL;
            UPDATE ""Courses"" SET ""IsVisible"" = TRUE WHERE ""IsVisible"" = FALSE;

            -- Add Name/Code directly on Course (replaces Subject join for display).
            -- Backfill from Subjects for any existing rows that don't have them yet.
            ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""Name"" text NULL;
            ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""Code"" text NULL;
            ALTER TABLE ""Courses"" DROP CONSTRAINT IF EXISTS ""FK_Courses_Subjects_SubjectId"";
            DROP INDEX IF EXISTS ""IX_Courses_SubjectId"";
            ALTER TABLE ""Courses"" ALTER COLUMN ""SubjectId"" DROP NOT NULL;
            UPDATE ""Courses"" c
            SET ""Name"" = s.""Name"", ""Code"" = s.""Code""
            FROM ""Subjects"" s
            WHERE c.""SubjectId"" = s.""Id"" AND c.""Name"" IS NULL;
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260609180000_AddCourseNameCode', '9.0.3')
            ON CONFLICT DO NOTHING;
            -- Add Name, TeacherId, DurationHours to Classes for timetabling configuration
            ALTER TABLE ""Classes"" ADD COLUMN IF NOT EXISTS ""Name"" text NULL;
            ALTER TABLE ""Classes"" ADD COLUMN IF NOT EXISTS ""TeacherId"" text NULL;
            ALTER TABLE ""Classes"" ADD COLUMN IF NOT EXISTS ""DurationHours"" numeric NULL;
            CREATE INDEX IF NOT EXISTS ""IX_Classes_TeacherId"" ON ""Classes"" (""TeacherId"");
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260609190000_AddClassNameTeacherDuration', '9.0.3')
            ON CONFLICT DO NOTHING;
            -- Allow timetables to be created without a specific user FK
            ALTER TABLE ""Timetables"" ALTER COLUMN ""UserId"" DROP NOT NULL;
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260609200000_MakeTimetableUserIdNullable', '9.0.3')
            ON CONFLICT DO NOTHING;";
        cmd.ExecuteNonQuery();
    }
    conn.Close();
    context.Database.Migrate();
}

// ----- Execute the Database Seeder -----
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var logger  = services.GetRequiredService<ILogger<Program>>();
    try
    {
        RealDataSeeder.Seed(context); // swap to DbSeeder.Seed(context) for mock data
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "RealDataSeeder threw an exception. Database may be in a partial state.");
    }

    // Backfill a random DiceBear avatar for any user without a profile picture
    try
    {
        var usersWithoutAvatar = context.Users
            .Where(u => u.ProfileImageUrl == null || u.ProfileImageUrl == "")
            .ToList();
        foreach (var u in usersWithoutAvatar)
            u.ProfileImageUrl = LearnOnline.Helpers.AvatarHelper.ForSeed(u.Id);
        if (usersWithoutAvatar.Count > 0)
            context.SaveChanges();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Avatar backfill failed.");
    }
}
// ---------------------------------------

// In development, expose Swagger UI and the OpenAPI endpoint
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Serve files from wwwroot (student submission uploads live under /uploads)
app.UseStaticFiles();

// Enable CORS before auth so preflight requests succeed
app.UseCors("AllowFrontend");

app.UseAuthorization();

// Map all controller routes (e.g. /api/Event, /api/User, etc.)
app.MapControllers();

app.Run();

// Loads KEY=VALUE lines from a local, gitignored .env file into the environment
// (e.g. DEEPSEEK_API_KEY). Variables that are already set win, so real
// environment variables and Docker settings always take precedence.
// Supports optional surrounding matching quotes in values.
static void LoadDotEnv(string path)
{
    if (!File.Exists(path)) return;
    foreach (var raw in File.ReadAllLines(path))
    {
        var line = raw.Trim();
        if (line.Length == 0 || line.StartsWith('#')) continue;
        var eq = line.IndexOf('=');
        if (eq <= 0) continue;
        var key = line[..eq].Trim();
        var value = line[(eq + 1)..].Trim();
        if (value.Length >= 2 && (value[0] == '"' || value[0] == '\'') && value[^1] == value[0])
            value = value[1..^1];
        if (Environment.GetEnvironmentVariable(key) == null)
            Environment.SetEnvironmentVariable(key, value);
    }
}
