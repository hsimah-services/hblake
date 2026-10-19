/**
 * @generated SignedSource<<b506a87ee4f456aa8afa0e86465f0459>>
 * @relayHash 99abd120f51e83ff0a88de3964400827
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 99abd120f51e83ff0a88de3964400827

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type PageItemQuery$variables = {
  page: string;
  slug: string;
};
export type PageItemQuery$data = {
  readonly pageBySlug: {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
  } | null | undefined;
  readonly pageItemBySlug: {
    readonly author: {
      readonly displayName: string;
    } | null | undefined;
    readonly content: string;
    readonly createdAt: string;
    readonly enquiryUrl: string | null | undefined;
    readonly excerpt: string;
    readonly id: string;
    readonly kind: string;
    readonly page: {
      readonly id: string;
    } | null | undefined;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly pageOrder: {
    readonly nodes: ReadonlyArray<{
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};
export type PageItemQuery = {
  response: PageItemQuery$data;
  variables: PageItemQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "page"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "slug"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": [
    {
      "kind": "Variable",
      "name": "slug",
      "variableName": "page"
    }
  ],
  "concreteType": "Page",
  "kind": "LinkedField",
  "name": "pageBySlug",
  "plural": false,
  "selections": [
    (v1/*:: as any*/),
    (v2/*:: as any*/),
    (v3/*:: as any*/)
  ],
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": [
    {
      "kind": "Variable",
      "name": "slug",
      "variableName": "slug"
    }
  ],
  "concreteType": "PageItem",
  "kind": "LinkedField",
  "name": "pageItemBySlug",
  "plural": false,
  "selections": [
    (v1/*:: as any*/),
    (v2/*:: as any*/),
    (v3/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "content",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "excerpt",
      "storageKey": null
    },
    (v5/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "publishedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "createdAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "updatedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "kind",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "enquiryUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Author",
      "kind": "LinkedField",
      "name": "author",
      "plural": false,
      "selections": [
        (v6/*:: as any*/)
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Page",
      "kind": "LinkedField",
      "name": "page",
      "plural": false,
      "selections": [
        (v1/*:: as any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v8 = {
  "kind": "Literal",
  "name": "first",
  "value": 100
},
v9 = [
  (v8/*:: as any*/),
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "page",
        "variableName": "page"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PageItemQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "LayoutFragment"
      },
      (v4/*:: as any*/),
      (v7/*:: as any*/),
      {
        "alias": "pageOrder",
        "args": (v9/*:: as any*/),
        "concreteType": "RootQueryToPageItemsOfPageConnection",
        "kind": "LinkedField",
        "name": "pageItemsOfPage",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "PageItem",
            "kind": "LinkedField",
            "name": "nodes",
            "plural": true,
            "selections": [
              (v3/*:: as any*/),
              (v2/*:: as any*/),
              (v5/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "PageItemQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Viewer",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v1/*:: as any*/),
          (v6/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "role",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": "navigationPages",
        "args": [
          (v8/*:: as any*/),
          {
            "kind": "Literal",
            "name": "where",
            "value": {
              "home": false
            }
          }
        ],
        "concreteType": "RootQueryToPlacedPagesConnection",
        "kind": "LinkedField",
        "name": "placedPages",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Page",
            "kind": "LinkedField",
            "name": "nodes",
            "plural": true,
            "selections": [
              (v1/*:: as any*/),
              (v2/*:: as any*/),
              (v3/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "accent",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": "placedPages(first:100,where:{\"home\":false})"
      },
      (v4/*:: as any*/),
      (v7/*:: as any*/),
      {
        "alias": "pageOrder",
        "args": (v9/*:: as any*/),
        "concreteType": "RootQueryToPageItemsOfPageConnection",
        "kind": "LinkedField",
        "name": "pageItemsOfPage",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "PageItem",
            "kind": "LinkedField",
            "name": "nodes",
            "plural": true,
            "selections": [
              (v3/*:: as any*/),
              (v2/*:: as any*/),
              (v5/*:: as any*/),
              (v1/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "99abd120f51e83ff0a88de3964400827",
    "id": "99abd120f51e83ff0a88de3964400827",
    "metadata": {},
    "name": "PageItemQuery",
    "operationKind": "query",
    "text": "query PageItemQuery(\n  $page: String!\n  $slug: String!\n) {\n  ...LayoutFragment\n  pageBySlug(slug: $page) {\n    id\n    title\n    slug\n  }\n  pageItemBySlug(slug: $slug) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n    kind\n    enquiryUrl\n    author {\n      displayName\n    }\n    page {\n      id\n    }\n  }\n  pageOrder: pageItemsOfPage(where: {page: $page}, first: 100) {\n    nodes {\n      slug\n      title\n      status\n      id\n    }\n  }\n}\n\nfragment LayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n    role\n  }\n  navigationPages: placedPages(where: {home: false}, first: 100) {\n    nodes {\n      id\n      title\n      slug\n      accent\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "fead91724207d1393a2f581f4857c154";

export default node;
