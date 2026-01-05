using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class kycupdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalChain",
                table: "KycApprovalConfigs");

            migrationBuilder.CreateTable(
                name: "KycApprovalSteps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConfigId = table.Column<int>(type: "integer", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    StepOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycApprovalSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycApprovalSteps_KycApprovalConfigs_ConfigId",
                        column: x => x.ConfigId,
                        principalTable: "KycApprovalConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KycApprovalSteps_ConfigId",
                table: "KycApprovalSteps",
                column: "ConfigId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KycApprovalSteps");

            migrationBuilder.AddColumn<string>(
                name: "ApprovalChain",
                table: "KycApprovalConfigs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
