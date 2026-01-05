using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFullChainToWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentOrderLevel",
                table: "KycWorkflowMasters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FullChain",
                table: "KycWorkflowMasters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SubmittedOrderLevel",
                table: "KycWorkflowMasters",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentOrderLevel",
                table: "KycWorkflowMasters");

            migrationBuilder.DropColumn(
                name: "FullChain",
                table: "KycWorkflowMasters");

            migrationBuilder.DropColumn(
                name: "SubmittedOrderLevel",
                table: "KycWorkflowMasters");
        }
    }
}
