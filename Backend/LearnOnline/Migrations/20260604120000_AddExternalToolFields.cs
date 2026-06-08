using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
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
