using System.Security.Cryptography;
using System.Text;
using SecureNotesAPI.Application.Interfaces;

namespace SecureNotesAPI.Infrastructure.Services;

public class RsaEncryptionService : IRsaEncryptionService
{
    public (string publicKey, string privateKey) GenerateKeyPair(int keySize = 2048)
    {
        using var rsa = RSA.Create(keySize);
        var publicKey = rsa.ToXmlString(false);
        var privateKey = rsa.ToXmlString(true);
        return (publicKey, privateKey);
    }

    public string Encrypt(string plainText, string publicKeyXml)
    {
        using var rsa = RSA.Create();
        rsa.FromXmlString(publicKeyXml);
        
        var dataToEncrypt = Encoding.UTF8.GetBytes(plainText);
        var encryptedData = rsa.Encrypt(dataToEncrypt, RSAEncryptionPadding.OaepSHA256);
        
        return Convert.ToBase64String(encryptedData);
    }

    public string Decrypt(string encryptedText, string privateKeyXml)
    {
        using var rsa = RSA.Create();
        rsa.FromXmlString(privateKeyXml);
        
        var dataToDecrypt = Convert.FromBase64String(encryptedText);
        var decryptedData = rsa.Decrypt(dataToDecrypt, RSAEncryptionPadding.OaepSHA256);
        
        return Encoding.UTF8.GetString(decryptedData);
    }

    public string ExportPublicKeyToPem(string publicKeyXml)
    {
        using var rsa = RSA.Create();
        rsa.FromXmlString(publicKeyXml);
        
        var publicKeyBytes = rsa.ExportSubjectPublicKeyInfo();
        var base64 = Convert.ToBase64String(publicKeyBytes);
        
        var sb = new StringBuilder();
        sb.AppendLine("-----BEGIN PUBLIC KEY-----");
        
        for (int i = 0; i < base64.Length; i += 64)
        {
            var length = Math.Min(64, base64.Length - i);
            sb.AppendLine(base64.Substring(i, length));
        }
        
        sb.AppendLine("-----END PUBLIC KEY-----");
        return sb.ToString();
    }

    public string ImportPublicKeyFromPem(string pemKey)
    {
        var base64 = pemKey
            .Replace("-----BEGIN PUBLIC KEY-----", "")
            .Replace("-----END PUBLIC KEY-----", "")
            .Replace("\n", "")
            .Replace("\r", "")
            .Trim();
        
        var keyBytes = Convert.FromBase64String(base64);
        
        using var rsa = RSA.Create();
        rsa.ImportSubjectPublicKeyInfo(keyBytes, out _);
        
        return rsa.ToXmlString(false);
    }
}
