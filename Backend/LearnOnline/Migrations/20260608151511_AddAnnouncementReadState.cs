using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncementReadState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnnouncementReadStates",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AnnouncementId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementReadStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementReadStates_Announcements_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementReadStates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReadStates_AnnouncementId_UserId",
                table: "AnnouncementReadStates",
                columns: new[] { "AnnouncementId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReadStates_UserId",
                table: "AnnouncementReadStates",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementReadStates");
        }
    }
}
