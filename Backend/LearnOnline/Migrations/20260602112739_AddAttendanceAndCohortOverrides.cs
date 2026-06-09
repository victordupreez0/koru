using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceAndCohortOverrides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Timetables_TimetableId",
                table: "Classes");

            migrationBuilder.AddColumn<string>(
                name: "ClassGroupId",
                table: "Enrollments",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TimetableId",
                table: "Classes",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ClassGroupId",
                table: "Classes",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClassGroups",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CourseId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassGroups_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AssignmentClassOverrides",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AssignmentId = table.Column<string>(type: "text", nullable: false),
                    ClassGroupId = table.Column<string>(type: "text", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OpenDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CloseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignmentClassOverrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssignmentClassOverrides_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignmentClassOverrides_ClassGroups_ClassGroupId",
                        column: x => x.ClassGroupId,
                        principalTable: "ClassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceSessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ClassGroupId = table.Column<string>(type: "text", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LecturerId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceSessions_ClassGroups_ClassGroupId",
                        column: x => x.ClassGroupId,
                        principalTable: "ClassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttendanceSessions_Users_LecturerId",
                        column: x => x.LecturerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceRecords",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AttendanceSessionId = table.Column<string>(type: "text", nullable: false),
                    StudentId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Remarks = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceRecords_AttendanceSessions_AttendanceSessionId",
                        column: x => x.AttendanceSessionId,
                        principalTable: "AttendanceSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttendanceRecords_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_ClassGroupId",
                table: "Enrollments",
                column: "ClassGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Classes_ClassGroupId",
                table: "Classes",
                column: "ClassGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentClassOverrides_AssignmentId",
                table: "AssignmentClassOverrides",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentClassOverrides_ClassGroupId",
                table: "AssignmentClassOverrides",
                column: "ClassGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_AttendanceSessionId",
                table: "AttendanceRecords",
                column: "AttendanceSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_StudentId",
                table: "AttendanceRecords",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_ClassGroupId",
                table: "AttendanceSessions",
                column: "ClassGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_LecturerId",
                table: "AttendanceSessions",
                column: "LecturerId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassGroups_CourseId",
                table: "ClassGroups",
                column: "CourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_ClassGroups_ClassGroupId",
                table: "Classes",
                column: "ClassGroupId",
                principalTable: "ClassGroups",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Timetables_TimetableId",
                table: "Classes",
                column: "TimetableId",
                principalTable: "Timetables",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_ClassGroups_ClassGroupId",
                table: "Enrollments",
                column: "ClassGroupId",
                principalTable: "ClassGroups",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Classes_ClassGroups_ClassGroupId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Timetables_TimetableId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_ClassGroups_ClassGroupId",
                table: "Enrollments");

            migrationBuilder.DropTable(
                name: "AssignmentClassOverrides");

            migrationBuilder.DropTable(
                name: "AttendanceRecords");

            migrationBuilder.DropTable(
                name: "AttendanceSessions");

            migrationBuilder.DropTable(
                name: "ClassGroups");

            migrationBuilder.DropIndex(
                name: "IX_Enrollments_ClassGroupId",
                table: "Enrollments");

            migrationBuilder.DropIndex(
                name: "IX_Classes_ClassGroupId",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "ClassGroupId",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "ClassGroupId",
                table: "Classes");

            migrationBuilder.AlterColumn<string>(
                name: "TimetableId",
                table: "Classes",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Timetables_TimetableId",
                table: "Classes",
                column: "TimetableId",
                principalTable: "Timetables",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
