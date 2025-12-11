import { Request, Response, RequestHandler } from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
} from "../services/auth.services.js";

import validateBody from "../utils/validateBody.js";

import { registerSchema, loginSchema } from "./../shemas/auth.schemas.js";
import { creteTokens } from "../services/auth.services.js";
import { AuthRequest } from "../types/interfaces.js";

export const registerController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  //@ts-expect-error fix
  validateBody(registerSchema, req.body);
  await registerUser(req.body);
  res.status(201).json({
    message: "User registered successfully",
  });
};

export const loginController: RequestHandler = async (req, res) => {
  // @ts-expect-error fix
  validateBody(loginSchema, req.body);
  const result = await loginUser(req.body);
  res.json(result);
};

export const getCfurrentController = async (
  req: AuthRequest,
  res: Response,
) => {
  const { accessToken, refreshToken } = creteTokens(req.user._id);
  res.json({
    accessToken,
    refreshToken,
    user: {
      email: req.user.email,
      fullname: req.user.fullName,
      username: req.user.username,
      avatarURL: req.user.avatarURL,
    },
  });
};

export const updateProfileController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { username, avatar } = req.body as {
      username?: string;
      avatar?: string;
    };

    const payload: { username?: string; avatarURL?: string } = {};

    if (username) payload.username = username;

    if (avatar) payload.avatarURL = avatar;

    const updatedUser = await updateUserProfile(authReq.user._id, payload);

    res.json({
      user: {
        email: updatedUser.email,
        fullname: updatedUser.fullName,
        username: updatedUser.username,
        avatarURL: updatedUser.avatarURL,
      },
    });
  } catch (error) {
    const err = error as Error;

    console.error(" ", err.message);

    res.status(500).json({
      message: "Can not update user data ",
      error: err.message,
    });
  }
};
