import { handler } from "./health";
import { HTTP_STATUS_CODE } from "../models/HttpStatus";

describe("Health Handler", () => {
  it("should return a 200 OK response", async () => {
    const result = await handler(null, null, null);

    expect(result.statusCode).toBe(HTTP_STATUS_CODE.OK);
    expect(JSON.parse(result.body)).toEqual({ message: "OK" });
  });
});
