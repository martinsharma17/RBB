using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KycForms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    MakerId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CheckerId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CurrentStep = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycForms_AspNetUsers_CheckerId",
                        column: x => x.CheckerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KycForms_AspNetUsers_MakerId",
                        column: x => x.MakerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KycForms_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycForms_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycAddresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    CurrentMunicipality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentProvince = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentMunicipality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentProvince = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    WardNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ContactNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycAddresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycAddresses_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FileType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycAttachments_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycBanks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    AccountType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    BankAddress = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycBanks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycBanks_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycFamilies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    FatherName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    MotherName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    GrandfatherName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    SpouseName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ChildrenNames = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InlawsNames = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycFamilies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycFamilies_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycGuardians",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Relationship = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    PanNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Dob = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IssueDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycGuardians", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycGuardians_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycInvestments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsInvolved = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycInvestments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycInvestments_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycLegals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    DeclarationText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConsentDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsAgreed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycLegals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycLegals_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycOccupations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    Occupation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OrgName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    OrgAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Designation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EmployeeIdNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AnnualIncomeBracket = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycOccupations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycOccupations_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycPersonalInfos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KycFormId = table.Column<int>(type: "int", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DobAd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DobBs = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Nationality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CitizenshipNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CitizenshipIssueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CitizenshipIssueDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PanNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycPersonalInfos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycPersonalInfos_KycForms_KycFormId",
                        column: x => x.KycFormId,
                        principalTable: "KycForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KycAddresses_KycFormId",
                table: "KycAddresses",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycAttachments_KycFormId",
                table: "KycAttachments",
                column: "KycFormId");

            migrationBuilder.CreateIndex(
                name: "IX_KycBanks_KycFormId",
                table: "KycBanks",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycFamilies_KycFormId",
                table: "KycFamilies",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycForms_BranchId",
                table: "KycForms",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_KycForms_CheckerId",
                table: "KycForms",
                column: "CheckerId");

            migrationBuilder.CreateIndex(
                name: "IX_KycForms_MakerId",
                table: "KycForms",
                column: "MakerId");

            migrationBuilder.CreateIndex(
                name: "IX_KycForms_UserId",
                table: "KycForms",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_KycGuardians_KycFormId",
                table: "KycGuardians",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycInvestments_KycFormId",
                table: "KycInvestments",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycLegals_KycFormId",
                table: "KycLegals",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycOccupations_KycFormId",
                table: "KycOccupations",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycPersonalInfos_KycFormId",
                table: "KycPersonalInfos",
                column: "KycFormId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KycAddresses");

            migrationBuilder.DropTable(
                name: "KycAttachments");

            migrationBuilder.DropTable(
                name: "KycBanks");

            migrationBuilder.DropTable(
                name: "KycFamilies");

            migrationBuilder.DropTable(
                name: "KycGuardians");

            migrationBuilder.DropTable(
                name: "KycInvestments");

            migrationBuilder.DropTable(
                name: "KycLegals");

            migrationBuilder.DropTable(
                name: "KycOccupations");

            migrationBuilder.DropTable(
                name: "KycPersonalInfos");

            migrationBuilder.DropTable(
                name: "KycForms");

            migrationBuilder.DropTable(
                name: "Branches");
        }
    }
}
