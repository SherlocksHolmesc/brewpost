/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const listNodes = /* GraphQL */ `query ListNodes($filter: ModelNodeFilterInput, $limit: Int, $nextToken: String) {
  listNodes(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      projectId
      nodeId
      title
      description
      x
      y
      status
      contentId
      type
      day
      imageUrl
      imagePrompt
      scheduledDate
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}` as GeneratedQuery<APITypes.ListNodesQueryVariables, APITypes.ListNodesQuery>;
export const listEdges = /* GraphQL */ `query ListEdges($filter: ModelEdgeFilterInput, $limit: Int, $nextToken: String) {
  listEdges(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      projectId
      edgeId
      from
      to
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}` as GeneratedQuery<APITypes.ListEdgesQueryVariables, APITypes.ListEdgesQuery>;
export const getContent = /* GraphQL */ `query GetContent($contentId: ID!) {
  getContent(contentId: $contentId) {
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
` as GeneratedQuery<
  APITypes.GetContentQueryVariables,
  APITypes.GetContentQuery
>;
export const listSchedules = /* GraphQL */ `query ListSchedules($projectId: ID!) {
  listSchedules(projectId: $projectId) {
    scheduleId
    userId
    projectId
    nodeId
    whenISO
    channel
    status
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSchedulesQueryVariables,
  APITypes.ListSchedulesQuery
>;
