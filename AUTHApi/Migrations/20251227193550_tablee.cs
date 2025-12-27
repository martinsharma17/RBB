using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AUTHApi.Migrations
{
    /// <inheritdoc />
    public partial class tablee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KycAttachments_KycForms_KycFormId",
                table: "KycAttachments");

            migrationBuilder.DropForeignKey(
                name: "FK_KycBanks_KycForms_KycFormId",
                table: "KycBanks");

            migrationBuilder.DropForeignKey(
                name: "FK_KycFamilies_KycForms_KycFormId",
                table: "KycFamilies");

            migrationBuilder.DropForeignKey(
                name: "FK_KycGuardians_KycForms_KycFormId",
                table: "KycGuardians");

            migrationBuilder.DropForeignKey(
                name: "FK_KycOccupations_KycForms_KycFormId",
                table: "KycOccupations");

            migrationBuilder.DropForeignKey(
                name: "FK_KycPersonalInfos_KycForms_KycFormId",
                table: "KycPersonalInfos");

            migrationBuilder.DropTable(
                name: "KycAddresses");

            migrationBuilder.DropTable(
                name: "KycInvestments");

            migrationBuilder.DropTable(
                name: "KycLegals");

            migrationBuilder.DropTable(
                name: "KycForms");

            migrationBuilder.DropIndex(
                name: "IX_KycPersonalInfos_KycFormId",
                table: "KycPersonalInfos");

            migrationBuilder.DropIndex(
                name: "IX_KycOccupations_KycFormId",
                table: "KycOccupations");

            migrationBuilder.DropIndex(
                name: "IX_KycGuardians_KycFormId",
                table: "KycGuardians");

            migrationBuilder.DropIndex(
                name: "IX_KycFamilies_KycFormId",
                table: "KycFamilies");

            migrationBuilder.DropIndex(
                name: "IX_KycBanks_KycFormId",
                table: "KycBanks");

            migrationBuilder.DropIndex(
                name: "IX_KycAttachments_KycFormId",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "KycFormId",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "AnnualIncomeBracket",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "KycFormId",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "Occupation",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "OrgAddress",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "OrgName",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "KycFormId",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "ChildrenNames",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "InlawsNames",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "KycFormId",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "AccountNumber",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "KycFormId",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "FileType",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "KycFormId",
                table: "KycAttachments");

            migrationBuilder.RenameColumn(
                name: "PanNo",
                table: "KycPersonalInfos",
                newName: "SanctionScreeningNo");

            migrationBuilder.RenameColumn(
                name: "Nationality",
                table: "KycPersonalInfos",
                newName: "OtherNationality");

            migrationBuilder.RenameColumn(
                name: "DobBs",
                table: "KycPersonalInfos",
                newName: "DateOfBirthBs");

            migrationBuilder.RenameColumn(
                name: "DobAd",
                table: "KycPersonalInfos",
                newName: "PhotoUploadedDate");

            migrationBuilder.RenameColumn(
                name: "Relationship",
                table: "KycGuardians",
                newName: "Province");

            migrationBuilder.RenameColumn(
                name: "PanNo",
                table: "KycGuardians",
                newName: "PermanentAccountNo");

            migrationBuilder.RenameColumn(
                name: "IssueDistrict",
                table: "KycGuardians",
                newName: "EmailId");

            migrationBuilder.RenameColumn(
                name: "Dob",
                table: "KycGuardians",
                newName: "ModifiedDate");

            migrationBuilder.RenameColumn(
                name: "ContactNo",
                table: "KycGuardians",
                newName: "BirthRegNo");

            migrationBuilder.RenameColumn(
                name: "GrandfatherName",
                table: "KycFamilies",
                newName: "GrandFatherName");

            migrationBuilder.RenameColumn(
                name: "UploadedAt",
                table: "KycAttachments",
                newName: "UploadedDate");

            migrationBuilder.AlterColumn<byte>(
                name: "Gender",
                table: "KycPersonalInfos",
                type: "tinyint",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "KycPersonalInfos",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<string>(
                name: "BeneficiaryIdNo",
                table: "KycPersonalInfos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientAccountNo",
                table: "KycPersonalInfos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "KycPersonalInfos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "KycPersonalInfos",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirthAd",
                table: "KycPersonalInfos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FormDate",
                table: "KycPersonalInfos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "KycPersonalInfos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "KycPersonalInfos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsNepali",
                table: "KycPersonalInfos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ModifiedBy",
                table: "KycPersonalInfos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedDate",
                table: "KycPersonalInfos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NrnAddress",
                table: "KycPersonalInfos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NrnIdentificationNo",
                table: "KycPersonalInfos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentAccountNo",
                table: "KycPersonalInfos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoFileName",
                table: "KycPersonalInfos",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoFilePath",
                table: "KycPersonalInfos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PhotoFileSize",
                table: "KycPersonalInfos",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceNo",
                table: "KycPersonalInfos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionId",
                table: "KycPersonalInfos",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Designation",
                table: "KycOccupations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "BusinessType",
                table: "KycOccupations",
                type: "tinyint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "KycOccupations",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "KycOccupations",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "KycPersonalInfoId",
                table: "KycOccupations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedDate",
                table: "KycOccupations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "OccupationType",
                table: "KycOccupations",
                type: "tinyint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrganizationAddress",
                table: "KycOccupations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrganizationName",
                table: "KycOccupations",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherOccupation",
                table: "KycOccupations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "ServiceSector",
                table: "KycOccupations",
                type: "tinyint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionId",
                table: "KycOccupations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BirthRegIssueDate",
                table: "KycGuardians",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BirthRegIssuingAuthority",
                table: "KycGuardians",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CorrespondenceAddress",
                table: "KycGuardians",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "KycGuardians",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "KycGuardians",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "KycGuardians",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FaxNo",
                table: "KycGuardians",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianFullName",
                table: "KycGuardians",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GuardianPhotoFileName",
                table: "KycGuardians",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianPhotoFilePath",
                table: "KycGuardians",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "GuardianPhotoFileSize",
                table: "KycGuardians",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianSignatureFileName",
                table: "KycGuardians",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardianSignatureFilePath",
                table: "KycGuardians",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "GuardianSignatureFileSize",
                table: "KycGuardians",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "KycGuardians",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "KycPersonalInfoId",
                table: "KycGuardians",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MobileNo",
                table: "KycGuardians",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MunicipalityName",
                table: "KycGuardians",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "MunicipalityType",
                table: "KycGuardians",
                type: "tinyint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelationshipWithApplicant",
                table: "KycGuardians",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SessionId",
                table: "KycGuardians",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelephoneNo",
                table: "KycGuardians",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WardNo",
                table: "KycGuardians",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SpouseName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MotherName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GrandFatherName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FatherName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "KycFamilies",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DaughterInLawName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DaughterName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherInLawName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "KycFamilies",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "KycPersonalInfoId",
                table: "KycFamilies",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedDate",
                table: "KycFamilies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotherInLawName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionId",
                table: "KycFamilies",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SonName",
                table: "KycFamilies",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BankName",
                table: "KycBanks",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BankAddress",
                table: "KycBanks",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte>(
                name: "AccountType",
                table: "KycBanks",
                type: "tinyint",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNo",
                table: "KycBanks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "KycBanks",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "KycBanks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "KycBanks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "KycPersonalInfoId",
                table: "KycBanks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedDate",
                table: "KycBanks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionId",
                table: "KycBanks",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "KycAttachments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "FileName",
                table: "KycAttachments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AddColumn<string>(
                name: "DocumentDescription",
                table: "KycAttachments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentName",
                table: "KycAttachments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte>(
                name: "DocumentType",
                table: "KycAttachments",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<long>(
                name: "FileSize",
                table: "KycAttachments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ImageHeight",
                table: "KycAttachments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ImageWidth",
                table: "KycAttachments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "KycAttachments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "KycAttachments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "KycPersonalInfoId",
                table: "KycAttachments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MimeType",
                table: "KycAttachments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedDate",
                table: "KycAttachments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionId",
                table: "KycAttachments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailPath",
                table: "KycAttachments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UploadedBy",
                table: "KycAttachments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationNotes",
                table: "KycAttachments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerifiedBy",
                table: "KycAttachments",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedDate",
                table: "KycAttachments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "KycFormSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionToken = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    EmailVerified = table.Column<bool>(type: "bit", nullable: false),
                    EmailVerifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MobileNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    MobileVerified = table.Column<bool>(type: "bit", nullable: false),
                    MobileVerifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CurrentStep = table.Column<int>(type: "int", nullable: false),
                    LastSavedStep = table.Column<int>(type: "int", nullable: false),
                    LastActivityDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FormStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DeviceFingerprint = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SessionExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsExpired = table.Column<bool>(type: "bit", nullable: false),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycFormSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycFormSessions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KycFormSessions_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "KycFormSteps",
                columns: table => new
                {
                    StepNumber = table.Column<int>(type: "int", nullable: false),
                    StepName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StepNameNepali = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    StepDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TableName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycFormSteps", x => x.StepNumber);
                });

            migrationBuilder.CreateTable(
                name: "KycAgreements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    AgreementDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TradingLimit = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    MarginTradingFacility = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycAgreements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycAgreements_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycAgreements_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycAmlCompliances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    IsPoliticallyExposedPerson = table.Column<bool>(type: "bit", nullable: false),
                    IsRelatedToPep = table.Column<bool>(type: "bit", nullable: false),
                    PepRelationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PepRelationship = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    HasBeneficialOwner = table.Column<bool>(type: "bit", nullable: false),
                    BeneficialOwnerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BeneficialOwnerRelationship = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    HasCriminalRecord = table.Column<bool>(type: "bit", nullable: false),
                    CriminalRecordDetails = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActualOwnerDifferent = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycAmlCompliances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycAmlCompliances_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycAmlCompliances_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycCurrentAddresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Province = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MunicipalityType = table.Column<byte>(type: "tinyint", nullable: true),
                    MunicipalityName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    WardNo = table.Column<int>(type: "int", nullable: true),
                    Tole = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TelephoneNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    MobileNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EmailId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycCurrentAddresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycCurrentAddresses_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycCurrentAddresses_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycDeclarations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    AgreeToTerms = table.Column<bool>(type: "bit", nullable: false),
                    NoOtherFinancialLiability = table.Column<bool>(type: "bit", nullable: false),
                    AllInformationTrue = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycDeclarations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycDeclarations_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycDeclarations_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycFinancialDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    AnnualIncomeRange = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EstimatedAnnualIncome = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycFinancialDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycFinancialDetails_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycFinancialDetails_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycLocationMaps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    Landmark = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DistanceFromMainRoad = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CanvasDataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Latitude = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Longitude = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycLocationMaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycLocationMaps_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycLocationMaps_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycOtpVerifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    OtpType = table.Column<byte>(type: "tinyint", nullable: false),
                    OtpCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    OtpHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SentToEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SentToMobile = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    VerifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsExpired = table.Column<bool>(type: "bit", nullable: false),
                    AttemptCount = table.Column<int>(type: "int", nullable: false),
                    MaxAttempts = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycOtpVerifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycOtpVerifications_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KycPermanentAddresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Province = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MunicipalityType = table.Column<byte>(type: "tinyint", nullable: true),
                    MunicipalityName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    WardNo = table.Column<int>(type: "int", nullable: true),
                    Tole = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TelephoneNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    MobileNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    EmailId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycPermanentAddresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycPermanentAddresses_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycPermanentAddresses_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycTransactionInfos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    KycPersonalInfoId = table.Column<int>(type: "int", nullable: true),
                    SourceOfNetWorth = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    MajorSourceOfIncome = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    HasOtherBrokerAccount = table.Column<bool>(type: "bit", nullable: false),
                    OtherBrokerNames = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsCibBlacklisted = table.Column<bool>(type: "bit", nullable: false),
                    CibBlacklistDetails = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    InvolvedInInvestmentCompany = table.Column<bool>(type: "bit", nullable: false),
                    InvestmentCompanyName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    RoleInInvestmentCompany = table.Column<byte>(type: "tinyint", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycTransactionInfos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycTransactionInfos_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycTransactionInfos_KycPersonalInfos_KycPersonalInfoId",
                        column: x => x.KycPersonalInfoId,
                        principalTable: "KycPersonalInfos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KycStepCompletions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    StepNumber = table.Column<int>(type: "int", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsSaved = table.Column<bool>(type: "bit", nullable: false),
                    SavedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsValidated = table.Column<bool>(type: "bit", nullable: false),
                    ValidationErrors = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecordId = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KycStepCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KycStepCompletions_KycFormSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KycFormSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KycStepCompletions_KycFormSteps_StepNumber",
                        column: x => x.StepNumber,
                        principalTable: "KycFormSteps",
                        principalColumn: "StepNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KycOccupations_KycPersonalInfoId",
                table: "KycOccupations",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycOccupations_SessionId",
                table: "KycOccupations",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycGuardians_KycPersonalInfoId",
                table: "KycGuardians",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycGuardians_SessionId",
                table: "KycGuardians",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycFamilies_KycPersonalInfoId",
                table: "KycFamilies",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycFamilies_SessionId",
                table: "KycFamilies",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycBanks_KycPersonalInfoId",
                table: "KycBanks",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycBanks_SessionId",
                table: "KycBanks",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycAttachments_KycPersonalInfoId",
                table: "KycAttachments",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycAttachments_SessionId",
                table: "KycAttachments",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycAgreements_KycPersonalInfoId",
                table: "KycAgreements",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycAgreements_SessionId",
                table: "KycAgreements",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycAmlCompliances_KycPersonalInfoId",
                table: "KycAmlCompliances",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycAmlCompliances_SessionId",
                table: "KycAmlCompliances",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycCurrentAddresses_KycPersonalInfoId",
                table: "KycCurrentAddresses",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycCurrentAddresses_SessionId",
                table: "KycCurrentAddresses",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycDeclarations_KycPersonalInfoId",
                table: "KycDeclarations",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycDeclarations_SessionId",
                table: "KycDeclarations",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycFinancialDetails_KycPersonalInfoId",
                table: "KycFinancialDetails",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycFinancialDetails_SessionId",
                table: "KycFinancialDetails",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycFormSessions_Email_SessionToken",
                table: "KycFormSessions",
                columns: new[] { "Email", "SessionToken" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycFormSessions_KycPersonalInfoId",
                table: "KycFormSessions",
                column: "KycPersonalInfoId",
                unique: true,
                filter: "[KycPersonalInfoId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_KycFormSessions_SessionToken",
                table: "KycFormSessions",
                column: "SessionToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycFormSessions_UserId",
                table: "KycFormSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_KycLocationMaps_KycPersonalInfoId",
                table: "KycLocationMaps",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycLocationMaps_SessionId",
                table: "KycLocationMaps",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycOtpVerifications_SessionId",
                table: "KycOtpVerifications",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycPermanentAddresses_KycPersonalInfoId",
                table: "KycPermanentAddresses",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycPermanentAddresses_SessionId",
                table: "KycPermanentAddresses",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KycStepCompletions_SessionId_StepNumber",
                table: "KycStepCompletions",
                columns: new[] { "SessionId", "StepNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycStepCompletions_StepNumber",
                table: "KycStepCompletions",
                column: "StepNumber");

            migrationBuilder.CreateIndex(
                name: "IX_KycTransactionInfos_KycPersonalInfoId",
                table: "KycTransactionInfos",
                column: "KycPersonalInfoId");

            migrationBuilder.CreateIndex(
                name: "IX_KycTransactionInfos_SessionId",
                table: "KycTransactionInfos",
                column: "SessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_KycAttachments_KycFormSessions_SessionId",
                table: "KycAttachments",
                column: "SessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycAttachments_KycPersonalInfos_KycPersonalInfoId",
                table: "KycAttachments",
                column: "KycPersonalInfoId",
                principalTable: "KycPersonalInfos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_KycBanks_KycFormSessions_SessionId",
                table: "KycBanks",
                column: "SessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycBanks_KycPersonalInfos_KycPersonalInfoId",
                table: "KycBanks",
                column: "KycPersonalInfoId",
                principalTable: "KycPersonalInfos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_KycFamilies_KycFormSessions_SessionId",
                table: "KycFamilies",
                column: "SessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycFamilies_KycPersonalInfos_KycPersonalInfoId",
                table: "KycFamilies",
                column: "KycPersonalInfoId",
                principalTable: "KycPersonalInfos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_KycGuardians_KycFormSessions_SessionId",
                table: "KycGuardians",
                column: "SessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycGuardians_KycPersonalInfos_KycPersonalInfoId",
                table: "KycGuardians",
                column: "KycPersonalInfoId",
                principalTable: "KycPersonalInfos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_KycOccupations_KycFormSessions_SessionId",
                table: "KycOccupations",
                column: "SessionId",
                principalTable: "KycFormSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycOccupations_KycPersonalInfos_KycPersonalInfoId",
                table: "KycOccupations",
                column: "KycPersonalInfoId",
                principalTable: "KycPersonalInfos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KycAttachments_KycFormSessions_SessionId",
                table: "KycAttachments");

            migrationBuilder.DropForeignKey(
                name: "FK_KycAttachments_KycPersonalInfos_KycPersonalInfoId",
                table: "KycAttachments");

            migrationBuilder.DropForeignKey(
                name: "FK_KycBanks_KycFormSessions_SessionId",
                table: "KycBanks");

            migrationBuilder.DropForeignKey(
                name: "FK_KycBanks_KycPersonalInfos_KycPersonalInfoId",
                table: "KycBanks");

            migrationBuilder.DropForeignKey(
                name: "FK_KycFamilies_KycFormSessions_SessionId",
                table: "KycFamilies");

            migrationBuilder.DropForeignKey(
                name: "FK_KycFamilies_KycPersonalInfos_KycPersonalInfoId",
                table: "KycFamilies");

            migrationBuilder.DropForeignKey(
                name: "FK_KycGuardians_KycFormSessions_SessionId",
                table: "KycGuardians");

            migrationBuilder.DropForeignKey(
                name: "FK_KycGuardians_KycPersonalInfos_KycPersonalInfoId",
                table: "KycGuardians");

            migrationBuilder.DropForeignKey(
                name: "FK_KycOccupations_KycFormSessions_SessionId",
                table: "KycOccupations");

            migrationBuilder.DropForeignKey(
                name: "FK_KycOccupations_KycPersonalInfos_KycPersonalInfoId",
                table: "KycOccupations");

            migrationBuilder.DropTable(
                name: "KycAgreements");

            migrationBuilder.DropTable(
                name: "KycAmlCompliances");

            migrationBuilder.DropTable(
                name: "KycCurrentAddresses");

            migrationBuilder.DropTable(
                name: "KycDeclarations");

            migrationBuilder.DropTable(
                name: "KycFinancialDetails");

            migrationBuilder.DropTable(
                name: "KycLocationMaps");

            migrationBuilder.DropTable(
                name: "KycOtpVerifications");

            migrationBuilder.DropTable(
                name: "KycPermanentAddresses");

            migrationBuilder.DropTable(
                name: "KycStepCompletions");

            migrationBuilder.DropTable(
                name: "KycTransactionInfos");

            migrationBuilder.DropTable(
                name: "KycFormSteps");

            migrationBuilder.DropTable(
                name: "KycFormSessions");

            migrationBuilder.DropIndex(
                name: "IX_KycOccupations_KycPersonalInfoId",
                table: "KycOccupations");

            migrationBuilder.DropIndex(
                name: "IX_KycOccupations_SessionId",
                table: "KycOccupations");

            migrationBuilder.DropIndex(
                name: "IX_KycGuardians_KycPersonalInfoId",
                table: "KycGuardians");

            migrationBuilder.DropIndex(
                name: "IX_KycGuardians_SessionId",
                table: "KycGuardians");

            migrationBuilder.DropIndex(
                name: "IX_KycFamilies_KycPersonalInfoId",
                table: "KycFamilies");

            migrationBuilder.DropIndex(
                name: "IX_KycFamilies_SessionId",
                table: "KycFamilies");

            migrationBuilder.DropIndex(
                name: "IX_KycBanks_KycPersonalInfoId",
                table: "KycBanks");

            migrationBuilder.DropIndex(
                name: "IX_KycBanks_SessionId",
                table: "KycBanks");

            migrationBuilder.DropIndex(
                name: "IX_KycAttachments_KycPersonalInfoId",
                table: "KycAttachments");

            migrationBuilder.DropIndex(
                name: "IX_KycAttachments_SessionId",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "BeneficiaryIdNo",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "ClientAccountNo",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "DateOfBirthAd",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "FormDate",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "IsNepali",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "ModifiedBy",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "ModifiedDate",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "NrnAddress",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "NrnIdentificationNo",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "PermanentAccountNo",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "PhotoFileName",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "PhotoFilePath",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "PhotoFileSize",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "ReferenceNo",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "KycPersonalInfos");

            migrationBuilder.DropColumn(
                name: "BusinessType",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "KycPersonalInfoId",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "ModifiedDate",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "OccupationType",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "OrganizationAddress",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "OrganizationName",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "OtherOccupation",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "ServiceSector",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "KycOccupations");

            migrationBuilder.DropColumn(
                name: "BirthRegIssueDate",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "BirthRegIssuingAuthority",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "CorrespondenceAddress",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "District",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "FaxNo",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "GuardianFullName",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "GuardianPhotoFileName",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "GuardianPhotoFilePath",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "GuardianPhotoFileSize",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "GuardianSignatureFileName",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "GuardianSignatureFilePath",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "GuardianSignatureFileSize",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "KycPersonalInfoId",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "MobileNo",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "MunicipalityName",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "MunicipalityType",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "RelationshipWithApplicant",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "TelephoneNo",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "WardNo",
                table: "KycGuardians");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "DaughterInLawName",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "DaughterName",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "FatherInLawName",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "KycPersonalInfoId",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "ModifiedDate",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "MotherInLawName",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "SonName",
                table: "KycFamilies");

            migrationBuilder.DropColumn(
                name: "BankAccountNo",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "KycPersonalInfoId",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "ModifiedDate",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "KycBanks");

            migrationBuilder.DropColumn(
                name: "DocumentDescription",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "DocumentName",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "DocumentType",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "ImageHeight",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "ImageWidth",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "KycPersonalInfoId",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "MimeType",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "ModifiedDate",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "ThumbnailPath",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "UploadedBy",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "VerificationNotes",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "VerifiedBy",
                table: "KycAttachments");

            migrationBuilder.DropColumn(
                name: "VerifiedDate",
                table: "KycAttachments");

            migrationBuilder.RenameColumn(
                name: "SanctionScreeningNo",
                table: "KycPersonalInfos",
                newName: "PanNo");

            migrationBuilder.RenameColumn(
                name: "PhotoUploadedDate",
                table: "KycPersonalInfos",
                newName: "DobAd");

            migrationBuilder.RenameColumn(
                name: "OtherNationality",
                table: "KycPersonalInfos",
                newName: "Nationality");

            migrationBuilder.RenameColumn(
                name: "DateOfBirthBs",
                table: "KycPersonalInfos",
                newName: "DobBs");

            migrationBuilder.RenameColumn(
                name: "Province",
                table: "KycGuardians",
                newName: "Relationship");

            migrationBuilder.RenameColumn(
                name: "PermanentAccountNo",
                table: "KycGuardians",
                newName: "PanNo");

            migrationBuilder.RenameColumn(
                name: "ModifiedDate",
                table: "KycGuardians",
                newName: "Dob");

            migrationBuilder.RenameColumn(
                name: "EmailId",
                table: "KycGuardians",
                newName: "IssueDistrict");

            migrationBuilder.RenameColumn(
                name: "BirthRegNo",
                table: "KycGuardians",
                newName: "ContactNo");

            migrationBuilder.RenameColumn(
                name: "GrandFatherName",
                table: "KycFamilies",
                newName: "GrandfatherName");

            migrationBuilder.RenameColumn(
                name: "UploadedDate",
                table: "KycAttachments",
                newName: "UploadedAt");

            migrationBuilder.AlterColumn<string>(
                name: "Gender",
                table: "KycPersonalInfos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(byte),
                oldType: "tinyint",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "KycPersonalInfos",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<int>(
                name: "KycFormId",
                table: "KycPersonalInfos",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Designation",
                table: "KycOccupations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnnualIncomeBracket",
                table: "KycOccupations",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KycFormId",
                table: "KycOccupations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Occupation",
                table: "KycOccupations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrgAddress",
                table: "KycOccupations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrgName",
                table: "KycOccupations",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "KycGuardians",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "KycGuardians",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KycFormId",
                table: "KycGuardians",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "KycGuardians",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SpouseName",
                table: "KycFamilies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MotherName",
                table: "KycFamilies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GrandfatherName",
                table: "KycFamilies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FatherName",
                table: "KycFamilies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChildrenNames",
                table: "KycFamilies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InlawsNames",
                table: "KycFamilies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KycFormId",
                table: "KycFamilies",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "BankName",
                table: "KycBanks",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "BankAddress",
                table: "KycBanks",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AccountType",
                table: "KycBanks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(byte),
                oldType: "tinyint",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                table: "KycBanks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KycFormId",
                table: "KycBanks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "KycAttachments",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "FileName",
                table: "KycAttachments",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<string>(
                name: "FileType",
                table: "KycAttachments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KycFormId",
                table: "KycAttachments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "KycForms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    CheckerId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    MakerId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CurrentStep = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
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
                    ContactNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CurrentCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentMunicipality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentProvince = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    PermanentCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentDistrict = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentMunicipality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermanentProvince = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    WardNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
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
                    ConsentDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeclarationText = table.Column<string>(type: "nvarchar(max)", nullable: true),
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

            migrationBuilder.CreateIndex(
                name: "IX_KycPersonalInfos_KycFormId",
                table: "KycPersonalInfos",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycOccupations_KycFormId",
                table: "KycOccupations",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycGuardians_KycFormId",
                table: "KycGuardians",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycFamilies_KycFormId",
                table: "KycFamilies",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycBanks_KycFormId",
                table: "KycBanks",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycAttachments_KycFormId",
                table: "KycAttachments",
                column: "KycFormId");

            migrationBuilder.CreateIndex(
                name: "IX_KycAddresses_KycFormId",
                table: "KycAddresses",
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
                name: "IX_KycInvestments_KycFormId",
                table: "KycInvestments",
                column: "KycFormId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KycLegals_KycFormId",
                table: "KycLegals",
                column: "KycFormId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_KycAttachments_KycForms_KycFormId",
                table: "KycAttachments",
                column: "KycFormId",
                principalTable: "KycForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycBanks_KycForms_KycFormId",
                table: "KycBanks",
                column: "KycFormId",
                principalTable: "KycForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycFamilies_KycForms_KycFormId",
                table: "KycFamilies",
                column: "KycFormId",
                principalTable: "KycForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycGuardians_KycForms_KycFormId",
                table: "KycGuardians",
                column: "KycFormId",
                principalTable: "KycForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycOccupations_KycForms_KycFormId",
                table: "KycOccupations",
                column: "KycFormId",
                principalTable: "KycForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_KycPersonalInfos_KycForms_KycFormId",
                table: "KycPersonalInfos",
                column: "KycFormId",
                principalTable: "KycForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
