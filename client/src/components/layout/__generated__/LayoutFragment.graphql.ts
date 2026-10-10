/**
 * @generated SignedSource<<a977edfeb9577605b4a33fe7a2cae736>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UserRole = "ADMIN" | "EDITOR" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type LayoutFragment$data = {
  readonly navigationPages: {
    readonly nodes: ReadonlyArray<{
      readonly id: string;
      readonly slug: string;
      readonly status: PublicationStatus;
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
v1 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v3 = [
  (v2/*:: as any*/)
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
      "args": (v1/*:: as any*/),
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
            (v2/*:: as any*/)
          ],
          "storageKey": null
        }
      ],
      "storageKey": "pages(first:100)"
    },
    {
      "alias": "navigationPosts",
      "args": (v1/*:: as any*/),
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
      "args": (v1/*:: as any*/),
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

(node as any).hash = "579dd8cb84c7a72e9d1346a5528b8994";

export default node;
