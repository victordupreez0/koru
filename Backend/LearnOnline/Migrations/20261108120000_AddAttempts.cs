using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace LearnOnline.Migrations
{
    // Raw SQL like the other recent migrations: the EF snapshot in this project is stale,
    // so a generated migration would try to recreate tables that already exist.
    [DbContext(typeof(LearnOnline.Data.AppDbContext))]
    [Migration("20261108120000_AddAttempts")]
    public partial class AddAttempts : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""Attempts"" (
                    ""Id"" text NOT NULL,
                    ""StudentId"" text NOT NULL,
                    ""PageId"" text NOT NULL,
                    ""BlockId"" text NOT NULL,
                    ""AnswerJson"" text NOT NULL,
                    ""Passed"" boolean NOT NULL,
                    ""Score"" double precision NOT NULL,
                    ""MaxScore"" double precision NOT NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_Attempts"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Attempts_Users_StudentId"" FOREIGN KEY (""StudentId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ""IX_Attempts_PageId_BlockId"" ON ""Attempts"" (""PageId"", ""BlockId"");
                CREATE INDEX IF NOT EXISTS ""IX_Attempts_StudentId"" ON ""Attempts"" (""StudentId"");
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""Attempts"";");
        }
    }
}
