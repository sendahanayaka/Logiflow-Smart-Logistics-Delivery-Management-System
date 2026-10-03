using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogiFlow.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentWorkflowAllocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AllocatedDriverId",
                table: "AgentWorkflows",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AllocatedVehicleId",
                table: "AgentWorkflows",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AllocationSummary",
                table: "AgentWorkflows",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllocatedDriverId",
                table: "AgentWorkflows");

            migrationBuilder.DropColumn(
                name: "AllocatedVehicleId",
                table: "AgentWorkflows");

            migrationBuilder.DropColumn(
                name: "AllocationSummary",
                table: "AgentWorkflows");
        }
    }
}
