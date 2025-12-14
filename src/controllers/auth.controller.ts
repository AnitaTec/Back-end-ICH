import { Request, Response, RequestHandler } from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  refreshUser,
  logoutUser,
} from "../services/auth.services.js";
import validateBody from "../utils/validateBody.js";
import { registerSchema, loginSchema } from "../shemas/auth.schemas.js";
import creteTokens from "../utils/creteTokens.js";
import { AuthRequest } from "../types/interfaces.js";

import User from "../db/models/User.js";
import Conversation from "../db/models/Conversation.js";
import Message from "../db/models/Message.js";

import { Types } from "mongoose";
import type { Document, Model } from "mongoose";

type MessageDocument = Document<Types.ObjectId> & {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

type ConversationDocument = Document<Types.ObjectId> & {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

const MessageModel = Message as unknown as Model<MessageDocument>;
const ConversationModel =
  Conversation as unknown as Model<ConversationDocument>;

export const registerController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  validateBody(registerSchema, req.body);
  await registerUser(req.body);
  res.status(201).json({ message: "User registered successfully" });
};

export const loginController: RequestHandler = async (req, res) => {
  validateBody(loginSchema, req.body);
  const result = await loginUser(req.body);
  res.json(result);
};

export const getCfurrentController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const user = authReq.user!;
  const { accessToken, refreshToken } = creteTokens(user._id);
  await User.findByIdAndUpdate(user._id, { accessToken, refreshToken });

  res.json({
    accessToken,
    refreshToken,
    user: {
      email: user.email,
      fullname: user.fullName,
      username: user.username,
      avatarURL: user.avatarURL,
      about: user.about || "",
      website: user.website || "",
    },
  });
};

export const updateProfileController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;

  try {
    const { username, avatar, about, website } = req.body as {
      username?: string;
      avatar?: string;
      about?: string;
      website?: string;
    };

    const payload: {
      username?: string;
      avatarURL?: string;
      about?: string;
      website?: string;
    } = {};

    if (username) payload.username = username;
    if (avatar) payload.avatarURL = avatar;
    if (about !== undefined) payload.about = about;
    if (website !== undefined) payload.website = website;

    const updatedUser = await updateUserProfile(authReq.user!._id, payload);

    res.json({
      user: {
        email: updatedUser.email,
        fullname: updatedUser.fullName,
        username: updatedUser.username,
        avatarURL: updatedUser.avatarURL,
        about: updatedUser.about || "",
        website: updatedUser.website || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Can not update user data",
      error: (error as Error).message,
    });
  }
};

export const refreshController: RequestHandler = async (req, res) => {
  const result = await refreshUser(req.body.refreshToken);
  res.json(result);
};

export const logoutController: RequestHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  await logoutUser(req.user!);

  res.json({
    message: "Logout successfuly",
  });
};

export const getConversationsController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!._id;

  const conversations = await ConversationModel.find({ participants: userId })
    .populate("participants", "username email avatarURL fullName")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username email avatarURL" },
    })
    .sort({ updatedAt: -1 });

  res.json(conversations);
};

export const getConversationMessagesController: RequestHandler = async (
  req,
  res,
) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!._id;
  const { id } = req.params;

  const conv = await ConversationModel.findById(id);
  if (!conv) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const participants = conv.participants as unknown as Types.ObjectId[];
  const isMember = participants.some((p) => String(p) === String(userId));
  if (!isMember) {
    return res.status(403).json({ message: "Access denied" });
  }

  const messages = await MessageModel.find({
    conversationId: new Types.ObjectId(String(id)),
  })
    .populate("sender", "username email avatarURL")
    .sort({ createdAt: 1 });

  res.json(messages);
};

export const sendMessageController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!._id;
  const { id } = req.params;
  const { text } = req.body as { text?: string };

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Text is required" });
  }

  const conv = await ConversationModel.findById(id);
  if (!conv) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const participants = conv.participants as unknown as Types.ObjectId[];
  const isMember = participants.some((p) => String(p) === String(userId));
  if (!isMember) {
    return res.status(403).json({ message: "Access denied" });
  }

  const conversationObjectId = new Types.ObjectId(String(id));
  const senderObjectId = new Types.ObjectId(String(userId));

  const msg = await MessageModel.create({
    conversationId: conversationObjectId,
    sender: senderObjectId,
    text: text.trim(),
    readBy: [senderObjectId],
  });

  await ConversationModel.findByIdAndUpdate(
    id,
    { lastMessage: msg._id },
    { new: true },
  );

  const fullMsg = await MessageModel.findById(msg._id).populate(
    "sender",
    "username email avatarURL",
  );

  return res.status(201).json(fullMsg);
};

export const createConversationController: RequestHandler = async (
  req,
  res,
) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user!._id;

  const { participantId } = req.body as { participantId?: string };

  if (!participantId) {
    return res.status(400).json({ message: "participantId is required" });
  }

  if (String(participantId) === String(userId)) {
    return res.status(400).json({ message: "You cannot chat with yourself" });
  }

  const myObjectId = new Types.ObjectId(String(userId));
  const participantObjectId = new Types.ObjectId(String(participantId));

  const otherUser = await User.findById(participantObjectId);
  if (!otherUser) {
    return res.status(404).json({ message: "User not found" });
  }

  let conv = await ConversationModel.findOne({
    participants: { $all: [myObjectId, participantObjectId] },
  })
    .populate("participants", "username email avatarURL fullName")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username email avatarURL" },
    });

  if (!conv) {
    const created = await ConversationModel.create({
      participants: [myObjectId, participantObjectId],
    });

    conv = await ConversationModel.findById(created._id)
      .populate("participants", "username email avatarURL fullName")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username email avatarURL" },
      });
  }

  return res.status(201).json(conv);
};

export const getUserByUsernameController: RequestHandler<{
  username: string;
}> = async (req, res) => {
  const username = req.params.username;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  const found = await User.findOne({ username }).select(
    "username email fullName avatarURL about website createdAt",
  );

  if (!found) return res.status(404).json({ message: "User not found" });

  res.json(found);
};

export const searchUsersController: RequestHandler = async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) return res.json([]);

  const users = await User.find({
    username: { $regex: q, $options: "i" },
  })
    .select("username avatarURL")
    .limit(20);

  return res.json(users);
};
