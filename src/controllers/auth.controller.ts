import { Request, Response, RequestHandler } from "express";
import { registerUser, loginUser } from "../services/auth.services.js";

import validateBody from "../utils/validateBody.js";

import { registerSchema, loginSchema } from "./../shemas/auth.schemas.js";

export const registerController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  validateBody(registerSchema, req.body);
  await registerUser(req.body);
  res.status(201).json({
    message: "User registered successfully",
  });
};

export const loginController: RequestHandler = async (req, res) => {
  validateBody(loginSchema, req.body);
  const result = await loginUser(req.body);
  res.json(result);
};
