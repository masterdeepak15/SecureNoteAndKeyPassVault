using Google.Apis.Auth;
using SecureNotesAPI.Application.Interfaces;

namespace SecureNotesAPI.Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly IConfiguration _configuration;

    public GoogleAuthService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<GoogleJsonWebSignature.Payload?> ValidateGoogleTokenAsync(string idToken)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _configuration["Google:ClientId"] ?? "" }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            return payload;
        }
        catch (Exception)
        {
            return null;
        }
    }
}
