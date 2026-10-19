/**
 * @generated SignedSource<<4c83484927412290e3c2bbb031333666>>
 * @relayHash 80888ad7e4a513c9df6f23a24bc4c97d
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 80888ad7e4a513c9df6f23a24bc4c97d

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type AdminPageItemQuery$variables = {
  id: string;
  page: string;
};
export type AdminPageItemQuery$data = {
  readonly pageBySlug: {
    readonly defaultItemKind: string | null | undefined;
    readonly id: string;
    readonly slug: string;
    readonly title: string;
  } | null | undefined;
  readonly pageItem: {
    readonly author: {
      readonly displayName: string;
    } | null | undefined;
    readonly content: string;
    readonly createdAt: string;
    readonly enquiryUrl: string | null | undefined;
    readonly excerpt: string;
    readonly id: string;
    readonly imageAlt: string | null | undefined;
    readonly imageUrl: string | null | undefined;
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
  readonly " $fragmentSpreads": FragmentRefs<"AdminLayoutFragment">;
};
export type AdminPageItemQuery = {
  response: AdminPageItemQuery$data;
  variables: AdminPageItemQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "page"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "defaultItemKind",
  "storageKey": null
},
v6 = {
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
    (v2/*:: as any*/),
    (v3/*:: as any*/),
    (v4/*:: as any*/),
    (v5/*:: as any*/)
  ],
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": [
    {
      "kind": "Variable",
      "name": "id",
      "variableName": "id"
    }
  ],
  "concreteType": "PageItem",
  "kind": "LinkedField",
  "name": "pageItem",
  "plural": false,
  "selections": [
    (v2/*:: as any*/),
    (v3/*:: as any*/),
    (v4/*:: as any*/),
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
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "status",
      "storageKey": null
    },
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
      "kind": "ScalarField",
      "name": "imageUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "imageAlt",
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
        (v7/*:: as any*/)
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
        (v2/*:: as any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "AdminPageItemQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "AdminLayoutFragment"
      },
      (v6/*:: as any*/),
      (v8/*:: as any*/)
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "AdminPageItemQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Viewer",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          (v7/*:: as any*/)
        ],
        "storageKey": null
      },
      {
        "alias": "pageCount",
        "args": [
          {
            "kind": "Literal",
            "name": "first",
            "value": 1
          }
        ],
        "concreteType": "RootQueryToPageConnection",
        "kind": "LinkedField",
        "name": "pages",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "totalCount",
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:1)"
      },
      {
        "alias": "itemPages",
        "args": [
          {
            "kind": "Literal",
            "name": "first",
            "value": 100
          }
        ],
        "concreteType": "RootQueryToPageConnection",
        "kind": "LinkedField",
        "name": "pages",
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
              (v3/*:: as any*/),
              (v4/*:: as any*/),
              (v5/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "itemCount",
                "storageKey": null
              },
              (v2/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:100)"
      },
      (v6/*:: as any*/),
      (v8/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "80888ad7e4a513c9df6f23a24bc4c97d",
    "id": "80888ad7e4a513c9df6f23a24bc4c97d",
    "metadata": {},
    "name": "AdminPageItemQuery",
    "operationKind": "query",
    "text": "query AdminPageItemQuery(\n  $page: String!\n  $id: ID!\n) {\n  ...AdminLayoutFragment\n  pageBySlug(slug: $page) {\n    id\n    title\n    slug\n    defaultItemKind\n  }\n  pageItem(id: $id) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n    kind\n    enquiryUrl\n    imageUrl\n    imageAlt\n    author {\n      displayName\n    }\n    page {\n      id\n    }\n  }\n}\n\nfragment AdminLayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n  }\n  pageCount: pages(first: 1) {\n    totalCount\n  }\n  itemPages: pages(first: 100) {\n    nodes {\n      title\n      slug\n      defaultItemKind\n      itemCount\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "efbe08a65c13073c64ee02975c5bb76d";

export default node;
