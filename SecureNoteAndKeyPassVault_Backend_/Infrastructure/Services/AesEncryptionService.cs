using System.Security.Cryptography;
using System.Text;
using SecureNotesAPI.Application.Interfaces;

namespace SecureNotesAPI.Infrastructure.Services;

/// <summary>
/// AES-256 encryption for database storage (Application-level encryption)
/// This is the SECOND layer - protects data at rest in the database
/// Uses UNIQUE SALT per encryption to ensure identical plaintext creates different ciphertext
/// </summary>
public class AesEncryptionService : IAesEncryptionService
{
    private readonly byte[] _masterKey;
    private const int SaltSize = 16; // 128 bits
    private const int IvSize = 16;   // 128 bits for AES

    public AesEncryptionService(IConfiguration configuration)
    {
        // Get master key from configuration
        // In production, use Azure Key Vault, AWS KMS, or similar
        var masterKey = configuration["Encryption:MasterKey"] ?? 
            "ThisIsASecureMasterKey32Bytes!!"; // Must be 32 bytes for AES-256
        
        // Derive key
        _masterKey = DeriveKey(masterKey, 32);
    }

    public string EncryptForStorage(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return plainText;

        // Generate random salt for this encryption
        var salt = GenerateRandomBytes(SaltSize);
        
        // Generate random IV for this encryption
        var iv = GenerateRandomBytes(IvSize);

        using var aes = Aes.Create();
        aes.Key = _masterKey;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        
        // Combine: [salt (16 bytes)][iv (16 bytes)][encrypted data]
        var result = new byte[SaltSize + IvSize + encryptedBytes.Length];
        Buffer.BlockCopy(salt, 0, result, 0, SaltSize);
        Buffer.BlockCopy(iv, 0, result, SaltSize, IvSize);
        Buffer.BlockCopy(encryptedBytes, 0, result, SaltSize + IvSize, encryptedBytes.Length);
        
        return Convert.ToBase64String(result);
    }

    public string DecryptFromStorage(string encryptedText)
    {
        if (string.IsNullOrEmpty(encryptedText))
            return encryptedText;

        var allBytes = Convert.FromBase64String(encryptedText);
        
        // Extract: [salt (16 bytes)][iv (16 bytes)][encrypted data]
        var salt = new byte[SaltSize];
        var iv = new byte[IvSize];
        var encryptedBytes = new byte[allBytes.Length - SaltSize - IvSize];
        
        Buffer.BlockCopy(allBytes, 0, salt, 0, SaltSize);
        Buffer.BlockCopy(allBytes, SaltSize, iv, 0, IvSize);
        Buffer.BlockCopy(allBytes, SaltSize + IvSize, encryptedBytes, 0, encryptedBytes.Length);

        using var aes = Aes.Create();
        aes.Key = _masterKey;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        var decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);
        
        return Encoding.UTF8.GetString(decryptedBytes);
    }

    /// <summary>
    /// Generates cryptographically secure random bytes
    /// </summary>
    private byte[] GenerateRandomBytes(int length)
    {
        var bytes = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return bytes;
    }

    /// <summary>
    /// Derives a key of specified length from a password
    /// </summary>
    private byte[] DeriveKey(string password, int keyLength)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        var key = new byte[keyLength];
        Array.Copy(hash, key, keyLength);
        return key;
    }
}
