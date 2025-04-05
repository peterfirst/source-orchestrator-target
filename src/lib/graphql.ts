import { makeGraphQLMutationRequest } from "./request";

export type Item = {
  id: string;
  name: string;
  body: string;
  timestamp: number;
};

export type ItemWithBrand = Item & {
  brand: string;
};

export type GraphQLResponse = {
  data?: any;
  errors?: any;
};

export const createGraphQLPayload = (payload: ItemWithBrand): string => {
  const mutation: string = `
        mutation createData($id: String!, $name: String!, $body: String!, $timestamp: Int!, $brand: String!) {
          createItem(id: $id, name: $name, body: $body, timestamp: $timestamp, brand: $brand) {
              id
              name
              body
              timestamp
              brand
          }
        }
    `;

  return JSON.stringify({
    query: mutation,
    variables: {
      id: payload.id,
      name: payload.name,
      body: payload.body,
      timestamp: payload.timestamp,
      brand: payload.brand,
    },
  });
};

export const transformPayload = (
  payload: Item,
  brand: string,
): ItemWithBrand => {
  return { ...payload, brand };
};

export const postToGraphQL = (
  url: string,
  graphqlPayload: string,
): Promise<GraphQLResponse> => {
  return makeGraphQLMutationRequest(url, graphqlPayload);
};
