import { SQSRecord } from "aws-lambda";

import {
  EVENT_NAME,
  updateDBItemStatus,
  EVENT_STATUS,
  DocumentDB,
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

import { Logger } from "../utils/logger";

const logger = new Logger("dispatcher");

interface SQSItemRecord {
  eventName: 'INSERT' | 'MODIFY' | 'REMOVE';
  NewImage?: {
    id?: { S: string };
    payload?: DocumentDB;
  };
}

export const processRecord = async (
  record: SQSRecord,
  apiUrl: string,
  tableName: string,
): Promise<void> => {
  let id = "";
  let payload: Item | null = null;

  try {
    const recordBody: SQSItemRecord = JSON.parse(record.body);
    
    if (recordBody?.eventName !== EVENT_NAME.INSERT) {
      logger.log("Skipping non-insert event");
      return;
    }

    const item: Document | null = unmarshalDocumentDB(
      recordBody?.NewImage?.payload as DocumentDB,
    );

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
