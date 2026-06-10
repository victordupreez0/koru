using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    public partial class AddClassNameTeacherDuration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Classes"" ADD COLUMN IF NOT EXISTS ""Name"" text NULL;
                ALTER TABLE ""Classes"" ADD COLUMN IF NOT EXISTS ""TeacherId"" text NULL;
                ALTER TABLE ""Classes"" ADD COLUMN IF NOT EXISTS ""DurationHours"" numeric NULL;
                CREATE INDEX IF NOT EXISTS ""IX_Classes_TeacherId"" ON ""Classes"" (""TeacherId"");
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS ""IX_Classes_TeacherId"";
                ALTER TABLE ""Classes"" DROP COLUMN IF EXISTS ""Name"";
                ALTER TABLE ""Classes"" DROP COLUMN IF EXISTS ""TeacherId"";
                ALTER TABLE ""Classes"" DROP COLUMN IF EXISTS ""DurationHours"";
            ");
        }
    }
}
