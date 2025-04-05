import { makeGraphQLRequest, GraphQLResponse } from "./request";
import https from "https";

jest.mock("https");

describe("makeGraphQLRequest", () => {
  const mockUrl = "https://example.com/graphql";
  const mockGraphqlPayload = JSON.stringify({
    query: "mutation { createItem { id } }",
  });

  const mockRequest = {
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (https.request as jest.Mock).mockReturnValue(mockRequest);
  });

  it("should make a successful GraphQL request", async () => {
    const mockResponse = { data: { id: "123" } };
    const mockRes = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === "data") {
          callback(JSON.stringify(mockResponse));
        }
        if (event === "end") {
          callback();
        }
      }),
    };
    (https.request as jest.Mock).mockImplementation((_options, callback) => {
      callback(mockRes);
      return mockRequest;
    });

    const result = await makeGraphQLRequest(mockUrl, mockGraphqlPayload);

    expect(https.request).toHaveBeenCalledWith(
      {
        hostname: "example.com",
        port: 443,
        path: "/graphql",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(mockGraphqlPayload),
        },
      },
      expect.any(Function),
    );
    expect(mockRequest.write).toHaveBeenCalledWith(mockGraphqlPayload);
    expect(mockRequest.end).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });

  it("should handle GraphQL request with non-default port", async () => {
    const mockResponse = { data: { id: "123" } };
    const mockRes = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === "data") {
          callback(JSON.stringify(mockResponse));
        }
        if (event === "end") {
          callback();
        }
      }),
    };
    (https.request as jest.Mock).mockImplementation((_options, callback) => {
      callback(mockRes);
      return mockRequest;
    });

    const result = await makeGraphQLRequest("https://example.com:8443/graphql", mockGraphqlPayload);

    expect(https.request).toHaveBeenCalledWith(
      {
        hostname: "example.com",
        port: 8443,
        path: "/graphql",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(mockGraphqlPayload),
        },
      },
      expect.any(Function),
    );
    expect(mockRequest.write).toHaveBeenCalledWith(mockGraphqlPayload);
    expect(mockRequest.end).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });

  it("should handle GraphQL request failure with status code", async () => {
    const mockRes = {
      statusCode: 500,
      on: jest.fn((event, callback) => {
        if (event === "data") {
          callback("Internal Server Error");
        }
        if (event === "end") {
          callback();
        }
      }),
    };
    (https.request as jest.Mock).mockImplementation((_options, callback) => {
      callback(mockRes);
      return mockRequest;
    });

    await expect(
      makeGraphQLRequest(mockUrl, mockGraphqlPayload),
    ).rejects.toThrow("GraphQL request failed with status 500: Internal Server Error");
  });

  it("should handle network errors during GraphQL request", async () => {
    const mockError = new Error("Network error");
    (https.request as jest.Mock).mockImplementation(() => {
      mockRequest.on.mockImplementation((event, callback) => {
        if (event === "error") {
          callback(mockError);
        }
      });
      return mockRequest;
    });

    await expect(
      makeGraphQLRequest(mockUrl, mockGraphqlPayload),
    ).rejects.toThrow(mockError);
  });

  it("should handle GraphQL request failure with status code 400", async () => {
    const mockRes = {
      statusCode: 400,
      on: jest.fn((event, callback) => {
        if (event === "data") {
          callback("Bad Request");
        }
        if (event === "end") {
          callback();
        }
      }),
    };
    (https.request as jest.Mock).mockImplementation((_options, callback) => {
      callback(mockRes);
      return mockRequest;
    });

    await expect(
      makeGraphQLRequest(mockUrl, mockGraphqlPayload),
    ).rejects.toThrow("GraphQL request failed with status 400: Bad Request");
  });
});
