import type { UserDocument } from "../../db/models/User";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserDocument;
  }
}
