using Elephentity.Cosmos;
using Hsimah.Assets;
using Elephentity.GraphQL.Http;
using Elephentity.Runtime.Policy;
using Elephentity.Runtime.Storage;
using Hsimah.Domain;
using Hsimah.Entity;
using Hsimah.Entity.Contract;
using Hsimah.Entity.Pattern.Contract;
using Hsimah.GraphQL;
using Hsimah.Storage;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Hsimah;

public static class Composition
{
    /// <summary>The application on Cosmos DB.</summary>
    public static IServiceCollection AddHsimah(this IServiceCollection services, HsimahOptions options)
    {
        services.AddSingleton(options);
        services.AddSingleton(_ => new CosmosClientSettings(AllowAnyServerCertificate: options.AllowAnyCertificate).CreateClient(options.Endpoint, options.Key));
        services.AddSingleton(StorageManifest.Create(options.Container));
        services.AddSingleton<IStorageAdaptor>(provider => new CosmosAdaptor(
            provider.GetRequiredService<CosmosClient>(), options.Database, provider.GetRequiredService<Elephentity.Cosmos.Manifest.CosmosStorageManifest>()));
        services.AddSingleton<IAssetStore>(provider => AssetStores.Create(provider.GetRequiredService<HsimahOptions>()));
        return services.AddHsimahDomain();
    }

    /// <summary>Everything but storage: the policies, verifiers, actions, queries and GraphQL. Unit tests add an in-memory adaptor.</summary>
    public static IServiceCollection AddHsimahDomain(this IServiceCollection services)
    {
        services.AddSingleton<IViewerProvider, RequestViewerProvider>();
        services.TryAddSingleton(new AssetOptions());
        services.AddSingleton<ImageAssets>();

        // Contracts: the policies, verifiers, actions and queries the generated code asks the application for.
        services.AddSingleton<IPublishableContentStaffWritePolicy, ContentStaff>();
        services.AddSingleton<IPublishableContentVisibilityReadPolicy, ContentVisibility>();
        services.AddSingleton<IUserStaffProfileReadPolicy, StaffProfile>();
        services.AddSingleton<IUserAdminAccountsWritePolicy, AdminAccounts>();
        services.AddSingleton<TitleVerifier>().AddSingleton<IPageTitleVerifier>(p => p.GetRequiredService<TitleVerifier>()).AddSingleton<IPageItemTitleVerifier>(p => p.GetRequiredService<TitleVerifier>());
        services.AddSingleton<ContentVerifier>().AddSingleton<IPageContentVerifier>(p => p.GetRequiredService<ContentVerifier>()).AddSingleton<IPageItemContentVerifier>(p => p.GetRequiredService<ContentVerifier>());
        services.AddSingleton<StatusVerifier>().AddSingleton<IPageStatusVerifier>(p => p.GetRequiredService<StatusVerifier>()).AddSingleton<IPageItemStatusVerifier>(p => p.GetRequiredService<StatusVerifier>());
        services.AddSingleton<PublishedAtVerifier>().AddSingleton<IPagePublishedAtVerifier>(p => p.GetRequiredService<PublishedAtVerifier>()).AddSingleton<IPageItemPublishedAtVerifier>(p => p.GetRequiredService<PublishedAtVerifier>());
        services.AddSingleton<SlugVerifier>().AddSingleton<IPageSlugVerifier>(p => p.GetRequiredService<SlugVerifier>()).AddSingleton<IPageItemSlugVerifier>(p => p.GetRequiredService<SlugVerifier>());
        services.AddSingleton<KindVerifier>().AddSingleton<IPageDefaultItemKindVerifier>(p => p.GetRequiredService<KindVerifier>()).AddSingleton<IPageItemKindVerifier>(p => p.GetRequiredService<KindVerifier>());
        services.AddSingleton<IPageItemEnquiryUrlVerifier, EnquiryUrlVerifier>();
        services.AddSingleton<IPageItemImageUrlVerifier, ImageUrlVerifier>();
        services.AddSingleton<IPageItemImageAltVerifier, ImageAltVerifier>();
        services.AddSingleton<PagePlacement>().AddSingleton<IPageAccentVerifier>(p => p.GetRequiredService<PagePlacement>())
            .AddSingleton<IPageHomeOrderVerifier>(p => p.GetRequiredService<PagePlacement>())
            .AddSingleton<IPageNavigationOrderVerifier>(p => p.GetRequiredService<PagePlacement>());
        services.AddSingleton<IUserUsernameVerifier, UsernameVerifier>();
        services.AddSingleton<IUserDisplayNameVerifier, DisplayNameVerifier>();
        services.AddSingleton<Publish>().AddSingleton<IPagePublishAction>(p => p.GetRequiredService<Publish>()).AddSingleton<IPageItemPublishAction>(p => p.GetRequiredService<Publish>());
        services.AddSingleton<Unpublish>().AddSingleton<IPageUnpublishAction>(p => p.GetRequiredService<Unpublish>()).AddSingleton<IPageItemUnpublishAction>(p => p.GetRequiredService<Unpublish>());
        services.AddSingleton<IPageBySlugQuery, PageBySlug>();
        services.AddSingleton<IPageItemBySlugQuery, PageItemBySlug>();
        services.AddSingleton<IPageItemOfPageQuery, PageItemOfPage>();
        services.AddSingleton<IPageItemRecentQuery, PageItemRecent>();
        services.AddSingleton<IPageRecentQuery, PageRecent>();
        services.AddSingleton<IPagePlacedQuery, PagePlaced>();

        // Pages and items record their author and check the page they belong to before the runtime sees the input.
        services.AddHsimahEntities();
        services.Replace(ServiceDescriptor.Singleton<Elephentity.Runtime.Gateway.IEntityGateway>(provider =>
            new ApplicationGateway(provider.GetRequiredService<Elephentity.Runtime.Gateway.Runtime>())));

        services.AddSingleton<global::GraphQL.Types.ISchema>(provider => HsimahSchema.Build(provider, provider.GetRequiredService<Elephentity.GraphQL.ElephentityGraphQLOptions>()));
        services.AddSingleton<HsimahExecutor>();
        services.AddElephentityGraphQL(GraphQLManifestFactory.Create(), graphql =>
        {
            graphql.DefaultPageSize = 20;
            graphql.MaxPageSize = 100;
        });
        return services;
    }
}
