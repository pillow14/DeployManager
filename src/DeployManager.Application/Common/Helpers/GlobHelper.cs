using System.Text.RegularExpressions;

namespace DeployManager.Application.Common.Helpers;

public static class GlobHelper
{
    public static bool Match(string filePath, string pattern)
    {
        var regex = "^" + Regex.Escape(pattern)
            .Replace("\\*\\*\\/", ".*")
            .Replace("\\*\\*", ".*")
            .Replace("\\*", "[^/]*")
            .Replace("\\?", ".") + "$";
        return Regex.IsMatch(filePath, regex, RegexOptions.IgnoreCase);
    }
}
