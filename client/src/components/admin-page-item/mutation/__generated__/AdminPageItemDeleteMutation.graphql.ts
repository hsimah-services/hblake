/**
 * @generated SignedSource<<f6eb651a5c1d827cf202f41a59a30ee4>>
 * @relayHash 6bf4bf9ea40b69df75e7ab2111efba3e
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 6bf4bf9ea40b69df75e7ab2111efba3e

import { ConcreteRequest } from 'relay-runtime';
export type DeletePageItemInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type AdminPageItemDeleteMutation$variables = {
  input: DeletePageItemInput;
};
export type AdminPageItemDeleteMutation$data = {
  readonly deletePageItem: {
    readonly deletedId: string | null | undefined;
  } | null | undefined;
};
export type AdminPageItemDeleteMutation = {
  response: AdminPageItemDeleteMutation$data;
  variables: AdminPageItemDeleteMutation$variables;
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
    "concreteType": "DeletePageItemPayload",
    "kind": "LinkedField",
    "name": "deletePageItem",
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
    "name": "AdminPageItemDeleteMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageItemDeleteMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "6bf4bf9ea40b69df75e7ab2111efba3e",
    "id": "6bf4bf9ea40b69df75e7ab2111efba3e",
    "metadata": {},
    "name": "AdminPageItemDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageItemDeleteMutation(\n  $input: DeletePageItemInput!\n) {\n  deletePageItem(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "f2ff0fbd095c416ae07469b450217e4e";

export default node;
