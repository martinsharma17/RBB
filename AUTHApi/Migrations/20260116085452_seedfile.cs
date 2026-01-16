using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class seedfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsKycExportEnabled",
                table: "ProjectSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsKycExportEnabled",
                table: "ProjectSettings");
        }
    }
}
