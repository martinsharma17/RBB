using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class RenameWorkflowLogColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ToRoleId",
                table: "KycApprovalLogs",
                newName: "ForwardedToRoleId");

            migrationBuilder.RenameColumn(
                name: "FromRoleId",
                table: "KycApprovalLogs",
                newName: "ActionedByRoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ForwardedToRoleId",
                table: "KycApprovalLogs",
                newName: "ToRoleId");

            migrationBuilder.RenameColumn(
                name: "ActionedByRoleId",
                table: "KycApprovalLogs",
                newName: "FromRoleId");
        }
    }
}
