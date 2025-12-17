import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../db/models/User.js";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const requestPasswordReset = async (identifier: string) => {
  const value = String(identifier || "").trim();
  if (!value) return { ok: true };

  const user = await User.findOne({
    $or: [{ email: value.toLowerCase() }, { username: value }],
  });

  if (!user) return { ok: true };

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  const isProd = process.env.NODE_ENV === "production";

  return {
    ok: true,
    ...(isProd ? {} : { resetToken: token }),
  };
};

export const confirmPasswordReset = async (
  token: string,
  newPassword: string,
) => {
  const t = String(token || "").trim();
  const p = String(newPassword || "");

  if (!t) return { ok: false, status: 400, message: "token is required" };
  if (p.length < 6)
    return { ok: false, status: 400, message: "Minimum 6 characters required" };

  const tokenHash = hashToken(t);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user)
    return { ok: false, status: 400, message: "Invalid or expired token" };

  user.password = await bcrypt.hash(p, 10);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;

  user.accessToken = "";
  user.refreshToken = "";

  await user.save();

  return { ok: true };
};
