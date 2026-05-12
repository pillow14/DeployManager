namespace DeployManager.Domain.Common;

public static class Roles
{
    public const string Administrator = "Administrator";
    public const string Publisher = "Publisher";
    public const string Viewer = "Viewer";

    public static readonly string[] All = [Administrator, Publisher, Viewer];
}
