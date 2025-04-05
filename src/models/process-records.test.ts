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

  const mockDocument: Document = {
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

  const mockDocumentDB: DocumentDB = {
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

  const mockDocumentWithBrand: ItemWithBrand = {
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
      NewImage: mockDocumentDB,
    }),
    attributes: {},
    messageAttributes: {},
    md5OfBody: "",
    eventSource: "",
    eventSourceARN: "",
    awsRegion: "",
  };

  const mockRecordBodyParsed = {
    eventName: EVENT_NAME.INSERT,
    NewImage: mockDocumentDB,
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  let mockParse;

  beforeEach(() => {
    jest.clearAllMocks();
    (unmarshalDocumentDB as jest.Mock).mockReturnValue(mockDocument);
    (transformPayload as jest.Mock).mockReturnValue(mockDocumentWithBrand);
    (createGraphQLPayload as jest.Mock).mockReturnValue(mockGraphqlPayload);
    (postToGraphQL as jest.Mock).mockResolvedValue({});
    (updateDBItemStatus as jest.Mock).mockResolvedValue({});
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
    mockParse = jest.spyOn(JSON, "parse");
  });

  afterEach(() => {
    mockParse.mockRestore();
  });

  it("should process a valid INSERT record", async () => {
    mockParse.mockImplementation(() => mockRecordBodyParsed);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockRecordBodyParsed);
    expect(transformPayload).toHaveBeenCalledWith(
      mockDocument.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockDocumentWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockDocument.id,
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
        NewImage: mockDocumentDB,
      }),
    };

    mockParse.mockImplementation(() => ({
      ...mockRecordBodyParsed,
      eventName: EVENT_NAME.MODIFY,
    }));

    await processRecord(nonInsertRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).not.toHaveBeenCalled();
    expect(transformPayload).not.toHaveBeenCalled();
    expect(createGraphQLPayload).not.toHaveBeenCalled();
    expect(postToGraphQL).not.toHaveBeenCalled();
    expect(updateDBItemStatus).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith("Skipping non-insert event");
  });

  it("should handle unmarshalDocumentDB returning null", async () => {
    mockParse.mockImplementation(() => mockRecordBodyParsed);

    (unmarshalDocumentDB as jest.Mock).mockReturnValue(null);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockRecordBodyParsed);
    expect(transformPayload).not.toHaveBeenCalled();
    expect(createGraphQLPayload).not.toHaveBeenCalled();
    expect(postToGraphQL).not.toHaveBeenCalled();
    expect(updateDBItemStatus).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to parse item from SQS message body",
      {
        eventName: "INSERT",
        NewImage: mockDocumentDB,
      },
    );
  });

  it("should handle errors during processing and update status to FAILED", async () => {
    mockParse.mockImplementation(() => mockRecordBodyParsed);

    const mockError = new Error("Test error");
    (postToGraphQL as jest.Mock).mockRejectedValue(mockError);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockRecordBodyParsed);
    expect(transformPayload).toHaveBeenCalledWith(
      mockDocument.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockDocumentWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockDocument.id,
      EVENT_STATUS.FAILED,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error processing SQS record:",
      mockError,
    );
  });

  it("should handle errors during updateDBItemStatus and still update status to FAILED", async () => {
    mockParse.mockImplementation(() => mockRecordBodyParsed);

    const mockError = new Error("Test error");
    (updateDBItemStatus as jest.Mock).mockRejectedValueOnce(mockError);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockRecordBodyParsed);
    expect(transformPayload).toHaveBeenCalledWith(
      mockDocument.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockDocumentWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockDocument.id,
      EVENT_STATUS.FAILED,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error processing SQS record:",
      mockError,
    );
  });

  it("should handle errors during processing and update status to FAILED when error is not instance of Error", async () => {
    mockParse.mockImplementation(() => mockRecordBodyParsed);

    const mockError = "Test error";
    (postToGraphQL as jest.Mock).mockRejectedValue(mockError);

    await processRecord(mockRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).toHaveBeenCalledWith(mockRecordBodyParsed);
    expect(transformPayload).toHaveBeenCalledWith(
      mockDocument.payload,
      "testBrand",
    );
    expect(createGraphQLPayload).toHaveBeenCalledWith(mockDocumentWithBrand);
    expect(postToGraphQL).toHaveBeenCalledWith(mockApiUrl, mockGraphqlPayload);
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      mockDocument.id,
      EVENT_STATUS.FAILED,
    );
    expect(mockLogger.error).not.toHaveBeenCalledWith(
      "Error processing SQS record:",
      mockError,
    );
  });

  it("should handle invalid JSON in record body", async () => {
    const invalidRecord: SQSRecord = {
      ...mockRecord,
      body: "invalid-json",
    };

    await processRecord(invalidRecord, mockApiUrl, mockTableName);

    expect(unmarshalDocumentDB).not.toHaveBeenCalled();
    expect(transformPayload).not.toHaveBeenCalled();
    expect(createGraphQLPayload).not.toHaveBeenCalled();
    expect(postToGraphQL).not.toHaveBeenCalled();
    expect(updateDBItemStatus).toHaveBeenCalledWith(
      mockTableName,
      "",
      EVENT_STATUS.FAILED,
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
