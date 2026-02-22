namespace SecureNotesAPI.Application.Interfaces;

public interface IRsaEncryptionService
{
    /// <summary>
    /// Generates a new RSA key pair
    /// </summary>
    (string publicKey, string privateKey) GenerateKeyPair(int keySize = 2048);
    
    /// <summary>
    /// Encrypts data using the provided public key
    /// </summary>
    string Encrypt(string plainText, string publicKeyXml);
    
    /// <summary>
    /// Decrypts data using the provided private key
    /// </summary>
    string Decrypt(string encryptedText, string privateKeyXml);
    
    /// <summary>
    /// Exports public key to PEM format for client compatibility
    /// </summary>
    string ExportPublicKeyToPem(string publicKeyXml);
    
    /// <summary>
    /// Imports public key from PEM format
    /// </summary>
    string ImportPublicKeyFromPem(string pemKey);
}
