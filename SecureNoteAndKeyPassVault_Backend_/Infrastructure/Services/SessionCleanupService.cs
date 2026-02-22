using SecureNotesAPI.Application.Interfaces;

namespace SecureNotesAPI.Infrastructure.Services;

/// <summary>
/// Background service that periodically cleans up expired sessions
/// Runs every 5 minutes
/// </summary>
public class SessionCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SessionCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(5);

    public SessionCleanupService(
        IServiceProvider serviceProvider,
        ILogger<SessionCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Session Cleanup Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredSessionsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while cleaning up sessions");
            }

            await Task.Delay(_cleanupInterval, stoppingToken);
        }

        _logger.LogInformation("Session Cleanup Service stopped");
    }

    private async Task CleanupExpiredSessionsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var sessionService = scope.ServiceProvider.GetRequiredService<ISessionService>();

        var cleanedCount = await sessionService.CleanupExpiredSessionsAsync();

        if (cleanedCount > 0)
        {
            _logger.LogInformation("Cleaned up {Count} expired sessions", cleanedCount);
        }
    }
}
