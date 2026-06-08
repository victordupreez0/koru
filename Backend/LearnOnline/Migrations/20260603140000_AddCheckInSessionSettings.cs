using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApi.Migrations
{
    public partial class AddCheckInSessionSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""CheckInSessions"" ADD COLUMN IF NOT EXISTS ""LateAfterMinutes"" integer NULL;
                ALTER TABLE ""CheckInSessions"" ADD COLUMN IF NOT EXISTS ""AutoCloseAt"" timestamp with time zone NULL;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""CheckInSessions"" DROP COLUMN IF EXISTS ""LateAfterMinutes"";
                ALTER TABLE ""CheckInSessions"" DROP COLUMN IF EXISTS ""AutoCloseAt"";
            ");
        }
    }
}
