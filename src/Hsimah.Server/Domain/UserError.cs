namespace Hsimah.Domain;

/// <summary>A deliberate application validation message safe to return to a client.</summary>
public sealed class UserError(string message) : Exception(message);
