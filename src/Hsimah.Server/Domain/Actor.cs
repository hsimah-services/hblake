using Elephentity.Runtime.Policy;
using Hsimah.Entity;
using Hsimah.Entity.Enums;

namespace Hsimah.Domain;

/// <summary>Who is acting: a signed-in staff user, the operator bootstrap, or a visitor.</summary>
public sealed class Actor(User? user = null, bool bootstrap = false) : IViewer
{
    public static readonly Actor Visitor = new();
    public static readonly Actor Operator = new(bootstrap: true);

    public User? User { get; } = user;

    public string? Id => User?.Id.ToString();

    public bool IsAuthenticated => bootstrap || (User?.Active ?? false);

    public bool HasRole(string role) =>
        IsAuthenticated && (bootstrap ? role == "admin" : User?.Role.ToWire() == role);

    public bool Can(string capability) => false;
}

/// <summary>What is known about the request in progress: who is acting, and facts several policy checks share.</summary>
public sealed class RequestState(Actor actor)
{
    private Task<HashSet<string>>? hiddenItems;

    public Actor Actor { get; } = actor;

    /// <summary>The ids of items whose page is not published, computed once per request on first use.</summary>
    public Task<HashSet<string>> HiddenItems(Func<Task<HashSet<string>>> compute) => hiddenItems ??= compute();
}

/// <summary>The viewer of the current async flow; set by the request pipeline and the operator commands.</summary>
public sealed class RequestViewerProvider : IViewerProvider
{
    private static readonly AsyncLocal<RequestState?> Current = new();

    public static Actor Actor => Current.Value?.Actor ?? Actor.Visitor;

    public static RequestState State => Current.Value ?? new RequestState(Actor.Visitor);

    public IViewer Viewer() => Actor;

    public static IDisposable Use(Actor actor)
    {
        var previous = Current.Value;
        Current.Value = new RequestState(actor);
        return new Scope(previous);
    }

    private sealed class Scope(RequestState? previous) : IDisposable
    {
        public void Dispose() => Current.Value = previous;
    }
}
