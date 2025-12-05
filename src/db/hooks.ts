import { Document, CallbackError, Query } from "mongoose";

type MongosseErrorWithStatus = CallbackError & { status?: number };

type MongosseNext = (err?: CallbackError) => void;

export const handleSaveError = (
  error: MongosseErrorWithStatus,
  doc: Document,
  next: MongosseNext,
) => {
  if (error?.name === "ValidationError") {
    error.status = 400;
  }
  if (error?.name === "MongoServerError") {
    error.status = 409;
  }
  next();
};

export const setUpdateSettings = function (this: Query<unknown, unknown>) {
  this.setOptions({ next: true, runValidators: true });
};
