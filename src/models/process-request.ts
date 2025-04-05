import { EVENT_STATUS, DocumentDB, insertDBItem } from "../lib/database";
import { generateTimeStamp } from "../utils/timestamp";
import { v4 as uuidv4 } from "uuid";

export type RequestBody = {
  id: string;
  name: string;
  body: string;
  timestamp: string;
};

const generateItemDB = (requestBody: RequestBody): DocumentDB => {
  const item: DocumentDB = {
    id: { S: uuidv4() },
    status: { S: EVENT_STATUS.PENDING },
    timestamp: { N: `${generateTimeStamp()}` },
    payload: {
      M: {
        id: { S: requestBody.id },
        name: { S: requestBody.name },
        body: { S: requestBody.body },
        timestamp: { N: `${requestBody.timestamp}` },
      },
    },
  };
  return item;
};

export const validateRequestBody = (
  body: string | null,
): RequestBody | null => {
  if (!body) return null;

  try {
    const parsedBody: RequestBody = JSON.parse(body);

    if (
      !parsedBody.id ||
      !parsedBody.name ||
      !parsedBody.body ||
      !parsedBody.timestamp
    ) {
      return null;
    }

    return parsedBody;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("JSON parsing error");
    }
    return null;
  }
};

export const processRequest = async (
  requestBody: RequestBody,
  tableName: string,
) => {
  const newItem = generateItemDB(requestBody);
  await insertDBItem(tableName, newItem);

  return newItem;
};
