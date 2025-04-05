import axios, { AxiosResponse } from "axios";
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

export const makeGraphQLMutationRequest = async (
  url: string,
  graphqlPayload: string,
): Promise<GraphQLResponse> => {
  try {
    const response: AxiosResponse<GraphQLResponse> = await axios.post(
      url,
      graphqlPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: (status) =>
          status >= HTTP_STATUS_CODE.OK &&
          status < HTTP_STATUS_CODE.MULTIPLE_CHOICES,
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          `GraphQL request failed with status ${error.response.status}: ${error.response.data}`,
        );
      } else if (error.request) {
        throw new Error(`GraphQL request failed: No response received`);
      } else {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
    } else {
      throw error;
    }
  }
};
