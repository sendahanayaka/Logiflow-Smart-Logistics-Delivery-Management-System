namespace LogiFlow.Application.Auth;

public static class PasswordPolicy
{
    public const int MinimumLength = 8;
    public const bool RequireUppercase = true;
    public const bool RequireLowercase = true;
    public const bool RequireDigit = true;
    public const bool RequireNonAlphanumeric = true;

    public static IReadOnlyCollection<string> Validate(string? password)
    {
        if (string.IsNullOrEmpty(password))
        {
            return ["Password is required."];
        }

        var errors = new List<string>();

        if (password.Length < MinimumLength)
        {
            errors.Add(
                $"Password must be at least {MinimumLength} characters long.");
        }

        if (RequireUppercase && !password.Any(char.IsUpper))
        {
            errors.Add("Password must contain an uppercase letter.");
        }

        if (RequireLowercase && !password.Any(char.IsLower))
        {
            errors.Add("Password must contain a lowercase letter.");
        }

        if (RequireDigit && !password.Any(char.IsDigit))
        {
            errors.Add("Password must contain a number.");
        }

        if (RequireNonAlphanumeric && password.All(char.IsLetterOrDigit))
        {
            errors.Add("Password must contain a special character.");
        }

        return errors;
    }
}
