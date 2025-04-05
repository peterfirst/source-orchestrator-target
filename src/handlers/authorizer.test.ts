import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";
import { handler } from "./authorizer";
import { createLogger } from "../utils/logger";
import {
  AuthContext,
  AuthError,
  createPolicy,
  getResourceArn,
  validateApiKeyEnvVar,
  validateApiKeyHeader,
  validateResourceArn,
} from "../models/process-autorization";

jest.mock("../utils/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("../models/process-autorization", () => ({
  createPolicy: jest.fn(),
  getResourceArn: jest.fn(),
  validateApiKeyEnvVar: jest.fn(),
  validateApiKeyHeader: jest.fn(),
  validateResourceArn: jest.fn(),
  AuthError: {
    MissingApiKeyHeader: "Missing x-api-key header",
    InvalidApiKeyHeader: "x-api-key header is not a string",
    MissingApiKeyEnvVar: "API_KEY environment variable is not set",
    MissingResourceArn: "Could not determine resource ARN from event",
    Unauthorized: "Unauthorized",
    InternalServerError: "Internal Server Error",
  },
}));

describe("Authorizer Handler", () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
    process.env.API_KEY = "valid-api-key";
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.API_KEY;
  });

  it("should return an Allow policy when API key is valid", async () => {
    const mockEvent: Partial<APIGatewayRequestAuthorizerEvent> = {
      headers: { "x-api-key": "test-api-key" },
      routeArn:
        "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
    };
    const mockAuthContext: AuthContext = { apiKey: "test-api-key" };
    const mockPolicy: APIGatewayAuthorizerResult = {
      principalId: "user",
      context: mockAuthContext,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource:
              "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
          },
        ],
      },
    };

    (validateApiKeyHeader as jest.Mock).mockReturnValue("test-api-key");
    (validateApiKeyEnvVar as jest.Mock).mockReturnValue("test-api-key");
    (getResourceArn as jest.Mock).mockReturnValue(
      "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
    );
    (validateResourceArn as jest.Mock).mockReturnValue(
      "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
    );
    (createPolicy as jest.Mock).mockReturnValue(mockPolicy);

    const result = await handler(mockEvent as APIGatewayRequestAuthorizerEvent);

    expect(result).toEqual(mockPolicy);
    expect(mockLogger.log).toHaveBeenCalledWith("Received event:", mockEvent);
    expect(validateApiKeyHeader).toHaveBeenCalledWith(mockEvent, mockLogger);
    expect(validateApiKeyEnvVar).toHaveBeenCalledWith(mockLogger);
    expect(getResourceArn).toHaveBeenCalledWith(mockEvent);
    expect(validateResourceArn).toHaveBeenCalledWith(
      "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
      mockLogger,
    );
    expect(createPolicy).toHaveBeenCalledWith(
      "Allow",
      "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
      mockAuthContext,
    );
  });

  it("should return a Deny policy when API key is invalid", async () => {
    const mockEvent: Partial<APIGatewayRequestAuthorizerEvent> = {
      headers: { "x-api-key": "invalid-api-key" },
      routeArn:
        "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
    };
    const mockAuthContext: AuthContext = { apiKey: "invalid-api-key" };
    const mockPolicy: APIGatewayAuthorizerResult = {
      principalId: "user",
      context: mockAuthContext,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource:
              "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
          },
        ],
      },
    };

    (validateApiKeyHeader as jest.Mock).mockReturnValue("invalid-api-key");
    (validateApiKeyEnvVar as jest.Mock).mockReturnValue("valid-api-key");
    (getResourceArn as jest.Mock).mockReturnValue(
      "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
    );
    (validateResourceArn as jest.Mock).mockReturnValue(
      "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
    );
    (createPolicy as jest.Mock).mockReturnValue(mockPolicy);

    const result = await handler(mockEvent as APIGatewayRequestAuthorizerEvent);

    expect(result).toEqual(mockPolicy);
    expect(createPolicy).toHaveBeenCalledWith(
      "Deny",
      "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
      mockAuthContext,
    );
  });

  it("should throw an error when validateApiKeyHeader throws an error", async () => {
    const mockEvent: Partial<APIGatewayRequestAuthorizerEvent> = {
      headers: {},
    };
    (validateApiKeyHeader as jest.Mock).mockImplementation(() => {
      throw new Error(AuthError.Unauthorized);
    });

    await expect(
      handler(mockEvent as APIGatewayRequestAuthorizerEvent),
    ).rejects.toThrow(AuthError.Unauthorized);
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Authorization failed: ${AuthError.Unauthorized}`,
    );
  });

  it("should throw an error when validateApiKeyEnvVar throws an error", async () => {
    const mockEvent: Partial<APIGatewayRequestAuthorizerEvent> = {
      headers: { "x-api-key": "test-api-key" },
    };
    (validateApiKeyHeader as jest.Mock).mockReturnValue("test-api-key");
    (validateApiKeyEnvVar as jest.Mock).mockImplementation(() => {
      throw new Error(AuthError.InternalServerError);
    });

    await expect(
      handler(mockEvent as APIGatewayRequestAuthorizerEvent),
    ).rejects.toThrow(AuthError.InternalServerError);
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Authorization failed: ${AuthError.InternalServerError}`,
    );
  });

  it("should throw an error when validateResourceArn throws an error", async () => {
    const mockEvent: Partial<APIGatewayRequestAuthorizerEvent> = {
      headers: { "x-api-key": "test-api-key" },
    };
    (validateApiKeyHeader as jest.Mock).mockReturnValue("test-api-key");
    (validateApiKeyEnvVar as jest.Mock).mockReturnValue("test-api-key");
    (getResourceArn as jest.Mock).mockReturnValue(undefined);
    (validateResourceArn as jest.Mock).mockImplementation(() => {
      throw new Error(AuthError.InternalServerError);
    });

    await expect(
      handler(mockEvent as APIGatewayRequestAuthorizerEvent),
    ).rejects.toThrow(AuthError.InternalServerError);
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Authorization failed: ${AuthError.InternalServerError}`,
    );
  });

  it("should throw an internal server error when an unknown error occurs", async () => {
    const mockEvent: Partial<APIGatewayRequestAuthorizerEvent> = {
      headers: { "x-api-key": "test-api-key" },
    };
    (validateApiKeyHeader as jest.Mock).mockImplementation(() => {
      throw undefined;
    });

    await expect(
      handler(mockEvent as APIGatewayRequestAuthorizerEvent),
    ).rejects.toThrow(AuthError.InternalServerError);
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Authorization failed: An unknown error occurred`,
    );
  });
});
