import User from "../db/models/User.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { RegisterPayload, LoginPayload } from "../shemas/auth.schemas.js";
import HttpError from "../utils/HttpError.js";

import { UserDocument } from "../db/models/User.js";

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

type UserFindResult = UserDocument | null;

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
  };
}
export const registerUser = async (
  payload: RegisterPayload,
): Promise<UserDocument> => {
  const user: UserFindResult = await User.findOne({ email: payload.email });
  if (user) throw HttpError(409, "Email already exists");

  const existingUsername = await User.findOne({ username: payload.username });
  if (existingUsername) throw HttpError(409, "Username already exists");
  const hashedPassword: string = await bcrypt.hash(payload.password, 10);

  return User.create({ ...payload, password: hashedPassword });
};

export const loginUser = async (
  payload: LoginPayload,
): Promise<LoginResult> => {
  const query: Array<Partial<{ email: string; username: string }>> = [];
  if (payload.email) query.push({ email: payload.email });
  if (payload.username) query.push({ username: payload.username });

  const user: UserFindResult = await User.findOne({ $or: query });

  if (!user) throw HttpError(401, "User not found");
  const passwordCompare: boolean = await bcrypt.compare(
    payload.password,
    user.password,
  );
  if (!passwordCompare) throw HttpError(401, "Password invalid");

  const tokenPayload = { id: user._id };

  const accessToken: string = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken: string = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: "7d",
  });

  await User.findByIdAndUpdate(user._id, { accessToken, refreshToken });

  return {
    accessToken,
    refreshToken,
    user: {
      email: user.email,
    },
  };
};
