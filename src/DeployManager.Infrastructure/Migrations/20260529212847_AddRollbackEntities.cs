using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeployManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRollbackEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RollbackExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OriginalExecutionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SiteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExecutedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RollbackExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RollbackExecutions_DeployJobs_OriginalExecutionId",
                        column: x => x.OriginalExecutionId,
                        principalTable: "DeployJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RollbackExecutions_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RollbackExecutions_Users_ExecutedByUserId",
                        column: x => x.ExecutedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RollbackExecutionDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RollbackExecutionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RelativePath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    OriginalTargetFile = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BackupFile = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RollbackExecutionDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RollbackExecutionDetails_RollbackExecutions_RollbackExecutionId",
                        column: x => x.RollbackExecutionId,
                        principalTable: "RollbackExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RollbackExecutionDetails_RollbackExecutionId",
                table: "RollbackExecutionDetails",
                column: "RollbackExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_RollbackExecutions_ExecutedByUserId",
                table: "RollbackExecutions",
                column: "ExecutedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RollbackExecutions_OriginalExecutionId",
                table: "RollbackExecutions",
                column: "OriginalExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_RollbackExecutions_SiteId",
                table: "RollbackExecutions",
                column: "SiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RollbackExecutionDetails");

            migrationBuilder.DropTable(
                name: "RollbackExecutions");
        }
    }
}
