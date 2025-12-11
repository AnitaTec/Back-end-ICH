import { UserDocument } from "../db/models/User.ts";

declare module "express-server-static-core" {
  interface Request {
    user?: UserDocument;
  }
}
