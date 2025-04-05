import { handler } from "./dispatcher";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { createLogger } from "../utils/logger";
import { processRecord } from "../models/process-records";

jest.mock("../utils/logger", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("../models/process-records", () => ({
  processRecord: jest.fn(),
}));

describe("SQS Handler", () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    process.env.TARGET_GRAPHQL_URL = "https://example.com/graphql";
    process.env.DYNAMODB_TABLE_NAME = "chalhoub-events";
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TARGET_GRAPHQL_URL;
    delete process.env.DYNAMODB_TABLE_NAME;
  });

  it("should log and process records when valid SQS event is received", async () => {
    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "1",
          body: JSON.stringify({ key: "value" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
      ],
    };

    await handler(sqsEvent);

    expect(mockLogger.log).toHaveBeenCalledWith(
      "Received SQS Event: ",
      sqsEvent,
    );
    expect(mockLogger.error).not.toHaveBeenCalled();

    expect(processRecord).toHaveBeenCalledWith(
      sqsEvent.Records[0],
      "https://example.com/graphql",
      "chalhoub-events",
    );
  });

  it("should log an error when no records are found in the event", async () => {
    const sqsEvent: SQSEvent = { Records: [] };

    await handler(sqsEvent);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "No records found in SQS event",
    );
    expect(processRecord).not.toHaveBeenCalled();
  });

  it("should throw an error if TARGET_GRAPHQL_URL is not set", async () => {
    delete process.env.TARGET_GRAPHQL_URL;

    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "1",
          body: JSON.stringify({ key: "value" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
      ],
    };

    try {
      await expect(handler(sqsEvent)).rejects.toThrow(
        "TARGET_GRAPHQL_URL environment variable is not set",
      );
      expect(processRecord).not.toHaveBeenCalled();
    } catch (error) {}
  });

  it("should throw an error if DYNAMODB_TABLE_NAME is not set", async () => {
    delete process.env.DYNAMODB_TABLE_NAME;

    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "1",
          body: JSON.stringify({ key: "value" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
      ],
    };

    try {
      await expect(handler(sqsEvent)).rejects.toThrow(
        "DYNAMODB_TABLE_NAME environment variable is not set",
      );
      expect(processRecord).not.toHaveBeenCalled();
    } catch (error) {}
  });

  it("should handle Promise.allSettled correctly", async () => {
    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "1",
          body: JSON.stringify({ key: "value" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
        {
          messageId: "2",
          receiptHandle: "2",
          body: JSON.stringify({ key: "value2" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
      ],
    };

    (processRecord as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Failed"));
    await handler(sqsEvent);

    expect(processRecord).toHaveBeenCalledTimes(2);
    expect(processRecord).toHaveBeenNthCalledWith(
      1,
      sqsEvent.Records[0],
      "https://example.com/graphql",
      "chalhoub-events",
    );
    expect(processRecord).toHaveBeenNthCalledWith(
      2,
      sqsEvent.Records[1],
      "https://example.com/graphql",
      "chalhoub-events",
    );
  });

  it("should process multiple records", async () => {
    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "1",
          body: JSON.stringify({ key: "value" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
        {
          messageId: "2",
          receiptHandle: "2",
          body: JSON.stringify({ key: "value2" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
      ],
    };

    await handler(sqsEvent);

    expect(processRecord).toHaveBeenCalledTimes(2);
    expect(processRecord).toHaveBeenNthCalledWith(
      1,
      sqsEvent.Records[0],
      "https://example.com/graphql",
      "chalhoub-events",
    );
    expect(processRecord).toHaveBeenNthCalledWith(
      2,
      sqsEvent.Records[1],
      "https://example.com/graphql",
      "chalhoub-events",
    );
  });

  it("should use default values if environment variables are not set", async () => {
    delete process.env.TARGET_GRAPHQL_URL;
    delete process.env.DYNAMODB_TABLE_NAME;
    const sqsEvent: SQSEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "1",
          body: JSON.stringify({ key: "value" }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:account-id:queue-name",
          awsRegion: "region",
        } as SQSRecord,
      ],
    };
    await handler(sqsEvent);
    expect(processRecord).toHaveBeenCalledWith(
      sqsEvent.Records[0],
      "http://example-domain/graphql",
      "chalhoub-events",
    );
  });
});
