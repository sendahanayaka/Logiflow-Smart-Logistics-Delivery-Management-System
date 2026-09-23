namespace LogiFlow.Domain.Entities;

public class DispatchBatchItem
{
    public Guid Id { get; set; }
    public Guid DispatchBatchId { get; set; }
    public Guid PackageId { get; set; }
    public int LoadSequence { get; set; }

    public DispatchBatch DispatchBatch { get; set; } = null!;
    public Package Package { get; set; } = null!;
}
