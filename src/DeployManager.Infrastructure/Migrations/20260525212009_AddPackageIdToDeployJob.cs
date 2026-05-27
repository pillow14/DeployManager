using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeployManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPackageIdToDeployJob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PackageId",
                table: "DeployJobs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeployJobs_PackageId",
                table: "DeployJobs",
                column: "PackageId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeployJobs_Packages_PackageId",
                table: "DeployJobs",
                column: "PackageId",
                principalTable: "Packages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeployJobs_Packages_PackageId",
                table: "DeployJobs");

            migrationBuilder.DropIndex(
                name: "IX_DeployJobs_PackageId",
                table: "DeployJobs");

            migrationBuilder.DropColumn(
                name: "PackageId",
                table: "DeployJobs");
        }
    }
}
