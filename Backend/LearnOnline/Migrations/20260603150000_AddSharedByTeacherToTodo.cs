using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace LearnOnline.Migrations
{
    [DbContext(typeof(LearnOnline.Data.AppDbContext))]
    [Migration("20260603150000_AddSharedByTeacherToTodo")]
    public partial class AddSharedByTeacherToTodo : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SharedByTeacherId",
                table: "TodoItems",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TodoItems_SharedByTeacherId",
                table: "TodoItems",
                column: "SharedByTeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_TodoItems_Users_SharedByTeacherId",
                table: "TodoItems",
                column: "SharedByTeacherId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TodoItems_Users_SharedByTeacherId",
                table: "TodoItems");

            migrationBuilder.DropIndex(
                name: "IX_TodoItems_SharedByTeacherId",
                table: "TodoItems");

            migrationBuilder.DropColumn(
                name: "SharedByTeacherId",
                table: "TodoItems");
        }
    }
}
