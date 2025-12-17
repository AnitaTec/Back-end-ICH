import { RequestHandler } from "express";
import {
  requestPasswordReset,
  confirmPasswordReset,
} from "../services/passwordReset.service.js";

export const resetRequestController: RequestHandler = async (req, res) => {
  const { identifier } = (req.body || {}) as { identifier?: string };
  const result = await requestPasswordReset(String(identifier || ""));
  return res.json(result);
};

export const resetConfirmController: RequestHandler = async (req, res) => {
  const { token, password } = (req.body || {}) as {
    token?: string;
    password?: string;
  };

  const result = await confirmPasswordReset(
    String(token || ""),
    String(password || ""),
  );

  if (!result.ok) {
    return res
      .status(result.status || 400)
      .json({ message: result.message || "Error" });
  }

  return res.json({ ok: true });
};
