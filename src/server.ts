import express, { Express } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import autRouter from "./routers/auth.router.js";
import messagesRouter from "./routers/messages.router.js";
import usersRouter from "./routers/users.router.js";
import postsRouter from "./routers/posts.router.js";

import notFoundHandler from "./db/middlewares/notFoundHandler.js";
import errorHandler from "./db/middlewares/errorHandler.js";

import Conversation from "./db/models/Conversation.js";
import Message from "./db/models/Message.js";

type JwtPayload = {
  id?: string;
  _id?: string;
};

const startServer = (): void => {
  const app: Express = express();

  app.use(cors());
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  app.use("/api/auth", autRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/posts", postsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as JwtPayload;

      socket.data.userId = payload.id || payload._id;
      if (!socket.data.userId) return next(new Error("No user id in token"));
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on(
      "message:send",
      async ({
        conversationId,
        text,
      }: {
        conversationId: string;
        text: string;
      }) => {
        if (!text?.trim()) return;

        const msg = await Message.create({
          conversationId,
          sender: userId,
          text: text.trim(),
          readBy: [userId],
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: msg._id,
        });

        const fullMsg = await Message.findById(msg._id).populate(
          "sender",
          "username email avatarURL",
        );

        io.to(`conv:${conversationId}`).emit("message:new", fullMsg);
      },
    );
  });

  const port: number = Number(process.env.PORT) || 3000;
  httpServer.listen(port, () =>
    console.log(`Server is running on port ${port}`),
  );
};

export default startServer;
