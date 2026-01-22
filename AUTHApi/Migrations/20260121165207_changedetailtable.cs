using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class changedetailtable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChildrenNames",
                table: "KycDetails",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentCountry",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianOccupation",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NidNumber",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentCountry",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentFullAddress",
                table: "KycDetails",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChildrenNames",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "CurrentCountry",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "GuardianOccupation",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "NidNumber",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "PermanentCountry",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "PermanentFullAddress",
                table: "KycDetails");
        }
    }
}
