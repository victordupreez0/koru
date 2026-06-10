using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace LearnOnline.Migrations
{
    [DbContext(typeof(LearnOnline.Data.AppDbContext))]
    [Migration("20260610120000_AddAssignmentClassGroupId")]
    public partial class AddAssignmentClassGroupId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Assignments""
                    ADD COLUMN IF NOT EXISTS ""ClassGroupId"" text NULL;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Assignments""
                    DROP COLUMN IF EXISTS ""ClassGroupId"";
            ");
        }
    }
}
