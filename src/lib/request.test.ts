import { makeGraphQLMutationRequest, GraphQLResponse } from "./request";
import axios, { AxiosResponse } from "axios";
import { HTTP_STATUS_CODE } from "../utils/HttpStatus";

jest.mock("axios");

describe("makeGraphQLMutationRequest", () => {
  const mockUrl = "https://example.com/graphql";
  const mockGraphqlPayload = JSON.stringify({
    query: "mutation { createItem { id } }",
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make a successful GraphQL mutation request", async () => {
    const mockResponse: GraphQLResponse = { data: { id: "123" } };
    (axios.post as jest.Mock).mockResolvedValue({
      data: mockResponse,
      status: HTTP_STATUS_CODE.OK,
    } as AxiosResponse<GraphQLResponse>);

    const result = await makeGraphQLMutationRequest(
      mockUrl,
      mockGraphqlPayload,
    );

    expect(axios.post).toHaveBeenCalledWith(mockUrl, mockGraphqlPayload, {
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: expect.any(Function),
    });
    expect(result).toEqual(mockResponse);
  });

  it("should handle GraphQL mutation request failure with status code", async () => {
    const mockErrorResponse = {
      status: HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
      data: "Internal Server Error",
    };
    (axios.post as jest.Mock).mockRejectedValue({
      response: mockErrorResponse,
    });

    try {
      await expect(
        makeGraphQLMutationRequest(mockUrl, mockGraphqlPayload),
      ).rejects.toThrow(
        `GraphQL request failed with status ${mockErrorResponse.status}: ${mockErrorResponse.data}`,
      );
    } catch (error) {}
  });

  it("should handle network errors during GraphQL mutation request (no response)", async () => {
    (axios.post as jest.Mock).mockRejectedValue({
      request: {},
    });

    try {
      await expect(
        makeGraphQLMutationRequest(mockUrl, mockGraphqlPayload),
      ).rejects.toThrow("GraphQL request failed: No response received");
    } catch (error) {}
  });

  it("should handle other errors during GraphQL mutation request", async () => {
    const mockError = new Error("Network error");
    (axios.post as jest.Mock).mockRejectedValue(mockError);

    try {
      await expect(
        makeGraphQLMutationRequest(mockUrl, mockGraphqlPayload),
      ).rejects.toThrow(mockError);
    } catch (error) {}
  });

  it("should handle GraphQL mutation request failure with status code 400", async () => {
    const mockErrorResponse = {
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      data: "Bad Request",
    };
    (axios.post as jest.Mock).mockRejectedValue({
      response: mockErrorResponse,
    });

    try {
      await expect(
        makeGraphQLMutationRequest(mockUrl, mockGraphqlPayload),
      ).rejects.toThrow(
        `GraphQL request failed with status ${mockErrorResponse.status}: ${mockErrorResponse.data}`,
      );
    } catch (error) {}
  });

  it("should validate status correctly", async () => {
    const mockResponse: GraphQLResponse = { data: { id: "123" } };
    (axios.post as jest.Mock).mockResolvedValue({
      data: mockResponse,
      status: HTTP_STATUS_CODE.CREATED,
    } as AxiosResponse<GraphQLResponse>);

    const result = await makeGraphQLMutationRequest(
      mockUrl,
      mockGraphqlPayload,
    );

    expect(axios.post).toHaveBeenCalledWith(mockUrl, mockGraphqlPayload, {
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: expect.any(Function),
    });
    expect(result).toEqual(mockResponse);

    const validateStatus = (axios.post as jest.Mock).mock.calls[0][2]
      .validateStatus;
    expect(validateStatus(HTTP_STATUS_CODE.OK)).toBe(true);
    expect(validateStatus(HTTP_STATUS_CODE.CREATED)).toBe(true);
    expect(validateStatus(HTTP_STATUS_CODE.MULTIPLE_CHOICES)).toBe(false);
    expect(validateStatus(HTTP_STATUS_CODE.BAD_REQUEST)).toBe(false);
    expect(validateStatus(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)).toBe(false);
  });

  it("should handle non-axios errors", async () => {
    const mockError = "Non-Axios Error";
    (axios.post as jest.Mock).mockRejectedValue(mockError);

    try {
      await expect(
        makeGraphQLMutationRequest(mockUrl, mockGraphqlPayload),
      ).rejects.toThrow(mockError);
    } catch (error) {}
  });
});
