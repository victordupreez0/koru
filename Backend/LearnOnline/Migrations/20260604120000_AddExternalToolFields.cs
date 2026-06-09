using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace LearnOnline.Migrations
{
    [DbContext(typeof(LearnOnline.Data.AppDbContext))]
    [Migration("20260604120000_AddExternalToolFields")]
    public partial class AddExternalToolFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Assignments""
                    ADD COLUMN IF NOT EXISTS ""ExternalToolName"" text NULL,
                    ADD COLUMN IF NOT EXISTS ""ExternalToolUrl""  text NULL;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Assignments""
                    DROP COLUMN IF EXISTS ""ExternalToolName"",
                    DROP COLUMN IF EXISTS ""ExternalToolUrl"";
            ");
        }
    }
}
