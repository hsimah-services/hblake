/**
 * @generated SignedSource<<c8910b81a1f1a7eff22698145b465dc2>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type PageAccent = "BERRY" | "BLUE" | "GREEN" | "INK" | "ORANGE" | "%future added value";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UserRole = "ADMIN" | "EDITOR" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type LayoutFragment$data = {
  readonly navigationPages: {
    readonly nodes: ReadonlyArray<{
      readonly accent: PageAccent;
      readonly id: string;
      readonly slug: string;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly navigationPosts: {
    readonly nodes: ReadonlyArray<{
      readonly status: PublicationStatus;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly navigationProducts: {
    readonly nodes: ReadonlyArray<{
      readonly status: PublicationStatus;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly viewer: {
    readonly displayName: string | null | undefined;
    readonly id: string | null | undefined;
    readonly role: UserRole | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "LayoutFragment";
};
export type LayoutFragment$key = {
  readonly " $data"?: LayoutFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "kind": "Literal",
  "name": "first",
  "value": 100
},
v2 = [
  (v1/*:: as any*/)
],
v3 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "status",
    "storageKey": null
  }
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "LayoutFragment",
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
        (v1/*:: as any*/),
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
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "title",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "slug",
              "storageKey": null
            },
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
    {
      "alias": "navigationPosts",
      "args": (v2/*:: as any*/),
      "concreteType": "RootQueryToPostConnection",
      "kind": "LinkedField",
      "name": "posts",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Post",
          "kind": "LinkedField",
          "name": "nodes",
          "plural": true,
          "selections": (v3/*:: as any*/),
          "storageKey": null
        }
      ],
      "storageKey": "posts(first:100)"
    },
    {
      "alias": "navigationProducts",
      "args": (v2/*:: as any*/),
      "concreteType": "RootQueryToProductConnection",
      "kind": "LinkedField",
      "name": "products",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Product",
          "kind": "LinkedField",
          "name": "nodes",
          "plural": true,
          "selections": (v3/*:: as any*/),
          "storageKey": null
        }
      ],
      "storageKey": "products(first:100)"
    }
  ],
  "type": "RootQuery",
  "abstractKey": null
};
})();

(node as any).hash = "c8347900960f641a8904c20a3a96ccc6";

export default node;
