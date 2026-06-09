using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseNameCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""Name"" text NULL;
                ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""Code"" text NULL;

                ALTER TABLE ""Courses"" DROP CONSTRAINT IF EXISTS ""FK_Courses_Subjects_SubjectId"";
                DROP INDEX IF EXISTS ""IX_Courses_SubjectId"";
                ALTER TABLE ""Courses"" ALTER COLUMN ""SubjectId"" DROP NOT NULL;

                UPDATE ""Courses""
                SET ""Name"" = s.""Name"",
                    ""Code"" = s.""Code""
                FROM ""Subjects"" s
                WHERE ""Courses"".""SubjectId"" = s.""Id""
                  AND ""Courses"".""Name"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Courses"" DROP COLUMN IF EXISTS ""Name"";
                ALTER TABLE ""Courses"" DROP COLUMN IF EXISTS ""Code"";
                ALTER TABLE ""Courses"" ALTER COLUMN ""SubjectId"" SET NOT NULL;
                CREATE INDEX IF NOT EXISTS ""IX_Courses_SubjectId"" ON ""Courses"" (""SubjectId"");
                ALTER TABLE ""Courses""
                    ADD CONSTRAINT ""FK_Courses_Subjects_SubjectId""
                    FOREIGN KEY (""SubjectId"") REFERENCES ""Subjects"" (""Id"") ON DELETE CASCADE;
            ");
        }
    }
}
