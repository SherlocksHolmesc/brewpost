/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createNode = /* GraphQL */ `mutation CreateNode($input: CreateNodeInput!) {
  createNode(input: $input) {
    projectId
    nodeId
    title
    description
    x
    y
    status
    contentId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateNodeMutationVariables,
  APITypes.CreateNodeMutation
>;
export const updateNode = /* GraphQL */ `mutation UpdateNode($input: UpdateNodeInput!) {
  updateNode(input: $input) {
    projectId
    nodeId
    title
    description
    x
    y
    status
    contentId
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateNodeMutationVariables,
  APITypes.UpdateNodeMutation
>;
export const deleteNode = /* GraphQL */ `mutation DeleteNode($projectId: ID!, $nodeId: ID!) {
  deleteNode(projectId: $projectId, nodeId: $nodeId) {
    projectId
    nodeId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteNodeMutationVariables,
  APITypes.DeleteNodeMutation
>;
export const createEdge = /* GraphQL */ `mutation CreateEdge($projectId: ID!, $from: ID!, $to: ID!, $label: String) {
  createEdge(projectId: $projectId, from: $from, to: $to, label: $label) {
    projectId
    edgeId
    from
    to
    label
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateEdgeMutationVariables,
  APITypes.CreateEdgeMutation
>;
export const deleteEdge = /* GraphQL */ `mutation DeleteEdge($projectId: ID!, $edgeId: ID!) {
  deleteEdge(projectId: $projectId, edgeId: $edgeId) {
    projectId
    edgeId
    from
    to
    label
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteEdgeMutationVariables,
  APITypes.DeleteEdgeMutation
>;
export const generateContent = /* GraphQL */ `mutation GenerateContent(
  $projectId: ID!
  $kind: String!
  $prompt: String!
  $model: String!
) {
  generateContent(
    projectId: $projectId
    kind: $kind
    prompt: $prompt
    model: $model
  ) {
    contentId
    projectId
    kind
    prompt
    text
    imageKey
    model
    createdAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateContentMutationVariables,
  APITypes.GenerateContentMutation
>;
export const createSchedule = /* GraphQL */ `mutation CreateSchedule(
  $contentId: ID!
  $whenISO: AWSDateTime!
  $channel: String!
  $projectId: ID!
  $nodeId: ID!
) {
  createSchedule(
    contentId: $contentId
    whenISO: $whenISO
    channel: $channel
    projectId: $projectId
    nodeId: $nodeId
  )
}
` as GeneratedMutation<
  APITypes.CreateScheduleMutationVariables,
  APITypes.CreateScheduleMutation
>;
