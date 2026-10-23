namespace Hsimah.Acceptance.Lib;

/// <summary>A test class whose every test starts with a fresh signed-in operator session.</summary>
public abstract class OperatorTest : IAsyncLifetime
{
    protected Api api = null!;

    public virtual async ValueTask InitializeAsync() => api = await Api.Operator();

    public virtual async ValueTask DisposeAsync() => await api.DisposeAsync();
}
