using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddTwoFactorAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF NOT EXISTS throughout because several of these objects were
            // already created by hand-written SQL migrations applied directly to
            // the database before the snapshot was regenerated.
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""TwoFactorEnabled"" boolean NOT NULL DEFAULT FALSE;
                ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""TwoFactorSecret"" text NULL;
                ALTER TABLE ""Courses"" ADD COLUMN IF NOT EXISTS ""Content"" text NULL;
                ALTER TABLE ""Attendances"" ADD COLUMN IF NOT EXISTS ""CheckInSessionId"" text NULL;

                CREATE TABLE IF NOT EXISTS ""AssignmentClassOverrides"" (
                    ""Id"" text NOT NULL,
                    ""AssignmentId"" text NOT NULL,
                    ""ClassGroupId"" text NOT NULL,
                    ""DueDate"" timestamp with time zone NOT NULL,
                    ""OpenDate"" timestamp with time zone NULL,
                    ""CloseDate"" timestamp with time zone NULL,
                    CONSTRAINT ""PK_AssignmentClassOverrides"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_AssignmentClassOverrides_Assignments_AssignmentId""
                        FOREIGN KEY (""AssignmentId"") REFERENCES ""Assignments"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_AssignmentClassOverrides_ClassGroups_ClassGroupId""
                        FOREIGN KEY (""ClassGroupId"") REFERENCES ""ClassGroups"" (""Id"") ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ""AttendanceSessions"" (
                    ""Id"" text NOT NULL,
                    ""ClassGroupId"" text NOT NULL,
                    ""SessionDate"" timestamp with time zone NOT NULL,
                    ""LecturerId"" text NOT NULL,
                    CONSTRAINT ""PK_AttendanceSessions"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_AttendanceSessions_ClassGroups_ClassGroupId""
                        FOREIGN KEY (""ClassGroupId"") REFERENCES ""ClassGroups"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_AttendanceSessions_Users_LecturerId""
                        FOREIGN KEY (""LecturerId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ""CheckInSessions"" (
                    ""Id"" text NOT NULL,
                    ""Code"" text NOT NULL,
                    ""CourseId"" text NOT NULL,
                    ""TeacherId"" text NOT NULL,
                    ""Date"" timestamp with time zone NOT NULL,
                    ""SessionType"" text NOT NULL,
                    ""IsOpen"" boolean NOT NULL,
                    ""OpenedAt"" timestamp with time zone NOT NULL,
                    ""ClosedAt"" timestamp with time zone NULL,
                    ""LateAfterMinutes"" integer NULL,
                    ""AutoCloseAt"" timestamp with time zone NULL,
                    CONSTRAINT ""PK_CheckInSessions"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_CheckInSessions_Courses_CourseId""
                        FOREIGN KEY (""CourseId"") REFERENCES ""Courses"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_CheckInSessions_Users_TeacherId""
                        FOREIGN KEY (""TeacherId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ""AttendanceRecords"" (
                    ""Id"" text NOT NULL,
                    ""AttendanceSessionId"" text NOT NULL,
                    ""StudentId"" text NOT NULL,
                    ""Status"" text NOT NULL,
                    ""Remarks"" text NULL,
                    CONSTRAINT ""PK_AttendanceRecords"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_AttendanceRecords_AttendanceSessions_AttendanceSessionId""
                        FOREIGN KEY (""AttendanceSessionId"") REFERENCES ""AttendanceSessions"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_AttendanceRecords_Users_StudentId""
                        FOREIGN KEY (""StudentId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS ""IX_Attendances_CheckInSessionId"" ON ""Attendances"" (""CheckInSessionId"");
                CREATE INDEX IF NOT EXISTS ""IX_AssignmentClassOverrides_AssignmentId"" ON ""AssignmentClassOverrides"" (""AssignmentId"");
                CREATE INDEX IF NOT EXISTS ""IX_AssignmentClassOverrides_ClassGroupId"" ON ""AssignmentClassOverrides"" (""ClassGroupId"");
                CREATE INDEX IF NOT EXISTS ""IX_AttendanceRecords_AttendanceSessionId"" ON ""AttendanceRecords"" (""AttendanceSessionId"");
                CREATE INDEX IF NOT EXISTS ""IX_AttendanceRecords_StudentId"" ON ""AttendanceRecords"" (""StudentId"");
                CREATE INDEX IF NOT EXISTS ""IX_AttendanceSessions_ClassGroupId"" ON ""AttendanceSessions"" (""ClassGroupId"");
                CREATE INDEX IF NOT EXISTS ""IX_AttendanceSessions_LecturerId"" ON ""AttendanceSessions"" (""LecturerId"");
                CREATE INDEX IF NOT EXISTS ""IX_CheckInSessions_CourseId"" ON ""CheckInSessions"" (""CourseId"");
                CREATE INDEX IF NOT EXISTS ""IX_CheckInSessions_TeacherId"" ON ""CheckInSessions"" (""TeacherId"");

                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'FK_Attendances_CheckInSessions_CheckInSessionId'
                    ) THEN
                        ALTER TABLE ""Attendances""
                        ADD CONSTRAINT ""FK_Attendances_CheckInSessions_CheckInSessionId""
                        FOREIGN KEY (""CheckInSessionId"") REFERENCES ""CheckInSessions"" (""Id"");
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendances_CheckInSessions_CheckInSessionId",
                table: "Attendances");

            migrationBuilder.DropTable(
                name: "AssignmentClassOverrides");

            migrationBuilder.DropTable(
                name: "AttendanceRecords");

            migrationBuilder.DropTable(
                name: "CheckInSessions");

            migrationBuilder.DropTable(
                name: "AttendanceSessions");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_CheckInSessionId",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "TwoFactorEnabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwoFactorSecret",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "CheckInSessionId",
                table: "Attendances");
        }
    }
}
