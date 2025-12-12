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
};

export const logoutController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;

  await logoutUser(authReq.user!);
  res.json({
    message: "Logout successfuly",
  });
};
