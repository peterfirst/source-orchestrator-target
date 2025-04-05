import { SQSHandler, SQSEvent } from "aws-lambda";
import { createLogger } from "../utils/logger";
import { processRecord } from "../models/process-records";

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const logger = createLogger("dispatcher");

  logger.log("Received SQS Event: ", event);

  if (!event.Records || event.Records.length === 0) {
    logger.error("No records found in SQS event");
    return;
  }

  const apiUrl: string =
    process.env.TARGET_GRAPHQL_URL || "http://example-domain/graphql";
  const tableName: string =
    process.env.DYNAMODB_TABLE_NAME || "chalhoub-events";

  if (!apiUrl) {
    throw new Error("TARGET_GRAPHQL_URL environment variable is not set");
  }

  if (!tableName) {
    throw new Error("DYNAMODB_TABLE_NAME environment variable is not set");
  }

  await Promise.allSettled(
    event.Records.map((record) => processRecord(record, apiUrl, tableName)),
  );
};
