using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class missingkyc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BeneficialOwnerDetails",
                table: "KycDetails",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BeneficialOwnerDetails",
                table: "KycDetails");
        }
    }
}
