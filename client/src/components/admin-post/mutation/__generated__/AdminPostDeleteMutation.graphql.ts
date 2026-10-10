/**
 * @generated SignedSource<<e7a0a22218457de2d6eee6c32bf54a83>>
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
export type AdminPostDeleteMutation$variables = {
  input: DeletePostInput;
};
export type AdminPostDeleteMutation$data = {
  readonly deletePost: {
    readonly deletedId: string | null | undefined;
  } | null | undefined;
};
export type AdminPostDeleteMutation = {
  response: AdminPostDeleteMutation$data;
  variables: AdminPostDeleteMutation$variables;
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
    "name": "AdminPostDeleteMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPostDeleteMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "6e104b5e053e8c430db8b7505edbd373",
    "id": null,
    "metadata": {},
    "name": "AdminPostDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPostDeleteMutation(\n  $input: DeletePostInput!\n) {\n  deletePost(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "7c39b48de8b03dd8f5c1bc7eb6d748c5";

export default node;
