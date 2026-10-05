using System;
using System.Linq;
using System.Threading.Tasks;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Notifications;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LogiFlow.UnitTests.Notifications;

public sealed class NotificationServiceTests : IAsyncLifetime
{
    private AppDbContext _context = null!;
    private NotificationService _service = null!;
    private readonly StubCurrentUser _currentUser = new();
    private readonly Guid _me = Guid.NewGuid();

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"notif-tests-{Guid.NewGuid():N}")
            .Options;
        _context = new AppDbContext(options);
        await _context.Database.EnsureCreatedAsync();
        _currentUser.UserId = _me;
        _service = new NotificationService(_context, _currentUser);
    }

    public async Task DisposeAsync() => await _context.DisposeAsync();

    [Fact]
    public async Task List_ReturnsOnlyMine_NewestFirst_AndUnreadCount()
    {
        var orderId = Guid.NewGuid();
        _context.Notifications.Add(NotificationFactory.OrderPlaced(_me, orderId));
        _context.Notifications.Add(NotificationFactory.OrderApproved(_me, orderId));
        _context.Notifications.Add(NotificationFactory.PickedUp(Guid.NewGuid(), orderId)); // someone else
        await _context.SaveChangesAsync();

        var mine = await _service.ListAsync();
        Assert.Equal(2, mine.Count);
        Assert.Contains(mine, n => n.Type == "OrderPlaced");
        Assert.Contains(mine, n => n.Type == "OrderApproved");

        Assert.Equal(2, await _service.UnreadCountAsync());
    }

    [Fact]
    public async Task MarkAllRead_ClearsUnreadCount()
    {
        var orderId = Guid.NewGuid();
        _context.Notifications.Add(NotificationFactory.OrderPlaced(_me, orderId));
        _context.Notifications.Add(NotificationFactory.Delivered(_me, orderId));
        await _context.SaveChangesAsync();

        await _service.MarkAllReadAsync();

        Assert.Equal(0, await _service.UnreadCountAsync());
        Assert.All(await _service.ListAsync(), n => Assert.True(n.IsRead));
    }

    private sealed class StubCurrentUser : ICurrentUserService
    {
        public Guid? UserId { get; set; }
    }
}
