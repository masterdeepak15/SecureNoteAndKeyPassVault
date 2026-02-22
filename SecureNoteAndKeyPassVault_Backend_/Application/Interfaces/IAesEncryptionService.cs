using System.Security.Cryptography;
using System.Text;

namespace SecureNotesAPI.Application.Interfaces;

/// <summary>
/// AES encryption service for database storage
/// This is the SECOND layer of encryption (application-level)
/// </summary>
public interface IAesEncryptionService
{
    /// <summary>
    /// Encrypts data for database storage using application's master key
    /// </summary>
    string EncryptForStorage(string plainText);
    
    /// <summary>
    /// Decrypts data from database using application's master key
    /// </summary>
    string DecryptFromStorage(string encryptedText);
}
