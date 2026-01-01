using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateKycDetailWithNewFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TermsAgreed",
                table: "KycDetails",
                newName: "NoOtherFinancialLiability");

            migrationBuilder.AddColumn<bool>(
                name: "AgreeToTerms",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllInformationTrue",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountType",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessType",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DaughterName",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeIdNo",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianEmail",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianPanNumber",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationDistance",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationLandmark",
                table: "KycDetails",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationLatitude",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationLongitude",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationSketchJson",
                table: "KycDetails",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MarginTradingFacility",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OtherOccupation",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServiceSector",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SonName",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TradingLimit",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgreeToTerms",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "AllInformationTrue",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "BankAccountType",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "BusinessType",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "DaughterName",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "EmployeeIdNo",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "GuardianEmail",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "GuardianPanNumber",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "LocationDistance",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "LocationLandmark",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "LocationLatitude",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "LocationLongitude",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "LocationSketchJson",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "MarginTradingFacility",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "OtherOccupation",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "ServiceSector",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "SonName",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "TradingLimit",
                table: "KycDetails");

            migrationBuilder.RenameColumn(
                name: "NoOtherFinancialLiability",
                table: "KycDetails",
                newName: "TermsAgreed");
        }
    }
}
