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
import { processRecord } from "./process-records";
import { createLogger } from "../utils/logger";

jest.mock("../lib/database");
jest.mock("../lib/graphql");
jest.mock("../utils/logger");

describe("processRecord", () => {
  const mockApiUrl = "http://example.com/graphql";
  const mockTableName = "test-table";

  const mockItem: Document = {
    id: "item-id",
    status: "PENDING",
    timestamp: 1678886400,
    payload: {
      id: "payload-id",
      name: "Test Item",
      body: "This is a test item",
      timestamp: 1678886400,
    },
  };

  const mockItemDB: DocumentDB = {
    id: { S: "item-id" },
    status: { S: "PENDING" },
    timestamp: { N: "1678886400" },
    payload: {
      M: {
        id: { S: "payload-id" },
        name: { S: "Test Item" },
        body: { S: "This is a test item" },
        timestamp: { N: "1678886400" },
      },
    },
  };

  const mockItemWithBrand: ItemWithBrand = {
    id: "payload-id",
    name: "Test Item",
    body: "This is a test item",
    timestamp: 1678886400,
    brand: "testBrand",
  };

  const mockGraphqlPayload = JSON.stringify({
    query: "mutation { createItem { id } }",
  });

  const mockRecord: SQSRecord = {
    messageId: "1",
    receiptHandle: "handle",
    body: JSON.stringify({
      eventName: EVENT_NAME.INSERT,
      NewImage: {
        payload: mockItemDB,
      },
    }),
    attributes: {},
    messageAttributes: {},
    md5OfBody: "",
    eventSource: "",
    eventSourceARN: "",
    awsRegion: "",
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (unmarshalDocumentDB as jest.Mock).mockReturnValue(mockItem);
    (transformPayload as jest.Mock).mockReturnValue(mockItemWithBrand);
    (createGraphQLPayload as jest.Mock).mockReturnValue(mockGraphqlPayload);
    (postToGraphQL as jest.Mock).mockResolvedValue({});
    (updateDBItemStatus as jest.Mock).mockResolvedValue({});
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
  });

  it("should process a valid INSERT record", async () => {
    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockItemDB);
    expect(transformPayload).toHaveBeenCalledWith(
      mockItem.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockItemWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockItem.id,
      EVENT_STATUS.SUCCEEDED,
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      `Successfully posted message to ${mockApiUrl}`,
    );
  });

  it("should skip non-INSERT events", async () => {
    const nonInsertRecord: SQSRecord = {
      ...mockRecord,
      body: JSON.stringify({
        eventName: EVENT_NAME.MODIFY,
        NewImage: {
          payload: mockItemDB,
        },
      }),
    };

    await processRecord(nonInsertRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).not.toHaveBeenCalled();
    expect(transformPayload).not.toHaveBeenCalled();
    expect(createGraphQLPayload).not.toHaveBeenCalled();
    expect(postToGraphQL).not.toHaveBeenCalled();
    expect(updateDBItemStatus).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith("Skipping non-insert event");
  });

  it("should handle unmarshalDocumentDB returning null", async () => {
    (unmarshalDocumentDB as jest.Mock).mockReturnValue(null);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockItemDB);
    expect(transformPayload).not.toHaveBeenCalled();
    expect(createGraphQLPayload).not.toHaveBeenCalled();
    expect(postToGraphQL).not.toHaveBeenCalled();
    expect(updateDBItemStatus).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to parse item from SQS message body",
      {
        eventName: "INSERT",
        NewImage: { payload: mockItemDB },
      },
    );
  });

  it("should handle errors during processing and update status to FAILED", async () => {
    const mockError = new Error("Test error");
    (postToGraphQL as jest.Mock).mockRejectedValue(mockError);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockItemDB);
    expect(transformPayload).toHaveBeenCalledWith(
      mockItem.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockItemWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockItem.id,
      EVENT_STATUS.FAILED,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error processing SQS record:",
      mockError,
    );
  });

  it("should handle errors during updateDBItemStatus and still update status to FAILED", async () => {
    const mockError = new Error("Test error");
    (updateDBItemStatus as jest.Mock).mockRejectedValueOnce(mockError);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockItemDB);
    expect(transformPayload).toHaveBeenCalledWith(
      mockItem.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockItemWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockItem.id,
      EVENT_STATUS.FAILED,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error processing SQS record:",
      mockError,
    );
  });

  it("should handle errors during processing and update status to FAILED when error is not instance of Error", async () => {
    const mockError = "Test error";
    (postToGraphQL as jest.Mock).mockRejectedValue(mockError);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockItemDB);
    expect(transformPayload).toHaveBeenCalledWith(
      mockItem.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockItemWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockItem.id,
      EVENT_STATUS.FAILED,
    );
    expect(mockLogger.error).not.toHaveBeenCalledWith(
      "Error processing SQS record:",
      mockError,
    );
  });
});
