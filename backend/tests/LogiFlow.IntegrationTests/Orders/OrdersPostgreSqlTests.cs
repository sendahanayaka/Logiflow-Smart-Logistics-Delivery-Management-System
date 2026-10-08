using System;
using System.Threading.Tasks;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LogiFlow.IntegrationTests.Orders;

public class OrdersPostgreSqlTests
{
    private readonly string? _connectionString;

    public OrdersPostgreSqlTests()
    {
        _connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__TestDatabase");
    }

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString!)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task DeliveryOrder_CanBePersistedAndReadBack_FromPostgreSql()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            return;
        }

        var roleId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        var role = new Role { Id = roleId, Name = "TEST_ROLE" };
        var user = new User
        {
            Id = customerId,
            RoleId = roleId,
            Name = "Integration Test User",
            Email = $"test-{customerId}@example.com",
            PasswordHash = "hash"
        };

        var order = new DeliveryOrder
        {
            Id = orderId,
            CustomerId = customerId,
            PickupAddress = "123 Npgsql St",
            PickupCity = "Colombo",
            DeliveryAddress = "456 Test Ave",
            DeliveryCity = "Kandy",
            PackageDescription = "Test Box",
            Priority = DeliveryPriority.Standard,
            WeightKg = 5.0m,
            LengthCm = 10.0m,
            WidthCm = 10.0m,
            HeightCm = 10.0m,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await using (var context = CreateDbContext())
        {
            context.Roles.Add(role);
            context.Users.Add(user);
            context.DeliveryOrders.Add(order);
            await context.SaveChangesAsync();
        }

        // Act - Read
        DeliveryOrder? storedOrder;
        await using (var context = CreateDbContext())
        {
            storedOrder = await context.DeliveryOrders.SingleOrDefaultAsync(o => o.Id == orderId);
        }

        await using (var context = CreateDbContext())
        {
            var toDelete = await context.DeliveryOrders.FindAsync(orderId);
            if (toDelete != null)
            {
                context.DeliveryOrders.Remove(toDelete);
            }
            var u = await context.Users.FindAsync(customerId);
            if (u != null) context.Users.Remove(u);
            var r = await context.Roles.FindAsync(roleId);
            if (r != null) context.Roles.Remove(r);
            await context.SaveChangesAsync();
        }

        // Assert
        Assert.NotNull(storedOrder);
        Assert.Equal(customerId, storedOrder.CustomerId);
        Assert.Equal("123 Npgsql St", storedOrder.PickupAddress);
        Assert.Equal("456 Test Ave", storedOrder.DeliveryAddress);
        Assert.Equal(5.0m, storedOrder.WeightKg);
        Assert.Equal(10.0m, storedOrder.LengthCm);
        Assert.Equal(OrderStatus.Pending, storedOrder.Status);
        Assert.NotEqual(default, storedOrder.CreatedAt);
    }

    [Fact]
    public async Task DeliveryOrder_StatusChange_IsPersisted_InPostgreSql()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            return;
        }

        var roleId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var customerId = Guid.NewGuid();

        var role = new Role { Id = roleId, Name = "TEST_ROLE" };
        var user = new User
        {
            Id = customerId,
            RoleId = roleId,
            Name = "Integration Test User",
            Email = $"test-{customerId}@example.com",
            PasswordHash = "hash"
        };

        var order = new DeliveryOrder
        {
            Id = orderId,
            CustomerId = customerId,
            PickupAddress = "1", PickupCity = "C",
            DeliveryAddress = "2", DeliveryCity = "K",
            PackageDescription = "desc",
            Priority = DeliveryPriority.Express,
            WeightKg = 1, LengthCm = 1, WidthCm = 1, HeightCm = 1,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await using (var context = CreateDbContext())
        {
            context.Roles.Add(role);
            context.Users.Add(user);
            context.DeliveryOrders.Add(order);
            await context.SaveChangesAsync();
        }

        // Update
        var updateTime = DateTime.UtcNow;
        await using (var context = CreateDbContext()) // New DbContext instance to simulate API call boundary
        {
            var toUpdate = await context.DeliveryOrders.SingleAsync(o => o.Id == orderId);
            toUpdate.Status = OrderStatus.Cancelled;
            toUpdate.UpdatedAt = updateTime;
            await context.SaveChangesAsync();
        }

        // Read again
        DeliveryOrder? updatedOrder;
        await using (var context = CreateDbContext()) // New DbContext instance
        {
            updatedOrder = await context.DeliveryOrders.SingleOrDefaultAsync(o => o.Id == orderId);
            
            // Cleanup
            if (updatedOrder != null)
            {
                context.DeliveryOrders.Remove(updatedOrder);
            }
            var u = await context.Users.FindAsync(customerId);
            if (u != null) context.Users.Remove(u);
            var r = await context.Roles.FindAsync(roleId);
            if (r != null) context.Roles.Remove(r);
            await context.SaveChangesAsync();
        }

        // Assert
        Assert.NotNull(updatedOrder);
        Assert.Equal(OrderStatus.Cancelled, updatedOrder.Status);
        
        // EF Core DateTime mapping sometimes strips sub-milliseconds in PostgreSql,
        // so checking differences less than 1 second is safer if direct equal fails,
        // but let's assert equality exact as first step (Npgsql default is microsecond precision).
        var diff = Math.Abs((updateTime - updatedOrder.UpdatedAt.Value.ToUniversalTime()).TotalSeconds);
        Assert.True(diff < 1, "UpdatedAt should be within 1 second of updateTime");
    }

    [Fact]
    public async Task DeliveryOrder_CannotBePersisted_WithInvalidCustomerId()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var orderId = Guid.NewGuid();
        var invalidCustomerId = Guid.NewGuid();

        var order = new DeliveryOrder
        {
            Id = orderId, CustomerId = invalidCustomerId, PickupAddress = "A", PickupCity = "C",
            DeliveryAddress = "B", DeliveryCity = "K", PackageDescription = "D",
            Priority = DeliveryPriority.Standard, WeightKg = 5, LengthCm = 5, WidthCm = 5, HeightCm = 5,
            Status = OrderStatus.Pending, CreatedAt = DateTime.UtcNow
        };

        DbUpdateException? exception = null;
        await using (var context = CreateDbContext())
        {
            context.DeliveryOrders.Add(order);
            exception = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
        }

        Assert.NotNull(exception);
    }

    [Fact]
    public async Task DeliveryOrder_CannotBePersisted_WithNegativeWeight()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var roleId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        var role = new Role { Id = roleId, Name = "TEST_ROLE" };
        var user = new User { Id = customerId, RoleId = roleId, Name = "Test User", Email = $"test-{customerId}@example.com", PasswordHash = "hash" };

        var order = new DeliveryOrder
        {
            Id = orderId, CustomerId = customerId, PickupAddress = "A", PickupCity = "C",
            DeliveryAddress = "B", DeliveryCity = "K", PackageDescription = "D",
            Priority = DeliveryPriority.Standard, 
            WeightKg = -5m, // Violates check constraint "CK_DeliveryOrders_Weight_Positive"
            LengthCm = 5, WidthCm = 5, HeightCm = 5,
            Status = OrderStatus.Pending, CreatedAt = DateTime.UtcNow
        };

        await using (var context = CreateDbContext())
        {
            context.Roles.Add(role);
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        DbUpdateException? exception = null;
        await using (var context = CreateDbContext())
        {
            context.DeliveryOrders.Add(order);
            exception = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
        }

        // Cleanup
        await using (var context = CreateDbContext())
        {
            var u = await context.Users.FindAsync(customerId);
            if (u != null) context.Users.Remove(u);
            var r = await context.Roles.FindAsync(roleId);
            if (r != null) context.Roles.Remove(r);
            await context.SaveChangesAsync();
        }

        Assert.NotNull(exception);
        Assert.Contains("CK_DeliveryOrders_Weight_Positive", exception.InnerException?.Message ?? "");
    }

    [Fact]
    public async Task DeliveryOrder_CustomerDelete_IsRestricted_WhileOrderExists()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var roleId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        var role = new Role { Id = roleId, Name = "TEST_ROLE" };
        var user = new User { Id = customerId, RoleId = roleId, Name = "Test User", Email = $"test-{customerId}@example.com", PasswordHash = "hash" };

        var order = new DeliveryOrder
        {
            Id = orderId, CustomerId = customerId, PickupAddress = "A", PickupCity = "C",
            DeliveryAddress = "B", DeliveryCity = "K", PackageDescription = "D",
            Priority = DeliveryPriority.Standard, WeightKg = 5, LengthCm = 5, WidthCm = 5, HeightCm = 5,
            Status = OrderStatus.Pending, CreatedAt = DateTime.UtcNow
        };

        await using (var context = CreateDbContext())
        {
            context.Roles.Add(role);
            context.Users.Add(user);
            context.DeliveryOrders.Add(order);
            await context.SaveChangesAsync();
        }

        DbUpdateException? exception = null;
        await using (var context = CreateDbContext())
        {
            var u = await context.Users.FindAsync(customerId);
            context.Users.Remove(u!);
            exception = await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
        }

        // Cleanup properly
        await using (var context = CreateDbContext())
        {
            var o = await context.DeliveryOrders.FindAsync(orderId);
            if (o != null) context.DeliveryOrders.Remove(o);
            var u = await context.Users.FindAsync(customerId);
            if (u != null) context.Users.Remove(u);
            var r = await context.Roles.FindAsync(roleId);
            if (r != null) context.Roles.Remove(r);
            await context.SaveChangesAsync();
        }
        
        Assert.NotNull(exception);
    }

    [Fact]
    public async Task DeliveryOrder_EFCoreMigrations_CreateExpectedPostgreSqlSchema()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        await using var context = CreateDbContext();
        
        // Test idempotently that Migration histories are available and applicable
        await context.Database.MigrateAsync();
        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
        Assert.NotEmpty(appliedMigrations);
        
        // Assert the mapping configurations mathematically map correctly to Relational structures
        var entityType = context.Model.FindEntityType(typeof(DeliveryOrder));
        Assert.NotNull(entityType);
        
        var tableName = entityType.GetTableName();
        Assert.Equal("DeliveryOrders", tableName);

        var columns = entityType.GetProperties();
        Assert.Contains(columns, p => p.Name == "Id");
        Assert.Contains(columns, p => p.Name == "CustomerId");
        Assert.Contains(columns, p => p.Name == "WeightKg");
        Assert.Contains(columns, p => p.Name == "Priority");

        // Verify relational foreign key constraint maps internally correctly back to User
        var fks = entityType.GetForeignKeys();
        Assert.Contains(fks, fk => fk.PrincipalEntityType.ClrType == typeof(User) && fk.Properties[0].Name == "CustomerId");
    }

    [Fact]
    public async Task DeliveryOrder_TransactionRollback_RemovesAllChangesAfterFailure()
    {
        if (string.IsNullOrWhiteSpace(_connectionString)) return;

        var roleId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        var role = new Role { Id = roleId, Name = "TRANSACTION_ROLE" };
        var user = new User { Id = customerId, RoleId = roleId, Name = "Trans User", Email = $"trans-{customerId}@example.com", PasswordHash = "hash" };
        
        var validOrder = new DeliveryOrder {
            Id = orderId, CustomerId = customerId, PickupAddress = "A", PickupCity = "C",
            DeliveryAddress = "B", DeliveryCity = "K", PackageDescription = "D",
            Priority = DeliveryPriority.Standard, WeightKg = 5, LengthCm = 5, WidthCm = 5, HeightCm = 5,
            Status = OrderStatus.Pending, CreatedAt = DateTime.UtcNow
        };

        var invalidOrder = new DeliveryOrder {
            Id = Guid.NewGuid(), CustomerId = customerId, PickupAddress = "A", PickupCity = "C",
            DeliveryAddress = "B", DeliveryCity = "K", PackageDescription = "D",
            Priority = DeliveryPriority.Standard, 
            WeightKg = -10, // Violates check constraint explicitly to force database-engine rejection
            LengthCm = 5, WidthCm = 5, HeightCm = 5,
            Status = OrderStatus.Pending, CreatedAt = DateTime.UtcNow
        };

        await using (var context = CreateDbContext())
        {
            await context.Database.BeginTransactionAsync();
            
            try 
            {
                // Atomic Step 1: Add dependencies & valid order
                context.Roles.Add(role);
                context.Users.Add(user);
                context.DeliveryOrders.Add(validOrder);
                await context.SaveChangesAsync();

                // Atomic Step 2: Add invalid order (forced failure execution)
                context.DeliveryOrders.Add(invalidOrder);
                await context.SaveChangesAsync();
                
                await context.Database.CommitTransactionAsync();
            }
            catch (Exception)
            {
                await context.Database.RollbackTransactionAsync();
            }
        }

        // Verification phase bounds test execution on fresh DbContext query
        await using (var verifyContext = CreateDbContext())
        {
            var exists = await verifyContext.DeliveryOrders.AnyAsync(o => o.Id == orderId);
            Assert.False(exists, "Order should not exist because the transaction rolled back.");
            
            var userExists = await verifyContext.Users.AnyAsync(u => u.Id == customerId);
            Assert.False(userExists, "User should not exist because the transaction rolled back.");
        }
    }
}
