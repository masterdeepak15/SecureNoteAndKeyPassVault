using Google.Apis.Auth;

namespace SecureNotesAPI.Application.Interfaces;

public interface IGoogleAuthService
{
    /// <summary>
    /// Validates Google ID token and returns user information
    /// </summary>
    Task<GoogleJsonWebSignature.Payload?> ValidateGoogleTokenAsync(string idToken);
}
