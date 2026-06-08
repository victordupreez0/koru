using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    public partial class AddCheckInSession : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
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

                ALTER TABLE ""Attendances""
                    ADD COLUMN IF NOT EXISTS ""CheckInSessionId"" text NULL;

                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'FK_Attendances_CheckInSessions_CheckInSessionId'
                    ) THEN
                        ALTER TABLE ""Attendances""
                            ADD CONSTRAINT ""FK_Attendances_CheckInSessions_CheckInSessionId""
                            FOREIGN KEY (""CheckInSessionId"") REFERENCES ""CheckInSessions"" (""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;

                CREATE INDEX IF NOT EXISTS ""IX_Attendances_CheckInSessionId"" ON ""Attendances"" (""CheckInSessionId"");
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Attendances"" DROP COLUMN IF EXISTS ""CheckInSessionId"";
                DROP TABLE IF EXISTS ""CheckInSessions"";
            ");
        }
    }
}
