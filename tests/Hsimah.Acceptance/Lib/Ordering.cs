using Xunit.Sdk;
using Xunit.v3;

[assembly: TestCollectionOrderer(typeof(Hsimah.Acceptance.Lib.ByCollectionName))]
[assembly: TestCaseOrderer(typeof(Hsimah.Acceptance.Lib.ByDeclaration))]

namespace Hsimah.Acceptance.Lib;

/// <summary>
/// Runs a class's tests in the order they are written. The suite shares one database, and some tests depend on what the ones before
/// them left behind (the four home tiles, for instance), exactly as the TypeScript suite ran its tests in file order.
/// </summary>
public sealed class ByDeclaration : ITestCaseOrderer
{
    public IReadOnlyCollection<TTestCase> OrderTestCases<TTestCase>(IReadOnlyCollection<TTestCase> testCases)
        where TTestCase : notnull, ITestCase =>
        testCases.OrderBy(test => test is IXunitTestCase xunit ? xunit.TestMethod.Method.MetadataToken : 0).ToList();
}

/// <summary>
/// Runs test classes in name order, as the TypeScript suite ran its files. Each class is its own collection, so the order is a
/// collection order.
/// </summary>
public sealed class ByCollectionName : ITestCollectionOrderer
{
    public IReadOnlyCollection<TTestCollection> OrderTestCollections<TTestCollection>(IReadOnlyCollection<TTestCollection> testCollections)
        where TTestCollection : ITestCollection =>
        testCollections.OrderBy(collection => collection.TestCollectionDisplayName, StringComparer.Ordinal).ToList();
}
