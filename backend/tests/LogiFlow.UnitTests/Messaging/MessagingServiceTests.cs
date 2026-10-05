using System;
using System.Linq;
using System.Threading.Tasks;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Messaging;
using LogiFlow.Domain.Entities;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LogiFlow.UnitTests.Messaging;

public sealed class MessagingServiceTests : IAsyncLifetime
{
    private AppDbContext _context = null!;
    private readonly StubCurrentUser _currentUser = new();
    private readonly Guid _customer = Guid.NewGuid();
    private readonly Guid _orderId = Guid.NewGuid();

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"msg-tests-{Guid.NewGuid():N}")
            .Options;
        _context = new AppDbContext(options);
        await _context.Database.EnsureCreatedAsync();

        _context.DeliveryOrders.Add(new DeliveryOrder
        {
            Id = _orderId,
            CustomerId = _customer,
            DeliveryCity = "Kandy",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    public async Task DisposeAsync() => await _context.DisposeAsync();

    private MessagingService Service() => new(_context, _currentUser);

    [Fact]
    public async Task Customer_CanSend_AndRead_TheirConversation()
    {
        _currentUser.UserId = _customer;
        var sent = await Service().SendMessageAsync(_orderId, "  Where is my order?  ");

        Assert.Equal("CUSTOMER", sent.SenderRole);
        Assert.Equal("Where is my order?", sent.Body); // trimmed

        var convo = await Service().GetConversationAsync(_orderId);
        Assert.Single(convo);
        Assert.Equal("Where is my order?", convo[0].Body);
    }

    [Fact]
    public async Task NonParticipant_CannotRead()
    {
        _currentUser.UserId = Guid.NewGuid(); // neither the customer nor a driver
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => Service().GetConversationAsync(_orderId));
    }

    [Fact]
    public async Task EmptyMessage_Rejected()
    {
        _currentUser.UserId = _customer;
        await Assert.ThrowsAsync<ArgumentException>(() => Service().SendMessageAsync(_orderId, "   "));
    }

    private sealed class StubCurrentUser : ICurrentUserService
    {
        public Guid? UserId { get; set; }
    }
}
