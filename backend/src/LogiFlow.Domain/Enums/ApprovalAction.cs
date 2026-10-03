// [S4]  enum
namespace LogiFlow.Domain.Enums;

/// <summary>
/// The ops manager's decision at the approval gate. Mirrors the Python agent's
/// ApprovalAction (APPROVE / REJECT / REVISE).
/// </summary>
public enum ApprovalAction
{
    Approve = 0,
    Reject = 1,
    Revise = 2
}
