import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({});

export enum EVENT_NAME {
  INSERT = "INSERT",
  MODIFY = "MODIFY",
  REMOVE = "REMOVE",
}

export enum EVENT_STATUS {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

export type DocumentDB = {
  id: { S: string };
  status: { S: string };
  timestamp: { N: string };
  payload: {
    M: {
      id: { S: string };
      name: { S: string };
      body: { S: string };
      timestamp: { N: string };
    };
  };
};

export type Document = {
  id: string;
  status: string;
  timestamp: number;
  payload: {
    id: string;
    name: string;
    body: string;
    timestamp: number;
  };
};

export const insertDBItem = async (
  tableName: string,
  newItem: DocumentDB,
): Promise<void> => {
  const params = {
    TableName: tableName,
    Item: newItem,
  };

  const command = new PutItemCommand(params);
  await db.send(command);
};

export const updateDBItemStatus = async (
  tableName: string,
  id: string,
  status: EVENT_STATUS,
): Promise<void> => {
  const params = {
    TableName: tableName,
    Key: {
      id: { S: id },
    },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": { S: status },
    },
  };

  const command = new UpdateItemCommand(params);
  await db.send(command);
};

export const unmarshalDocumentDB = (document: DocumentDB): Document => {
  return unmarshall(document) as Document;
};

export const marshalDocumentDB = (document: Document): DocumentDB => {
  return marshall(document) as DocumentDB;
};
