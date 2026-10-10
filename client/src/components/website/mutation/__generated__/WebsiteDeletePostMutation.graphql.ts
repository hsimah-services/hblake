/**
 * @generated SignedSource<<25147a2fbcdec81175d04aeecef8bf10>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeletePostInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type WebsiteDeletePostMutation$variables = {
  input: DeletePostInput;
};
export type WebsiteDeletePostMutation$data = {
  readonly deletePost: {
    readonly deletedId: string | null | undefined;
  } | null | undefined;
};
export type WebsiteDeletePostMutation = {
  response: WebsiteDeletePostMutation$data;
  variables: WebsiteDeletePostMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "DeletePostPayload",
    "kind": "LinkedField",
    "name": "deletePost",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedId",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "WebsiteDeletePostMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "WebsiteDeletePostMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "1e7bf69b523f689bd34a1c51460a40fb",
    "id": null,
    "metadata": {},
    "name": "WebsiteDeletePostMutation",
    "operationKind": "mutation",
    "text": "mutation WebsiteDeletePostMutation(\n  $input: DeletePostInput!\n) {\n  deletePost(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "05846d2dbf86c2b2b726b98a0d9227fc";

export default node;
