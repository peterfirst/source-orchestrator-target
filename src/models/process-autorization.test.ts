import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";
import { createLogger } from "../utils/logger";
import {
  AuthContext,
  AuthError,
  createPolicy,
  getResourceArn,
  validateApiKeyEnvVar,
  validateApiKeyHeader,
  validateResourceArn,
} from "./process-autorization";

jest.mock("../utils/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("Authorization Model", () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
    delete process.env.API_KEY;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createPolicy", () => {
    it("should create a valid policy document", () => {
      const effect = "Allow";
      const resourceArn = "arn:aws:execute-api:region:account-id:api-id/*";
      const context: AuthContext = { apiKey: "test-api-key" };

      const result = createPolicy(effect, resourceArn, context);

      expect(result.principalId).toBe("user");
      expect(result.context).toEqual(context);
      expect(result.policyDocument.Version).toBe("2012-10-17");
      expect(result.policyDocument.Statement).toHaveLength(1);
      expect(result.policyDocument.Statement[0].Action).toBe(
        "execute-api:Invoke",
      );
      expect(result.policyDocument.Statement[0].Effect).toBe(effect);
      expect(result.policyDocument.Statement[0].Resource).toBe(resourceArn);
    });
  });

  describe("getResourceArn", () => {
    it("should return routeArn if present", () => {
      const event: Partial<APIGatewayRequestAuthorizerEvent> = {
        routeArn:
          "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
      };
      const result = getResourceArn(event as APIGatewayRequestAuthorizerEvent);
      expect(result).toBe(event.routeArn);
    });

    it("should return methodArn if routeArn is not present", () => {
      const event: Partial<APIGatewayTokenAuthorizerEvent> = {
        methodArn:
          "arn:aws:execute-api:region:account-id:api-id/stage/method/path",
      };
      const result = getResourceArn(event as APIGatewayTokenAuthorizerEvent);
      expect(result).toBe(event.methodArn);
    });

    it("should return undefined if neither routeArn nor methodArn is present", () => {
      const event: Partial<APIGatewayRequestAuthorizerEvent> = {};
      const result = getResourceArn(event as APIGatewayRequestAuthorizerEvent);
      expect(result).toBeUndefined();
    });
  });

  describe("validateApiKeyHeader", () => {
    it("should return the API key if it is present and valid", () => {
      const event: Partial<APIGatewayRequestAuthorizerEvent> = {
        headers: { "x-api-key": "test-api-key" },
      };
      const result = validateApiKeyHeader(
        event as APIGatewayRequestAuthorizerEvent,
        mockLogger as any,
      );
      expect(result).toBe("test-api-key");
    });

    it("should throw an error if the x-api-key header is missing", () => {
      const event: Partial<APIGatewayRequestAuthorizerEvent> = { headers: {} };
      expect(() =>
        validateApiKeyHeader(
          event as APIGatewayRequestAuthorizerEvent,
          mockLogger as any,
        ),
      ).toThrow(AuthError.Unauthorized);
      expect(mockLogger.error).toHaveBeenCalledWith(
        AuthError.MissingApiKeyHeader,
      );
    });

    it("should throw an error if the headers are missing", () => {
      const event: Partial<APIGatewayRequestAuthorizerEvent> = {};
      expect(() =>
        validateApiKeyHeader(
          event as APIGatewayRequestAuthorizerEvent,
          mockLogger as any,
        ),
      ).toThrow(AuthError.Unauthorized);
      expect(mockLogger.error).toHaveBeenCalledWith(
        AuthError.MissingApiKeyHeader,
      );
    });

    it("should throw an error if the API key is not a string", () => {
      const event: Partial<APIGatewayRequestAuthorizerEvent> = {
        headers: { "x-api-key": 123 },
      } as any;
      expect(() =>
        validateApiKeyHeader(
          event as APIGatewayRequestAuthorizerEvent,
          mockLogger as any,
        ),
      ).toThrow(AuthError.Unauthorized);
      expect(mockLogger.error).toHaveBeenCalledWith(
        AuthError.InvalidApiKeyHeader,
      );
    });
  });

  describe("validateApiKeyEnvVar", () => {
    it("should return the API key if it is set in the environment", () => {
      process.env.API_KEY = "valid-api-key";
      const result = validateApiKeyEnvVar(mockLogger as any);
      expect(result).toBe("valid-api-key");
    });

    it("should throw an error if the API_KEY environment variable is not set", () => {
      expect(() => validateApiKeyEnvVar(mockLogger as any)).toThrow(
        AuthError.InternalServerError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        AuthError.MissingApiKeyEnvVar,
      );
    });
  });

  describe("validateResourceArn", () => {
    it("should return the resource ARN if it is valid", () => {
      const resourceArn =
        "arn:aws:execute-api:region:account-id:api-id/stage/method/path";
      const result = validateResourceArn(resourceArn, mockLogger as any);
      expect(result).toBe(resourceArn);
    });

    it("should throw an error if the resource ARN is undefined", () => {
      expect(() => validateResourceArn(undefined, mockLogger as any)).toThrow(
        AuthError.InternalServerError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        AuthError.MissingResourceArn,
      );
    });
  });
});
