using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDetailsAndImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserDetails",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ApplicationUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DateOfBirthAd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DateOfBirthBs = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Nationality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CitizenshipNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CitizenshipIssueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CitizenshipIssueDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BeneficiaryIdNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PanNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IdentificationNoNrn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentWardNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CurrentMunicipality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentProvince = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentWardNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PermanentMunicipality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentProvince = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EmailAddress = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FatherName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    MotherName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    GrandfatherName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    SpouseName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ChildrenNames = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InlawsNames = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccountType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    BankAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Occupation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BusinessType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OrganizationName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    OrganizationAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Designation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EmployeeIdNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AnnualIncomeBracket = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GuardianName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    GuardianRelationship = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    GuardianAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GuardianFaxNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GuardianTelephoneNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GuardianEmail = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    GuardianPanNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GuardianMobileNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GuardianBirthRegNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GuardianIssueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GuardianIssuingAuthority = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    GuardianSignature = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InvolvedInOtherInvestments = table.Column<bool>(type: "bit", nullable: false),
                    InvestmentDetails = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LegalDeclaration = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LegalConsent = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDetails", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserDetails_AspNetUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserImages",
                columns: table => new
                {
                    ImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserDetailsId = table.Column<int>(type: "int", nullable: false),
                    ImageType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserImages", x => x.ImageId);
                    table.ForeignKey(
                        name: "FK_UserImages_UserDetails_UserDetailsId",
                        column: x => x.UserDetailsId,
                        principalTable: "UserDetails",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserDetails_ApplicationUserId",
                table: "UserDetails",
                column: "ApplicationUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserImages_UserDetailsId",
                table: "UserImages",
                column: "UserDetailsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserImages");

            migrationBuilder.DropTable(
                name: "UserDetails");
        }
    }
}
