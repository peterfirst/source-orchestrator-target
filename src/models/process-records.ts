import { SQSRecord } from "aws-lambda";

import {
  EVENT_NAME,
  updateDBItemStatus,
  EVENT_STATUS,
  DynamodbSQSRecord,
  Document,
  unmarshalDocumentDB,
} from "../lib/database";
import {
  createGraphQLPayload,
  transformPayload,
  postToGraphQL,
  Item,
  ItemWithBrand,
} from "../lib/graphql";
import { createLogger } from "../utils/logger";


export const processRecord = async (
  record: SQSRecord,
  apiUrl: string,
  tableName: string,
): Promise<void> => {
  const logger = createLogger("process-records");
  
  let id = "";
  let payload: Item | null = null;

  try {
    const recordBody: DynamodbSQSRecord = JSON.parse(record.body);
    
    if (recordBody?.eventName !== EVENT_NAME.INSERT) {
      logger.log("Skipping non-insert event");
      return;
    }

    const item: Document | null = unmarshalDocumentDB(recordBody);

  if (!item) {
      logger.error("Failed to parse item from SQS message body", recordBody);
      return;
    }

    ({ id, payload } = item);

    const updatedPayload: ItemWithBrand = transformPayload(payload, "testBrand");
    const graphqlPayload = createGraphQLPayload(updatedPayload);

    await postToGraphQL(apiUrl, graphqlPayload);
    logger.log(`Successfully posted message to ${apiUrl}`);

    await updateDBItemStatus(tableName, id, EVENT_STATUS.SUCCEEDED);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error processing SQS record:", error);
    }
    await updateDBItemStatus(tableName, id, EVENT_STATUS.FAILED);
  }
};
