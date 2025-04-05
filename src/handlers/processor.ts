import { APIGatewayProxyHandler } from "aws-lambda";
import { createLogger } from "../utils/logger";
import { HTTP_STATUS_CODE } from "../utils/HttpStatus";
import { processRequest, validateRequestBody } from "../models/process-request";

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = createLogger("processor");

  logger.log("Received APIGatewayProxyHandler Event: ", event);
  const tableName: string =
    process.env.DYNAMODB_TABLE_NAME || "chalhoub-events";

  if (!tableName) {
    return {
      statusCode: HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        message: "DYNAMODB_TABLE_NAME environment variable is not set",
      }),
    };
  }

  try {
    const requestBody = validateRequestBody(event.body);

    if (!requestBody) {
      return {
        statusCode: HTTP_STATUS_CODE.BAD_REQUEST,
        body: JSON.stringify({
          message: "Invalid request body or missing required fields",
        }),
      };
    }

    const newItem = await processRequest(requestBody, tableName);

    const response = {
      statusCode: HTTP_STATUS_CODE.CREATED,
      body: JSON.stringify({
        message: "Item inserted successfully",
        item: newItem,
      }),
    };

    logger.log("APIGatewayProxyHandler Success: ", response);

    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      logger.error("APIGatewayProxyHandler Failure:", error);
      errorMessage = error.message;
    }
    return {
      statusCode: HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        message: "Failed to insert item",
        error: errorMessage,
      }),
    };
  }
};
