/**
 * @generated SignedSource<<da40bcf1658cea72443b007a7eeaaaaa>>
 * @relayHash 404959ecb5bc8dabcf0c4139cfb858eb
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 404959ecb5bc8dabcf0c4139cfb858eb

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PageAccent = "BERRY" | "BLUE" | "GREEN" | "INK" | "ORANGE" | "%future added value";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type HomeQuery$variables = Record<PropertyKey, never>;
export type HomeQuery$data = {
  readonly homePages: {
    readonly nodes: ReadonlyArray<{
      readonly accent: PageAccent;
      readonly excerpt: string;
      readonly id: string;
      readonly slug: string;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly latestNews: {
    readonly nodes: ReadonlyArray<{
      readonly excerpt: string;
      readonly id: string;
      readonly publishedAt: string | null | undefined;
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly pageBySlug: {
    readonly content: string;
    readonly createdAt: string;
    readonly excerpt: string;
    readonly id: string;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};
export type HomeQuery = {
  response: HomeQuery$data;
  variables: HomeQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "excerpt",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "accent",
  "storageKey": null
},
v5 = {
  "alias": "homePages",
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 4
    },
    {
      "kind": "Literal",
      "name": "where",
      "value": {
        "home": true
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
        (v0/*:: as any*/),
        (v1/*:: as any*/),
        (v2/*:: as any*/),
        (v3/*:: as any*/),
        (v4/*:: as any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": "placedPages(first:4,where:{\"home\":true})"
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "publishedAt",
  "storageKey": null
},
v8 = {
  "alias": "latestNews",
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 1
    },
    {
      "kind": "Literal",
      "name": "where",
      "value": {
        "page": "news"
      }
    }
  ],
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
        (v0/*:: as any*/),
        (v1/*:: as any*/),
        (v2/*:: as any*/),
        (v3/*:: as any*/),
        (v6/*:: as any*/),
        (v7/*:: as any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": "pageItemsOfPage(first:1,where:{\"page\":\"news\"})"
},
v9 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "slug",
      "value": "home"
    }
  ],
  "concreteType": "Page",
  "kind": "LinkedField",
  "name": "pageBySlug",
  "plural": false,
  "selections": [
    (v0/*:: as any*/),
    (v1/*:: as any*/),
    (v2/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "content",
      "storageKey": null
    },
    (v3/*:: as any*/),
    (v6/*:: as any*/),
    (v7/*:: as any*/),
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
    }
  ],
  "storageKey": "pageBySlug(slug:\"home\")"
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "HomeQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "LayoutFragment"
      },
      (v5/*:: as any*/),
      (v8/*:: as any*/),
      (v9/*:: as any*/)
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "HomeQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Viewer",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v0/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "displayName",
            "storageKey": null
          },
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
          {
            "kind": "Literal",
            "name": "first",
            "value": 100
          },
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
              (v0/*:: as any*/),
              (v1/*:: as any*/),
              (v2/*:: as any*/),
              (v4/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "placedPages(first:100,where:{\"home\":false})"
      },
      (v5/*:: as any*/),
      (v8/*:: as any*/),
      (v9/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "404959ecb5bc8dabcf0c4139cfb858eb",
    "id": "404959ecb5bc8dabcf0c4139cfb858eb",
    "metadata": {},
    "name": "HomeQuery",
    "operationKind": "query",
    "text": "query HomeQuery {\n  ...LayoutFragment\n  homePages: placedPages(where: {home: true}, first: 4) {\n    nodes {\n      id\n      title\n      slug\n      excerpt\n      accent\n    }\n  }\n  latestNews: pageItemsOfPage(where: {page: \"news\"}, first: 1) {\n    nodes {\n      id\n      title\n      slug\n      excerpt\n      status\n      publishedAt\n    }\n  }\n  pageBySlug(slug: \"home\") {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n  }\n}\n\nfragment LayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n    role\n  }\n  navigationPages: placedPages(where: {home: false}, first: 100) {\n    nodes {\n      id\n      title\n      slug\n      accent\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b57b09bd1cec6568c70307fddc478b69";

export default node;
