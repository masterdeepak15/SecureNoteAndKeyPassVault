namespace SecureNotesAPI.Infrastructure.Utils;

/// <summary>
/// Parses User-Agent string to extract browser, OS, and device information
/// No third-party dependencies - pure C# implementation
/// </summary>
public static class UserAgentParser
{
    public static (string Browser, string OS, string DeviceType) Parse(string userAgent)
    {
        if (string.IsNullOrEmpty(userAgent))
            return ("Unknown", "Unknown", "Unknown");

        var browser = DetectBrowser(userAgent);
        var os = DetectOperatingSystem(userAgent);
        var deviceType = DetectDeviceType(userAgent);

        return (browser, os, deviceType);
    }

    private static string DetectBrowser(string userAgent)
    {
        // Check in order of specificity
        if (userAgent.Contains("Edg/"))
            return "Edge " + ExtractVersion(userAgent, "Edg/");
        
        if (userAgent.Contains("Chrome/") && !userAgent.Contains("Edg/"))
            return "Chrome " + ExtractVersion(userAgent, "Chrome/");
        
        if (userAgent.Contains("Firefox/"))
            return "Firefox " + ExtractVersion(userAgent, "Firefox/");
        
        if (userAgent.Contains("Safari/") && !userAgent.Contains("Chrome/"))
            return "Safari " + ExtractVersion(userAgent, "Version/");
        
        if (userAgent.Contains("Opera/") || userAgent.Contains("OPR/"))
            return "Opera " + ExtractVersion(userAgent, "OPR/");
        
        if (userAgent.Contains("MSIE") || userAgent.Contains("Trident/"))
            return "Internet Explorer";

        return "Unknown Browser";
    }

    private static string DetectOperatingSystem(string userAgent)
    {
        if (userAgent.Contains("Windows NT 10.0"))
            return "Windows 10/11";
        
        if (userAgent.Contains("Windows NT 6.3"))
            return "Windows 8.1";
        
        if (userAgent.Contains("Windows NT 6.2"))
            return "Windows 8";
        
        if (userAgent.Contains("Windows NT 6.1"))
            return "Windows 7";
        
        if (userAgent.Contains("Windows"))
            return "Windows";
        
        if (userAgent.Contains("Mac OS X"))
        {
            var version = ExtractMacVersion(userAgent);
            return string.IsNullOrEmpty(version) ? "macOS" : $"macOS {version}";
        }
        
        if (userAgent.Contains("Android"))
        {
            var version = ExtractVersion(userAgent, "Android ");
            return string.IsNullOrEmpty(version) ? "Android" : $"Android {version}";
        }
        
        if (userAgent.Contains("iPhone") || userAgent.Contains("iPad"))
        {
            var version = ExtractIOSVersion(userAgent);
            return string.IsNullOrEmpty(version) ? "iOS" : $"iOS {version}";
        }
        
        if (userAgent.Contains("Linux"))
            return "Linux";
        
        if (userAgent.Contains("Ubuntu"))
            return "Ubuntu";
        
        if (userAgent.Contains("CrOS"))
            return "Chrome OS";

        return "Unknown OS";
    }

    private static string DetectDeviceType(string userAgent)
    {
        if (userAgent.Contains("Mobile") || userAgent.Contains("iPhone"))
            return "Mobile";
        
        if (userAgent.Contains("Tablet") || userAgent.Contains("iPad"))
            return "Tablet";
        
        return "Desktop";
    }

    private static string ExtractVersion(string userAgent, string identifier)
    {
        try
        {
            var startIndex = userAgent.IndexOf(identifier);
            if (startIndex == -1) return "";

            startIndex += identifier.Length;
            var endIndex = userAgent.IndexOfAny(new[] { ' ', ';', ')' }, startIndex);
            if (endIndex == -1) endIndex = userAgent.Length;

            var version = userAgent.Substring(startIndex, endIndex - startIndex);
            
            // Take only major.minor version
            var parts = version.Split('.');
            return parts.Length >= 2 ? $"{parts[0]}.{parts[1]}" : parts[0];
        }
        catch
        {
            return "";
        }
    }

    private static string ExtractMacVersion(string userAgent)
    {
        try
        {
            var match = System.Text.RegularExpressions.Regex.Match(userAgent, @"Mac OS X (\d+[._]\d+)");
            if (match.Success)
            {
                var version = match.Groups[1].Value.Replace('_', '.');
                return version;
            }
            return "";
        }
        catch
        {
            return "";
        }
    }

    private static string ExtractIOSVersion(string userAgent)
    {
        try
        {
            var match = System.Text.RegularExpressions.Regex.Match(userAgent, @"OS (\d+[._]\d+)");
            if (match.Success)
            {
                var version = match.Groups[1].Value.Replace('_', '.');
                return version;
            }
            return "";
        }
        catch
        {
            return "";
        }
    }
}
