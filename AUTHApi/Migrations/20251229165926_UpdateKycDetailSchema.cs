using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateKycDetailSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "KycDetails");

            migrationBuilder.AddColumn<DateTime>(
                name: "AgreementDate",
                table: "KycDetails",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CibBlacklistDetails",
                table: "KycDetails",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CriminalRecordDetails",
                table: "KycDetails",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianAddress",
                table: "KycDetails",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianContactNo",
                table: "KycDetails",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianName",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianRelationship",
                table: "KycDetails",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasBeneficialOwner",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasCriminalRecord",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasOtherBrokerAccount",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCibBlacklisted",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPep",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MajorSourceOfIncome",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherBrokerNames",
                table: "KycDetails",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PepRelation",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "KycDetails",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<string>(
                name: "SourceOfFunds",
                table: "KycDetails",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TermsAgreed",
                table: "KycDetails",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgreementDate",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "CibBlacklistDetails",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "CriminalRecordDetails",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "GuardianAddress",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "GuardianContactNo",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "GuardianName",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "GuardianRelationship",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "HasBeneficialOwner",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "HasCriminalRecord",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "HasOtherBrokerAccount",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "IsCibBlacklisted",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "IsPep",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "MajorSourceOfIncome",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "OtherBrokerNames",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "PepRelation",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "SourceOfFunds",
                table: "KycDetails");

            migrationBuilder.DropColumn(
                name: "TermsAgreed",
                table: "KycDetails");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "KycDetails",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
