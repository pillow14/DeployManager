using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeployManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeploymentModeRuleSetBlockedPattern : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DeployRuleSetId",
                table: "Rules",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BlockedPatterns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Pattern = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockedPatterns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeploymentModes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeploymentModes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RuleSets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DeploymentModeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RuleSets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RuleSets_DeploymentModes_DeploymentModeId",
                        column: x => x.DeploymentModeId,
                        principalTable: "DeploymentModes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Rules_DeployRuleSetId",
                table: "Rules",
                column: "DeployRuleSetId");

            migrationBuilder.CreateIndex(
                name: "IX_BlockedPatterns_Pattern",
                table: "BlockedPatterns",
                column: "Pattern",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeploymentModes_Code",
                table: "DeploymentModes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RuleSets_Code",
                table: "RuleSets",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RuleSets_DeploymentModeId",
                table: "RuleSets",
                column: "DeploymentModeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Rules_RuleSets_DeployRuleSetId",
                table: "Rules",
                column: "DeployRuleSetId",
                principalTable: "RuleSets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rules_RuleSets_DeployRuleSetId",
                table: "Rules");

            migrationBuilder.DropTable(
                name: "BlockedPatterns");

            migrationBuilder.DropTable(
                name: "RuleSets");

            migrationBuilder.DropTable(
                name: "DeploymentModes");

            migrationBuilder.DropIndex(
                name: "IX_Rules_DeployRuleSetId",
                table: "Rules");

            migrationBuilder.DropColumn(
                name: "DeployRuleSetId",
                table: "Rules");
        }
    }
}
