import mongoose from "mongoose";

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

const conectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database");
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Connection to database error ${error.message}`);
    }
    console.log(`Unknown error ${error}`);
  }
};

export default conectDatabase;
