using static Hsimah.Acceptance.Lib.Contents;

namespace Hsimah.Acceptance.Http;

// Publishable: website.md "publish sets status and first publishedAt together…" and acceptance 3. status/publishedAt still appear
// in generated inputs until elephentity#103, so the verifiers must reject direct changes.
public class PublicationTests : IAsyncLifetime
{
    private Api operatorSession = null!;
    private Api anonymous = null!;

    public async ValueTask InitializeAsync()
    {
        operatorSession = await Api.Operator();
        anonymous = await Api.Anonymous();
    }

    public async ValueTask DisposeAsync()
    {
        await operatorSession.DisposeAsync();
        await anonymous.DisposeAsync();
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Publish_sets_status_and_a_server_clock_publishedAt_together(Kind kind)
    {
        var row = await CreateOk(operatorSession, kind);
        Assert.Null(await BySlug(anonymous, kind, row.Slug));
        var published = await PublishOk(operatorSession, kind, row.Id);
        Assert.Equal("PUBLISHED", published.Status);
        ExpectRecent(published.PublishedAt, "publishedAt");
        var visible = await BySlug(anonymous, kind, row.Slug);
        Assert.Equal(row.Id, visible?.Id);
        Assert.Equal("PUBLISHED", visible?.Status);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Publishing_again_keeps_the_first_publication_time(Kind kind)
    {
        var first = await PublishOk(operatorSession, kind, (await CreateOk(operatorSession, kind)).Id);
        await Task.Delay(1_100);
        var again = await Action(operatorSession, kind, "publish", first.Id);
        // Either outcome is acceptable for a repeat publish; the timestamp must not move.
        if (again.Errors.Count == 0)
        {
            Assert.NotNull(again.Data![$"publish{TypeName(kind)}"]);
        }

        var after = await ById(operatorSession, kind, first.Id);
        Assert.Equal("PUBLISHED", after?.Status);
        Assert.Equal(first.PublishedAt, after?.PublishedAt);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Unpublish_hides_the_record_immediately_and_keeps_publishedAt(Kind kind)
    {
        var published = await PublishOk(operatorSession, kind, (await CreateOk(operatorSession, kind)).Id);
        Assert.NotNull(await BySlug(anonymous, kind, published.Slug));
        var unpublished = await UnpublishOk(operatorSession, kind, published.Id);
        Assert.Equal("DRAFT", unpublished.Status);
        Assert.Equal(published.PublishedAt, unpublished.PublishedAt);
        Assert.Null(await BySlug(anonymous, kind, published.Slug));
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Republishing_keeps_the_original_publication_time(Kind kind)
    {
        var published = await PublishOk(operatorSession, kind, (await CreateOk(operatorSession, kind)).Id);
        await UnpublishOk(operatorSession, kind, published.Id);
        await Task.Delay(1_100);
        var republished = await PublishOk(operatorSession, kind, published.Id);
        Assert.Equal("PUBLISHED", republished.Status);
        Assert.Equal(published.PublishedAt, republished.PublishedAt);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Create_cannot_start_published(Kind kind)
    {
        var input = Defaults(kind, Input(("status", "PUBLISHED")));
        Api.ExpectRejected(await Create(operatorSession, kind, input), "create requires draft status");
        Assert.Null(await BySlug(operatorSession, kind, (string)input["slug"]!));
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Create_cannot_set_publishedAt(Kind kind)
    {
        var input = Defaults(kind, Input(("publishedAt", "2020-01-01T00:00:00+00:00")));
        Api.ExpectRejected(await Create(operatorSession, kind, input), "create requires null publishedAt");
        Assert.Null(await BySlug(operatorSession, kind, (string)input["slug"]!));
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Update_cannot_publish_by_setting_status(Kind kind)
    {
        var row = await CreateOk(operatorSession, kind);
        Api.ExpectRejected(await Update(operatorSession, kind, row.Id, Input(("status", "PUBLISHED"))));
        var after = await ById(operatorSession, kind, row.Id);
        Assert.Equal("DRAFT", after?.Status);
        Assert.Null(after?.PublishedAt);
        Assert.Null(await BySlug(anonymous, kind, row.Slug));
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Update_cannot_unpublish_by_setting_status(Kind kind)
    {
        var published = await PublishOk(operatorSession, kind, (await CreateOk(operatorSession, kind)).Id);
        Api.ExpectRejected(await Update(operatorSession, kind, published.Id, Input(("status", "DRAFT"))));
        Assert.Equal("PUBLISHED", (await ById(operatorSession, kind, published.Id))?.Status);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Update_cannot_set_or_clear_publishedAt(Kind kind)
    {
        var draft = await CreateOk(operatorSession, kind);
        Api.ExpectRejected(await Update(operatorSession, kind, draft.Id, Input(("publishedAt", "2020-01-01T00:00:00+00:00"))));
        Assert.Null((await ById(operatorSession, kind, draft.Id))?.PublishedAt);

        var published = await PublishOk(operatorSession, kind, (await CreateOk(operatorSession, kind)).Id);
        Api.ExpectRejected(await Update(operatorSession, kind, published.Id, Input(("publishedAt", null))));
        Api.ExpectRejected(await Update(operatorSession, kind, published.Id, Input(("publishedAt", "2020-01-01T00:00:00+00:00"))));
        Assert.Equal(published.PublishedAt, (await ById(operatorSession, kind, published.Id))?.PublishedAt);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task An_ordinary_save_may_resend_the_unchanged_status(Kind kind)
    {
        var row = await CreateOk(operatorSession, kind);
        var saved = await UpdateOk(operatorSession, kind, row.Id, Input(("title", $"{row.Title}!"), ("status", "DRAFT")));
        Assert.Equal($"{row.Title}!", saved.Title);
        Assert.Equal("DRAFT", saved.Status);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Publishing_requires_a_nonblank_body(Kind kind)
    {
        var row = await CreateOk(operatorSession, kind, Input(("content", "   \n  ")));
        Api.ExpectRejected(await Action(operatorSession, kind, "publish", row.Id), "publish with a blank body");
        var after = await ById(operatorSession, kind, row.Id);
        Assert.Equal("DRAFT", after?.Status);
        Assert.Null(after?.PublishedAt);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task A_published_record_cannot_have_its_body_blanked(Kind kind)
    {
        var published = await PublishOk(operatorSession, kind, (await CreateOk(operatorSession, kind)).Id);
        Api.ExpectRejected(await Update(operatorSession, kind, published.Id, Input(("content", ""))));
        Assert.Equal(published.Body, (await ById(operatorSession, kind, published.Id))?.Body);
    }

    [Theory]
    [InlineData(Kind.Page)]
    [InlineData(Kind.Article)]
    [InlineData(Kind.Product)]
    public async Task Drafts_may_have_an_empty_body(Kind kind)
    {
        var row = await CreateOk(operatorSession, kind, Input(("content", "")));
        Assert.Equal("", row.Body);
    }
}
