import https from "https";
import { URL } from "url";
import { HTTP_STATUS_CODE } from "../models/HttpStatus";

export type RequestBody = {
  id: string;
  name: string;
  body: string;
  timestamp: string;
};

export type GraphQLResponse = {
  data?: any;
  errors?: any;
};

export const makeGraphQLRequest = (
  url: string,
  graphqlPayload: string,
): Promise<GraphQLResponse> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || 443,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(graphqlPayload),
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        if (
          res.statusCode &&
          res.statusCode >= HTTP_STATUS_CODE.OK &&
          res.statusCode < HTTP_STATUS_CODE.MULTIPLE_CHOICES
        ) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(
            new Error(
              `GraphQL request failed with status ${res.statusCode}: ${responseBody}`,
            ),
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(graphqlPayload);
    req.end();
  });
};
