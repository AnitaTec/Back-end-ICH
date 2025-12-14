import { Router } from "express";
import authenticate from "../db/middlewares/authenticate.js";
import {
  getConversationsController,
  getConversationMessagesController,
  sendMessageController,
  createConversationController,
} from "../controllers/auth.controller.js";

const messagesRouter = Router();

messagesRouter.get("/conversations", authenticate, getConversationsController);

messagesRouter.post(
  "/conversations",
  authenticate,
  createConversationController,
);

messagesRouter.get(
  "/conversations/:id/messages",
  authenticate,
  getConversationMessagesController,
);

messagesRouter.post(
  "/conversations/:id/messages",
  authenticate,
  sendMessageController,
);

export default messagesRouter;
