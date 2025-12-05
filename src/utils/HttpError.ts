const messageList = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  500: "Internal Server Error",
};

import { ResponseError } from "../types/interfaces.js";

const HttpError = (
  status: number,
  //@ts-expect-error
  message = messageList[status],
): ResponseError => {
  const error = new Error(message) as ResponseError;
  error.status = status;
  return error;
};

export default HttpError;
