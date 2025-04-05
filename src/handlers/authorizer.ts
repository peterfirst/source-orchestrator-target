import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
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
} from "../models/process-autorization";

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent | APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const logger = createLogger("authorizer");
  logger.log("Received event:", event);

  try {
    const apiKey = validateApiKeyHeader(event, logger);
    const validApiKey = validateApiKeyEnvVar(logger);
    const resourceArn = validateResourceArn(getResourceArn(event), logger);

    const authContext: AuthContext = {
      apiKey: apiKey,
    };

    if (apiKey === validApiKey) {
      return createPolicy("Allow", resourceArn, authContext);
    } else {
      return createPolicy("Deny", resourceArn, authContext);
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Authorization failed: ${error.message}`);
      throw error;
    } else {
      logger.error(`Authorization failed: An unknown error occurred`);
      throw new Error(AuthError.InternalServerError);
    }
  }
};
