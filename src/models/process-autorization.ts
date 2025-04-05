import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";
import { createLogger } from "../utils/logger";

export type AuthContext = {
  apiKey: string;
};

export enum AuthError {
  MissingApiKeyHeader = "Missing x-api-key header",
  InvalidApiKeyHeader = "x-api-key header is not a string",
  MissingApiKeyEnvVar = "API_KEY environment variable is not set",
  MissingResourceArn = "Could not determine resource ARN from event",
  Unauthorized = "Unauthorized",
  InternalServerError = "Internal Server Error",
}

const X_API_KEY_HEADER = "x-api-key";
const PRINCIPAL_ID = "user";
const API_INVOKE_ACTION = "execute-api:Invoke";
const POLICY_VERSION = "2012-10-17";

export const createPolicy = (
  effect: "Allow" | "Deny",
  resourceArn: string,
  context: AuthContext,
): APIGatewayAuthorizerResult => ({
  principalId: PRINCIPAL_ID,
  context,
  policyDocument: {
    Version: POLICY_VERSION,
    Statement: [
      {
        Action: API_INVOKE_ACTION,
        Effect: effect,
        Resource: resourceArn,
      },
    ],
  },
});

export const getResourceArn = (
  event: APIGatewayRequestAuthorizerEvent | APIGatewayTokenAuthorizerEvent,
): string | undefined => {
  if ("routeArn" in event) {
    return event.routeArn;
  } else if ("methodArn" in event) {
    return event.methodArn;
  }
  return undefined;
};

export const validateApiKeyHeader = (
  event: APIGatewayRequestAuthorizerEvent | APIGatewayTokenAuthorizerEvent,
  logger: ReturnType<typeof createLogger>,
): string => {
  if (
    !("headers" in event) ||
    !event.headers ||
    !event.headers[X_API_KEY_HEADER]
  ) {
    logger.error(AuthError.MissingApiKeyHeader);
    throw new Error(AuthError.Unauthorized);
  }

  const apiKey = event.headers[X_API_KEY_HEADER];
  if (typeof apiKey !== "string") {
    logger.error(AuthError.InvalidApiKeyHeader);
    throw new Error(AuthError.Unauthorized);
  }
  return apiKey;
};

export const validateApiKeyEnvVar = (
  logger: ReturnType<typeof createLogger>,
): string => {
  const validApiKey = process.env.API_KEY;
  if (!validApiKey) {
    logger.error(AuthError.MissingApiKeyEnvVar);
    throw new Error(AuthError.InternalServerError);
  }
  return validApiKey;
};

export const validateResourceArn = (
  resourceArn: string | undefined,
  logger: ReturnType<typeof createLogger>,
): string => {
  if (!resourceArn) {
    logger.error(AuthError.MissingResourceArn);
    throw new Error(AuthError.InternalServerError);
  }
  return resourceArn;
};
