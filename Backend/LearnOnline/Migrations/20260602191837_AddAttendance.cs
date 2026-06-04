using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use raw SQL with IF NOT EXISTS so this migration is idempotent.
            // The table may already exist if EnsureCreated() ran before this migration
            // was recorded in __EFMigrationsHistory.
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""Attendances"" (
                    ""Id""           text NOT NULL,
                    ""Date""         timestamp with time zone NOT NULL,
                    ""Status""       text NOT NULL,
                    ""SessionType""  text NOT NULL DEFAULT 'Lecture',
                    ""Time""         text NULL,
                    ""RecordedAt""   timestamp with time zone NOT NULL,
                    ""CourseId""     text NOT NULL,
                    ""StudentId""    text NOT NULL,
                    ""RecordedById"" text NOT NULL,
                    CONSTRAINT ""PK_Attendances"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Attendances_Courses_CourseId""
                        FOREIGN KEY (""CourseId"") REFERENCES ""Courses"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_Attendances_Users_RecordedById""
                        FOREIGN KEY (""RecordedById"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_Attendances_Users_StudentId""
                        FOREIGN KEY (""StudentId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ""IX_Attendances_CourseId""     ON ""Attendances"" (""CourseId"");
                CREATE INDEX IF NOT EXISTS ""IX_Attendances_RecordedById""  ON ""Attendances"" (""RecordedById"");
                CREATE INDEX IF NOT EXISTS ""IX_Attendances_StudentId""     ON ""Attendances"" (""StudentId"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attendances");
        }
    }
}
