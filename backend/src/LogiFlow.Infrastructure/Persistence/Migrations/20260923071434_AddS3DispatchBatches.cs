using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogiFlow.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddS3DispatchBatches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DispatchBatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MaxWeightKg = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    MaxVolumeM3 = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DispatchBatches", x => x.Id);
                    table.CheckConstraint("CK_DispatchBatches_MaxVolumeM3_Positive", "\"MaxVolumeM3\" > 0");
                    table.CheckConstraint("CK_DispatchBatches_MaxWeightKg_Positive", "\"MaxWeightKg\" > 0");
                    table.ForeignKey(
                        name: "FK_DispatchBatches_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DispatchBatchItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DispatchBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoadSequence = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DispatchBatchItems", x => x.Id);
                    table.CheckConstraint("CK_DispatchBatchItems_LoadSequence_Positive", "\"LoadSequence\" > 0");
                    table.ForeignKey(
                        name: "FK_DispatchBatchItems_DispatchBatches_DispatchBatchId",
                        column: x => x.DispatchBatchId,
                        principalTable: "DispatchBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DispatchBatchItems_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DispatchBatches_VehicleId",
                table: "DispatchBatches",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_DispatchBatches_WarehouseId",
                table: "DispatchBatches",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_DispatchBatchItems_DispatchBatchId_LoadSequence",
                table: "DispatchBatchItems",
                columns: new[] { "DispatchBatchId", "LoadSequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DispatchBatchItems_PackageId",
                table: "DispatchBatchItems",
                column: "PackageId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DispatchBatchItems");

            migrationBuilder.DropTable(
                name: "DispatchBatches");
        }
    }
}
