import "dotenv/config";

import conectDatabase from "./db/conectDatabase.js";
import startServer from "./server.js";
await conectDatabase();
startServer();
