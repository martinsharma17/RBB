using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class verifyapi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VerificationToken",
                table: "KycFormSessions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerificationTokenExpiry",
                table: "KycFormSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerifiedFromIp",
                table: "KycFormSessions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerifiedUserAgent",
                table: "KycFormSessions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VerificationToken",
                table: "KycFormSessions");

            migrationBuilder.DropColumn(
                name: "VerificationTokenExpiry",
                table: "KycFormSessions");

            migrationBuilder.DropColumn(
                name: "VerifiedFromIp",
                table: "KycFormSessions");

            migrationBuilder.DropColumn(
                name: "VerifiedUserAgent",
                table: "KycFormSessions");
        }
    }
}
