using LogiFlow.Application.Messaging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiFlow.Api.Controllers;

[ApiController]
[Authorize(Roles = "CUSTOMER,DRIVER,ADMIN")]
public class MessagingController : ControllerBase
{
    private readonly IMessagingService _messaging;

    public MessagingController(IMessagingService messaging)
    {
        _messaging = messaging;
    }

    public sealed record SendMessageRequest(string Body);

    [HttpGet("api/conversations")]
    [ProducesResponseType(typeof(IReadOnlyList<ConversationSummary>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ConversationSummary>>> MyConversations(CancellationToken cancellationToken) =>
        Ok(await _messaging.GetMyConversationsAsync(cancellationToken));

    [HttpGet("api/orders/{orderId:guid}/messages")]
    [ProducesResponseType(typeof(IReadOnlyList<MessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> Conversation(Guid orderId, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _messaging.GetConversationAsync(orderId, cancellationToken));
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    [HttpPost("api/orders/{orderId:guid}/messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageDto>> Send(
        Guid orderId, [FromBody] SendMessageRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var message = await _messaging.SendMessageAsync(orderId, request.Body, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, message);
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
