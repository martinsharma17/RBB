using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class kyclog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "KycDetails");

            migrationBuilder.CreateTable(
                name: "KycApprovalConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ApprovalChain = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycApprovalConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KycWorkflowMasters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KycSessionId = table.Column<int>(type: "integer", nullable: false),
                    SubmittedRoleId = table.Column<string>(type: "text", nullable: true),
                    CurrentRoleId = table.Column<string>(type: "text", nullable: true),
                    PendingLevel = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LastRemarks = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycWorkflowMasters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycWorkflowMasters_KycFormSessions_KycSessionId",
                        column: x => x.KycSessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "KycApprovalLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KycWorkflowId = table.Column<int>(type: "integer", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Remarks = table.Column<string>(type: "text", nullable: true),
                    FromRoleId = table.Column<string>(type: "text", nullable: true),
                    ToRoleId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycApprovalLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycApprovalLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KycApprovalLogs_KycWorkflowMasters_KycWorkflowId",
                        column: x => x.KycWorkflowId,
                        principalTable: "KycWorkflowMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KycApprovalConfigs_RoleId",
                table: "KycApprovalConfigs",
                column: "RoleId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycApprovalLogs_KycWorkflowId",
                table: "KycApprovalLogs",
                column: "KycWorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_KycApprovalLogs_UserId",
                table: "KycApprovalLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_KycWorkflowMasters_KycSessionId",
                table: "KycWorkflowMasters",
                column: "KycSessionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KycApprovalConfigs");

            migrationBuilder.DropTable(
                name: "KycApprovalLogs");

            migrationBuilder.DropTable(
                name: "KycWorkflowMasters");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "KycDetails",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);
        }
    }
}
