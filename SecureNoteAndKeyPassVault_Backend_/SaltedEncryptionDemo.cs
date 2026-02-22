// Demo: Salted Encryption Test
// Uncomment and run this in Program.cs to see salted encryption in action

/*
using SecureNotesAPI.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

// Create test configuration
var config = new ConfigurationBuilder()
    .AddInMemoryCollection(new Dictionary<string, string>
    {
        {"Encryption:MasterKey", "TestMasterKey_32BytesForAES!!"}
    })
    .Build();

var aesService = new AesEncryptionService(config);

Console.WriteLine("=== SALTED ENCRYPTION DEMO ===\n");

// Test 1: Same plaintext, different ciphertext
Console.WriteLine("Test 1: Encrypting 'admin' three times...\n");

var plaintext = "admin";
var encrypted1 = aesService.EncryptForStorage(plaintext);
var encrypted2 = aesService.EncryptForStorage(plaintext);
var encrypted3 = aesService.EncryptForStorage(plaintext);

Console.WriteLine($"Plaintext:    {plaintext}");
Console.WriteLine($"Encrypted 1:  {encrypted1}");
Console.WriteLine($"Encrypted 2:  {encrypted2}");
Console.WriteLine($"Encrypted 3:  {encrypted3}");
Console.WriteLine($"\nAll different? {encrypted1 != encrypted2 && encrypted2 != encrypted3} ✅\n");

// Test 2: All decrypt to same value
Console.WriteLine("Test 2: Decrypting all three...\n");

var decrypted1 = aesService.DecryptFromStorage(encrypted1);
var decrypted2 = aesService.DecryptFromStorage(encrypted2);
var decrypted3 = aesService.DecryptFromStorage(encrypted3);

Console.WriteLine($"Decrypted 1:  {decrypted1}");
Console.WriteLine($"Decrypted 2:  {decrypted2}");
Console.WriteLine($"Decrypted 3:  {decrypted3}");
Console.WriteLine($"\nAll same?     {decrypted1 == decrypted2 && decrypted2 == decrypted3} ✅\n");

// Test 3: Storage format
Console.WriteLine("Test 3: Storage format analysis...\n");

var bytes = Convert.FromBase64String(encrypted1);
Console.WriteLine($"Total bytes:       {bytes.Length}");
Console.WriteLine($"Salt (16 bytes):   {Convert.ToBase64String(bytes[0..16])}");
Console.WriteLine($"IV (16 bytes):     {Convert.ToBase64String(bytes[16..32])}");
Console.WriteLine($"Data ({bytes.Length - 32} bytes):  {Convert.ToBase64String(bytes[32..])}");

Console.WriteLine("\n=== DEMO COMPLETE ===");
*/
