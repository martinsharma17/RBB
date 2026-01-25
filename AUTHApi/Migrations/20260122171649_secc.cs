using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class secc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KycDetails_KycFormSessions_SessionId",
                table: "KycDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_KycFormSessions_KycDetails_KycDetailId",
                table: "KycFormSessions");

            migrationBuilder.DropIndex(
                name: "IX_KycFormSessions_KycDetailId",
                table: "KycFormSessions");

            migrationBuilder.DropIndex(
                name: "IX_KycDetails_SessionId",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "KycDetailId",
                table: "KycFormSessions");

            migrationBuilder.CreateIndex(
                name: "IX_KycDetails_SessionId",
                table: "KycDetails",
                column: "SessionId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_KycDetails_KycFormSessions_SessionId",
                table: "KycDetails",
                column: "SessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KycDetails_KycFormSessions_SessionId",
                table: "KycDetails");

            migrationBuilder.DropIndex(
                name: "IX_KycDetails_SessionId",
                table: "KycDetails");

            migrationBuilder.AddColumn<int>(
                name: "KycDetailId",
                table: "KycFormSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycFormSessions_KycDetailId",
                table: "KycFormSessions",
                column: "KycDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_KycDetails_SessionId",
                table: "KycDetails",
                column: "SessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_KycDetails_KycFormSessions_SessionId",
                table: "KycDetails",
                column: "SessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_KycFormSessions_KycDetails_KycDetailId",
                table: "KycFormSessions",
                column: "KycDetailId",
                principalTable: "KycDetails",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
