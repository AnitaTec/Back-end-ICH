import express, { Application } from "express";
import cors from "cors";

import notFoundHandler from "./db/middlewares/notFoundHandler.js";
import errorHandler from "./db/middlewares/errorHandler.js";
const startServer = (): void => {
  const app: Application = express();

  app.use(cors());
  app.use(express.json());

  app.use(notFoundHandler);
  app.use(errorHandler);

  const port: number = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Server is running on port ${port}`));
};

export default startServer;
