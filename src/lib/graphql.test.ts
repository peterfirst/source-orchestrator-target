import {
  createGraphQLPayload,
  transformPayload,
  postToGraphQL,
  Item,
  ItemWithBrand,
  GraphQLResponse,
} from "./graphql";
import { makeGraphQLMutationRequest } from "./request";

jest.mock("./request");

describe("GraphQL Functions", () => {
  describe("createGraphQLPayload", () => {
    it("should create a valid GraphQL payload", () => {
      const itemWithBrand: ItemWithBrand = {
        id: "123",
        name: "Test Item",
        body: "This is a test item",
        timestamp: 1678886400,
        brand: "Test Brand",
      };

      const expectedPayload = JSON.stringify({
        query: `
          mutation createData($id: String!, $name: String!, $body: String!, $timestamp: Int!, $brand: String!) {
          createItem(id: $id, name: $name, body: $body, timestamp: $timestamp, brand: $brand) {
              id
              name
              body
              timestamp
              brand
          }
          }
      `,
        variables: {
          id: "123",
          name: "Test Item",
          body: "This is a test item",
          timestamp: 1678886400,
          brand: "Test Brand",
        },
      });

      const result = createGraphQLPayload(itemWithBrand);
      expect(result.replace(/\s+/g, "")).toEqual(
        expectedPayload.replace(/\s+/g, ""),
      );
    });
    it("should create a valid GraphQL payload with different data", () => {
      const itemWithBrand: ItemWithBrand = {
        id: "456",
        name: "Another Test Item",
        body: "This is another test item",
        timestamp: 1678886500,
        brand: "Another Brand",
      };

      const expectedPayload = JSON.stringify({
        query: `
          mutation createData($id: String!, $name: String!, $body: String!, $timestamp: Int!, $brand: String!) {
          createItem(id: $id, name: $name, body: $body, timestamp: $timestamp, brand: $brand) {
              id
              name
              body
              timestamp
              brand
          }
          }
      `,
        variables: {
          id: "456",
          name: "Another Test Item",
          body: "This is another test item",
          timestamp: 1678886500,
          brand: "Another Brand",
        },
      });

      const result = createGraphQLPayload(itemWithBrand);
      expect(result.replace(/\s+/g, "")).toEqual(
        expectedPayload.replace(/\s+/g, ""),
      );
    });
  });

  describe("transformPayload", () => {
    it("should transform a payload by adding a brand", () => {
      const item: Item = {
        id: "123",
        name: "Test Item",
        body: "This is a test item",
        timestamp: 1678886400,
      };
      const brand = "Test Brand";

      const expectedItemWithBrand: ItemWithBrand = {
        id: "123",
        name: "Test Item",
        body: "This is a test item",
        timestamp: 1678886400,
        brand: "Test Brand",
      };

      const result = transformPayload(item, brand);
      expect(result).toEqual(expectedItemWithBrand);
    });
    it("should transform a payload by adding a different brand", () => {
      const item: Item = {
        id: "456",
        name: "Another Test Item",
        body: "This is another test item",
        timestamp: 1678886500,
      };
      const brand = "Another Brand";

      const expectedItemWithBrand: ItemWithBrand = {
        id: "456",
        name: "Another Test Item",
        body: "This is another test item",
        timestamp: 1678886500,
        brand: "Another Brand",
      };

      const result = transformPayload(item, brand);
      expect(result).toEqual(expectedItemWithBrand);
    });
  });

  describe("postToGraphQL", () => {
    it("should call makeGraphQLMutationRequest with the correct parameters", async () => {
      const mockUrl = "http://example.com/graphql";
      const mockGraphqlPayload = JSON.stringify({
        query: "mutation { createItem { id } }",
      });
      const mockResponse: GraphQLResponse = { data: { id: "123" } };
      (makeGraphQLMutationRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postToGraphQL(mockUrl, mockGraphqlPayload);

      expect(makeGraphQLMutationRequest).toHaveBeenCalledWith(
        mockUrl,
        mockGraphqlPayload,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors from makeGraphQLMutationRequest", async () => {
      const mockUrl = "http://example.com/graphql";
      const mockGraphqlPayload = JSON.stringify({
        query: "mutation { createItem { id } }",
      });
      const mockError = new Error("Request failed");
      (makeGraphQLMutationRequest as jest.Mock).mockRejectedValue(mockError);

      await expect(
        postToGraphQL(mockUrl, mockGraphqlPayload),
      ).rejects.toThrow(mockError);
    });
    it("should call makeGraphQLMutationRequest with different parameters", async () => {
      const mockUrl = "http://another-example.com/graphql";
      const mockGraphqlPayload = JSON.stringify({
        query: "mutation { createItem { name } }",
      });
      const mockResponse: GraphQLResponse = { data: { name: "Test" } };
      (makeGraphQLMutationRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postToGraphQL(mockUrl, mockGraphqlPayload);

      expect(makeGraphQLMutationRequest).toHaveBeenCalledWith(
        mockUrl,
        mockGraphqlPayload,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
