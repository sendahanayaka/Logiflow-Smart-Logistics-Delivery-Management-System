using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Delivery;

public class ApprovalDecisionConfiguration : IEntityTypeConfiguration<ApprovalDecision>
{
    public void Configure(EntityTypeBuilder<ApprovalDecision> builder)
    {
        builder.ToTable("ApprovalDecisions");

        builder.HasKey(decision => decision.Id);

        builder.HasIndex(decision => decision.AgentWorkflowId);

        builder.Property(decision => decision.Action)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(decision => decision.DecidedBy)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(decision => decision.Reason)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(decision => decision.RevisionsJson)
            .HasColumnType("jsonb")
            .IsRequired(false);

        builder.Property(decision => decision.DecidedAt)
            .IsRequired();

        // Relationship to AgentWorkflow is configured on the AgentWorkflow side.
    }
}
