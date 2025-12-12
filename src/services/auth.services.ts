import User, { UserDocument } from "../db/models/User.js";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import { RegisterPayload, LoginPayload } from "../shemas/auth.schemas.js";
import HttpError from "../utils/HttpError.js";
import { verifyToken } from "../utils/jwt.js";
import creteTokens from "../utils/creteTokens.js";
export type UserFindResult = UserDocument | null;

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
  };
}

type UserQuery =
  | Partial<{
      _id?: string | Types.ObjectId;
      email: string;
      username: string;
      refreshToken: string;
    }>
  | {
      $or: Array<
        Partial<{
          _id?: string;
          email: string;
          username: string;
          refreshToken: string;
        }>
      >;
    };

export const findUser = (query: UserQuery): Promise<UserFindResult> => {
  return User.findOne(query);
};

export const registerUser = async (
  payload: RegisterPayload,
): Promise<UserDocument> => {
  const user: UserFindResult = await findUser({ email: payload.email });
  if (user) throw HttpError(409, "Email already exists");

  const existingUsername = await User.findOne({ username: payload.username });
  if (existingUsername) throw HttpError(409, "Username already exists");
  const hashedPassword: string = await bcrypt.hash(payload.password, 10);

  const created = await User.create({ ...payload, password: hashedPassword });

  return created;
};

export const loginUser = async (
  payload: LoginPayload,
): Promise<LoginResult> => {
  const query: Array<Partial<{ email: string; username: string }>> = [];
  if (payload.email) query.push({ email: payload.email });
  if (payload.username) query.push({ username: payload.username });

  if (!query.length) throw HttpError(400, "Email or username is required");

  const user: UserFindResult = await findUser(
    query.length > 1 ? { $or: query } : query[0]!,
  );

  if (!user) throw HttpError(401, "User not found");
  const passwordCompare: boolean = await bcrypt.compare(
    payload.password,
    user.password,
  );
  if (!passwordCompare) throw HttpError(401, "Password invalid");

  const { accessToken, refreshToken } = creteTokens(user._id);

  await User.findByIdAndUpdate(user._id, { accessToken, refreshToken });

  return {
    accessToken,
    refreshToken,
    user: { email: user.email },
  };
};

export const refreshUser = async (
  refreshTokenOld: string,
): Promise<LoginResult> => {
  const { error } = verifyToken(refreshTokenOld);
  if (error) throw HttpError(401, error.message);
  const user: UserFindResult = await findUser({
    refreshToken: refreshTokenOld,
  });
  if (!user) throw HttpError(401, "User not found");

  const { accessToken, refreshToken } = creteTokens(user._id);
  await User.findByIdAndUpdate(user._id, { accessToken, refreshToken });
  return {
    accessToken,
    refreshToken,
    user: {
      email: user.email,
    },
  };
};

export type UpdateUserPayload = {
  username?: string;
  avatarURL?: string;
  about?: string;
  website?: string;
};

export const updateUserProfile = async (
  id: Types.ObjectId,
  payload: UpdateUserPayload,
): Promise<UserDocument> => {
  const updateData: Partial<UpdateUserPayload> = {};

  if (payload.username) {
    const existing = await User.findOne({
      username: payload.username,
      _id: { $ne: id },
    });
    if (existing) throw HttpError(409, "Username already exists");
    updateData.username = payload.username;
  }

  if (payload.avatarURL) {
    updateData.avatarURL = payload.avatarURL;
  }

  if (payload.about !== undefined) {
    updateData.about = payload.about;
  }
  if (payload.website !== undefined) {
    updateData.website = payload.website;
  }

  const updated = await User.findByIdAndUpdate(id, updateData, { new: true });

  if (!updated) throw HttpError(404, "User not found");

  return updated;
};

export const logoutUser = async (user: UserDocument) => {
  await User.findByIdAndUpdate(user._id, {
    accessToken: null,
    refreshToken: null,
  });
  return true;
};
