using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Delivery;

public class AgentWorkflowConfiguration : IEntityTypeConfiguration<AgentWorkflow>
{
    public void Configure(EntityTypeBuilder<AgentWorkflow> builder)
    {
        builder.ToTable("AgentWorkflows");

        builder.HasKey(workflow => workflow.Id);

        builder.Property(workflow => workflow.WorkflowKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(workflow => workflow.WorkflowKey)
            .IsUnique();

        builder.HasIndex(workflow => workflow.DispatchBatchId);

        builder.Property(workflow => workflow.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(workflow => workflow.Objective)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(workflow => workflow.Summary)
            .IsRequired(false);

        // Raw agent payloads kept verbatim for traceability.
        builder.Property(workflow => workflow.ProposedPlanJson)
            .HasColumnType("jsonb")
            .IsRequired(false);

        builder.Property(workflow => workflow.AuditJson)
            .HasColumnType("jsonb")
            .IsRequired(false);

        builder.Property(workflow => workflow.Error)
            .HasMaxLength(2000)
            .IsRequired(false);

        builder.Property(workflow => workflow.CreatedAt)
            .IsRequired();

        builder.Property(workflow => workflow.UpdatedAt)
            .IsRequired(false);

        builder.HasMany(workflow => workflow.RouteStops)
            .WithOne(stop => stop.AgentWorkflow)
            .HasForeignKey(stop => stop.AgentWorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(workflow => workflow.ApprovalDecisions)
            .WithOne(decision => decision.AgentWorkflow)
            .HasForeignKey(decision => decision.AgentWorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(workflow => workflow.Shipment)
            .WithOne(shipment => shipment.AgentWorkflow)
            .HasForeignKey<Shipment>(shipment => shipment.AgentWorkflowId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
