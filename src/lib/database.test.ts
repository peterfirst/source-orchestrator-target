import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import {
  insertDBItem,
  updateDBItemStatus,
  unmarshalDocumentDB,
  marshalDocumentDB,
  DocumentDB,
  Document,
  EVENT_STATUS,
  DynamodbSQSRecord
} from "./database";
import "aws-sdk-client-mock-jest";

const ddbMock = mockClient(DynamoDBClient);

describe("Database Functions", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe("insertDBItem", () => {
    it("should insert an item into DynamoDB", async () => {
      const tableName = "test-table";
      const newItem: DocumentDB = {
        id: { S: "123" },
        status: { S: "PENDING" },
        timestamp: { N: "1678886400" },
        payload: {
          M: {
            id: { S: "payload-123" },
            name: { S: "Test Item" },
            body: { S: "This is a test item" },
            timestamp: { N: "1678886400" },
          },
        },
      };

      await insertDBItem(tableName, newItem);

      expect(ddbMock).toHaveReceivedCommandWith(PutItemCommand, {
        TableName: tableName,
        Item: newItem,
      });
    });

    it("should handle errors during item insertion", async () => {
      const tableName = "test-table";
      const newItem: DocumentDB = {
        id: { S: "123" },
        status: { S: "PENDING" },
        timestamp: { N: "1678886400" },
        payload: {
          M: {
            id: { S: "payload-123" },
            name: { S: "Test Item" },
            body: { S: "This is a test item" },
            timestamp: { N: "1678886400" },
          },
        },
      };
      ddbMock.on(PutItemCommand).rejects(new Error("DynamoDB error"));

      await expect(insertDBItem(tableName, newItem)).rejects.toThrow(
        "DynamoDB error",
      );
    });
  });

  describe("updateDBItemStatus", () => {
    it("should update the status of an item in DynamoDB", async () => {
      const tableName = "test-table";
      const id = "123";
      const status = EVENT_STATUS.SUCCEEDED;

      await updateDBItemStatus(tableName, id, status);

      expect(ddbMock).toHaveReceivedCommandWith(UpdateItemCommand, {
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
      });
    });

    it("should handle errors during item status update", async () => {
      const tableName = "test-table";
      const id = "123";
      const status = EVENT_STATUS.FAILED;
      ddbMock.on(UpdateItemCommand).rejects(new Error("DynamoDB error"));

      await expect(updateDBItemStatus(tableName, id, status)).rejects.toThrow(
        "DynamoDB error",
      );
    });
  });

  describe("unmarshalDocumentDB", () => {
    it("should unmarshal a DocumentDB object to a Document object", () => {
      const documentDB: DynamodbSQSRecord = {
        eventName: 'INSERT',
        dynamodb: {
          NewImage: {
            id: { S: "123" },
            status: { S: "PENDING" },
            timestamp: { N: "1678886400" },
            payload: {
              M: {
                id: { S: "payload-123" },
                name: { S: "Test Item" },
                body: { S: "This is a test item" },
                timestamp: { N: "1678886400" },
              },
            },
          }
        }
      };

      const expectedDocument: Document = {
        id: "123",
        status: "PENDING",
        timestamp: 1678886400,
        payload: {
          id: "payload-123",
          name: "Test Item",
          body: "This is a test item",
          timestamp: 1678886400,
        },
      };

      const result = unmarshalDocumentDB(documentDB);
      expect(result).toEqual(expectedDocument);
    });
    it("should unmarshal a DocumentDB object to a Document object with different eventName", () => {
      const documentDB: DynamodbSQSRecord = {
        eventName: 'MODIFY',
        dynamodb: {
          NewImage: {
            id: { S: "123" },
            status: { S: "PENDING" },
            timestamp: { N: "1678886400" },
            payload: {
              M: {
                id: { S: "payload-123" },
                name: { S: "Test Item" },
                body: { S: "This is a test item" },
                timestamp: { N: "1678886400" },
              },
            },
          }
        }
      };

      const expectedDocument: Document = {
        id: "123",
        status: "PENDING",
        timestamp: 1678886400,
        payload: {
          id: "payload-123",
          name: "Test Item",
          body: "This is a test item",
          timestamp: 1678886400,
        },
      };

      const result = unmarshalDocumentDB(documentDB);
      expect(result).toEqual(expectedDocument);
    });
  });

  describe("marshalDocumentDB", () => {
    it("should marshal a Document object to a DocumentDB object", () => {
      const document: Document = {
        id: "123",
        status: "PENDING",
        timestamp: 1678886400,
        payload: {
          id: "payload-123",
          name: "Test Item",
          body: "This is a test item",
          timestamp: 1678886400,
        },
      };

      const expectedDocumentDB: DocumentDB = {
        id: { S: "123" },
        status: { S: "PENDING" },
        timestamp: { N: "1678886400" },
        payload: {
          M: {
            id: { S: "payload-123" },
            name: { S: "Test Item" },
            body: { S: "This is a test item" },
            timestamp: { N: "1678886400" },
          },
        },
      };

      const result = marshalDocumentDB(document);
      expect(result).toEqual(expectedDocumentDB);
    });
  });
});
