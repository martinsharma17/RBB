using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class kycremarks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "KycSessionId",
                table: "KycApprovalLogs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_KycApprovalLogs_KycSessionId",
                table: "KycApprovalLogs",
                column: "KycSessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_KycApprovalLogs_KycFormSessions_KycSessionId",
                table: "KycApprovalLogs",
                column: "KycSessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KycApprovalLogs_KycFormSessions_KycSessionId",
                table: "KycApprovalLogs");

            migrationBuilder.DropIndex(
                name: "IX_KycApprovalLogs_KycSessionId",
                table: "KycApprovalLogs");

            migrationBuilder.DropColumn(
                name: "KycSessionId",
                table: "KycApprovalLogs");
        }
    }
}
