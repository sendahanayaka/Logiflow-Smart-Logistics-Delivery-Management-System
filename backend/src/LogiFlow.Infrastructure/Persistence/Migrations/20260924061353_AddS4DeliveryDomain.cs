using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogiFlow.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddS4DeliveryDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AgentWorkflows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DispatchBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Objective = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Summary = table.Column<string>(type: "text", nullable: true),
                    ProposedPlanJson = table.Column<string>(type: "jsonb", nullable: true),
                    AuditJson = table.Column<string>(type: "jsonb", nullable: true),
                    Error = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentWorkflows", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalDecisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentWorkflowId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DecidedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RevisionsJson = table.Column<string>(type: "jsonb", nullable: true),
                    DecidedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalDecisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovalDecisions_AgentWorkflows_AgentWorkflowId",
                        column: x => x.AgentWorkflowId,
                        principalTable: "AgentWorkflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RouteStops",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentWorkflowId = table.Column<Guid>(type: "uuid", nullable: false),
                    StopKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sequence = table.Column<int>(type: "integer", nullable: false),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    DistanceFromPrevKm = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    Eta = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WindowStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    WindowEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OnTime = table.Column<bool>(type: "boolean", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RouteStops", x => x.Id);
                    table.CheckConstraint("CK_RouteStops_DistanceFromPrevKm_NonNegative", "\"DistanceFromPrevKm\" >= 0");
                    table.CheckConstraint("CK_RouteStops_Sequence_Positive", "\"Sequence\" > 0");
                    table.ForeignKey(
                        name: "FK_RouteStops_AgentWorkflows_AgentWorkflowId",
                        column: x => x.AgentWorkflowId,
                        principalTable: "AgentWorkflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentWorkflowId = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TotalDistanceKm = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    TotalDurationMin = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PlannedStartAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DispatchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                    table.CheckConstraint("CK_Shipments_TotalDistanceKm_NonNegative", "\"TotalDistanceKm\" >= 0");
                    table.CheckConstraint("CK_Shipments_TotalDurationMin_NonNegative", "\"TotalDurationMin\" >= 0");
                    table.ForeignKey(
                        name: "FK_Shipments_AgentWorkflows_AgentWorkflowId",
                        column: x => x.AgentWorkflowId,
                        principalTable: "AgentWorkflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProofOfDeliveries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteStopId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceivedByName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SignatureImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PhotoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProofOfDeliveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProofOfDeliveries_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrackingEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteStopId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackingEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrackingEvents_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgentWorkflows_DispatchBatchId",
                table: "AgentWorkflows",
                column: "DispatchBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_AgentWorkflows_WorkflowKey",
                table: "AgentWorkflows",
                column: "WorkflowKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalDecisions_AgentWorkflowId",
                table: "ApprovalDecisions",
                column: "AgentWorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_ProofOfDeliveries_RouteStopId",
                table: "ProofOfDeliveries",
                column: "RouteStopId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProofOfDeliveries_ShipmentId",
                table: "ProofOfDeliveries",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RouteStops_AgentWorkflowId_Sequence",
                table: "RouteStops",
                columns: new[] { "AgentWorkflowId", "Sequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RouteStops_OrderId",
                table: "RouteStops",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_AgentWorkflowId",
                table: "Shipments",
                column: "AgentWorkflowId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_DriverId",
                table: "Shipments",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ShipmentCode",
                table: "Shipments",
                column: "ShipmentCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_VehicleId",
                table: "Shipments",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_RouteStopId",
                table: "TrackingEvents",
                column: "RouteStopId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackingEvents_ShipmentId_OccurredAt",
                table: "TrackingEvents",
                columns: new[] { "ShipmentId", "OccurredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApprovalDecisions");

            migrationBuilder.DropTable(
                name: "ProofOfDeliveries");

            migrationBuilder.DropTable(
                name: "RouteStops");

            migrationBuilder.DropTable(
                name: "TrackingEvents");

            migrationBuilder.DropTable(
                name: "Shipments");

            migrationBuilder.DropTable(
                name: "AgentWorkflows");
        }
    }
}
