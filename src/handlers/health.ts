import { APIGatewayProxyHandler } from "aws-lambda";
import { HTTP_STATUS_CODE } from "../models/HttpStatus";

export const handler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: HTTP_STATUS_CODE.OK,
    body: JSON.stringify({ message: "OK" }),
  };
};
