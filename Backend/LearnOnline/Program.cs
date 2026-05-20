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

// ----- Execute the Database Seeder -----
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    DbSeeder.Seed(context);
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

// Enable CORS before auth so preflight requests succeed
app.UseCors("AllowFrontend");

app.UseAuthorization();

// Map all controller routes (e.g. /api/Event, /api/User, etc.)
app.MapControllers();

app.Run();
