using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;

var builder = WebApplication.CreateBuilder(args);

// Register MVC controllers so ASP.NET can discover our API endpoints
// Enums are serialized as strings so the React app can send readable role values
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Allow the React frontend (Vite dev server) to call our API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Swagger / OpenAPI for interactive API docs at /swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddOpenApi();

// Register HttpClient so controllers can call external services like Google token validation
builder.Services.AddHttpClient();

// Register the EF Core database context with the PostgreSQL connection string
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("LearnOnlineDb")));

var app = builder.Build();

// ----- Ensure migration history and apply pending migrations -----
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
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
            ALTER TABLE ""Courses"" DROP COLUMN IF EXISTS ""IsVisible"";
            ALTER TABLE ""Courses"" DROP COLUMN IF EXISTS ""Degree"";";
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
    RealDataSeeder.Seed(context); // swap to DbSeeder.Seed(context) for mock data
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
