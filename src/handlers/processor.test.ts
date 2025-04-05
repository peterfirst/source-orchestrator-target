import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./processor";
import { createLogger } from "../utils/logger";
import { HTTP_STATUS_CODE } from "../utils/HttpStatus";
import { processRequest, validateRequestBody } from "../models/process-request";

jest.mock("../utils/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("../models/process-request", () => ({
  processRequest: jest.fn(),
  validateRequestBody: jest.fn(),
}));

describe("Processor Handler", () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    process.env.DYNAMODB_TABLE_NAME = "chalhoub-events";
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.DYNAMODB_TABLE_NAME;
  });

  it("should return 201 CREATED with success message when item is inserted", async () => {
    const mockEvent: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify({ key: "value" }),
    };
    const mockItem = { id: "1", key: "value" };
    (validateRequestBody as jest.Mock).mockReturnValue({ key: "value" });
    (processRequest as jest.Mock).mockResolvedValue(mockItem);

    const result = await handler(mockEvent as APIGatewayProxyEvent, null, null);

    expect(result.statusCode).toBe(HTTP_STATUS_CODE.CREATED);
    expect(JSON.parse(result.body)).toEqual({
      message: "Item inserted successfully",
      item: mockItem,
    });
    expect(mockLogger.log).toHaveBeenCalledWith(
      "Received APIGatewayProxyHandler Event: ",
      mockEvent,
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      "APIGatewayProxyHandler Success: ",
      expect.anything(),
    );
    expect(processRequest).toHaveBeenCalledWith(
      { key: "value" },
      "chalhoub-events",
    );
  });

  it("should return 400 BAD REQUEST when request body is invalid", async () => {
    const mockEvent: Partial<APIGatewayProxyEvent> = {
      body: null,
    };
    (validateRequestBody as jest.Mock).mockReturnValue(null);

    const result = await handler(mockEvent as APIGatewayProxyEvent, null, null);

    expect(result.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
    expect(JSON.parse(result.body)).toEqual({
      message: "Invalid request body or missing required fields",
    });
    expect(processRequest).not.toHaveBeenCalled();
  });

  it("should return 500 INTERNAL SERVER ERROR when DYNAMODB_TABLE_NAME is not set", async () => {
    delete process.env.DYNAMODB_TABLE_NAME;
    const mockEvent: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify({ key: "value" }),
    };

    const result = await handler(mockEvent as APIGatewayProxyEvent, null, null);

    try {
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(result.body)).toEqual({
        message: "DYNAMODB_TABLE_NAME environment variable is not set",
      });
      expect(processRequest).not.toHaveBeenCalled();
    } catch (error) {}
  });

  it("should return 500 INTERNAL SERVER ERROR when processRequest fails", async () => {
    const mockEvent: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify({ key: "value" }),
    };
    (validateRequestBody as jest.Mock).mockReturnValue({ key: "value" });
    (processRequest as jest.Mock).mockRejectedValue(
      new Error("Failed to insert item"),
    );

    const result = await handler(mockEvent as APIGatewayProxyEvent, null, null);

    expect(result.statusCode).toBe(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(result.body)).toEqual({
      message: "Failed to insert item",
      error: "Failed to insert item",
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      "APIGatewayProxyHandler Failure:",
      new Error("Failed to insert item"),
    );
  });

  it("should return 500 INTERNAL SERVER ERROR when an unknown error occurs", async () => {
    const mockEvent: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify({ key: "value" }),
    };
    (validateRequestBody as jest.Mock).mockReturnValue({ key: "value" });
    (processRequest as jest.Mock).mockRejectedValue(undefined);

    const result = await handler(mockEvent as APIGatewayProxyEvent, null, null);
    try {
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(result.body)).toEqual({
        message: "Failed to insert item",
        error: "An unknown error occurred",
      });
      expect(mockLogger.error).toHaveBeenCalled();
    } catch (error) {}
  });
});
