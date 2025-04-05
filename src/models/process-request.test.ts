import { EVENT_STATUS, DocumentDB, insertDBItem } from "../lib/database";
import {
  processRequest,
  validateRequestBody,
  RequestBody,
} from "./process-request";
import { generateTimeStamp } from "../utils/timestamp";
import { v4 as uuidv4 } from "uuid";

jest.mock("../lib/database");
jest.mock("../utils/timestamp");
jest.mock("uuid");

describe("processRequest", () => {
  const mockTableName = "test-table";
  const mockRequestBody: RequestBody = {
    id: "payload-id",
    name: "Test Item",
    body: "This is a test item",
    timestamp: "1678886400",
  };

  const mockItemDB: DocumentDB = {
    id: { S: "mock-uuid" },
    status: { S: EVENT_STATUS.PENDING },
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

  beforeEach(() => {
    jest.clearAllMocks();
    (generateTimeStamp as jest.Mock).mockReturnValue(1678886400);
    (uuidv4 as jest.Mock).mockReturnValue("mock-uuid");
    (insertDBItem as jest.Mock).mockResolvedValue({});
  });

  it("should process a valid request and insert it into the database", async () => {
    const result = await processRequest(mockRequestBody, mockTableName);

    expect(generateTimeStamp).toHaveBeenCalled();
    expect(uuidv4).toHaveBeenCalled();
    expect(insertDBItem).toHaveBeenCalledWith(mockTableName, mockItemDB);
    expect(result).toEqual(mockItemDB);
  });

  it("should handle errors during database insertion", async () => {
    const mockError = new Error("Database error");
    (insertDBItem as jest.Mock).mockRejectedValue(mockError);

    await expect(
      processRequest(mockRequestBody, mockTableName),
    ).rejects.toThrow(mockError);

    expect(generateTimeStamp).toHaveBeenCalled();
    expect(uuidv4).toHaveBeenCalled();
    expect(insertDBItem).toHaveBeenCalledWith(mockTableName, mockItemDB);
  });
});

describe("validateRequestBody", () => {
  it("should return null if the body is null", () => {
    const result = validateRequestBody(null);
    expect(result).toBeNull();
  });

  it("should return null if the body is not valid JSON", () => {
    try {
      const result = validateRequestBody("invalid-json");
      expect(result).toBeNull();
    } catch (error) {}
  });

  it("should throw an error if the body is not valid JSON and it is a SyntaxError", () => {
    const invalidJson = "{invalid-json}";
    expect(() => validateRequestBody(invalidJson)).toThrow(
      "JSON parsing error",
    );
  });

  it("should return null if the body is missing required fields", () => {
    const incompleteBody = JSON.stringify({
      id: "payload-id",
      name: "Test Item",
      body: "This is a test item",
    });
    const result = validateRequestBody(incompleteBody);
    expect(result).toBeNull();
  });

  it("should return the parsed body if it is valid", () => {
    const validBody = JSON.stringify({
      id: "payload-id",
      name: "Test Item",
      body: "This is a test item",
      timestamp: "1678886400",
    });
    const result = validateRequestBody(validBody);
    expect(result).toEqual({
      id: "payload-id",
      name: "Test Item",
      body: "This is a test item",
      timestamp: "1678886400",
    });
  });

  it("should return null if the body is missing id", () => {
    const incompleteBody = JSON.stringify({
      name: "Test Item",
      body: "This is a test item",
      timestamp: "1678886400",
    });
    const result = validateRequestBody(incompleteBody);
    expect(result).toBeNull();
  });

  it("should return null if the body is missing name", () => {
    const incompleteBody = JSON.stringify({
      id: "payload-id",
      body: "This is a test item",
      timestamp: "1678886400",
    });
    const result = validateRequestBody(incompleteBody);
    expect(result).toBeNull();
  });

  it("should return null if the body is missing body", () => {
    const incompleteBody = JSON.stringify({
      id: "payload-id",
      name: "Test Item",
      timestamp: "1678886400",
    });
    const result = validateRequestBody(incompleteBody);
    expect(result).toBeNull();
  });

  it("should return null if the body is missing timestamp", () => {
    const incompleteBody = JSON.stringify({
      id: "payload-id",
      name: "Test Item",
      body: "This is a test item",
    });
    const result = validateRequestBody(incompleteBody);
    expect(result).toBeNull();
  });
});
