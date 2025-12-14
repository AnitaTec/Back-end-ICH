import { Types } from "mongoose";
import { generateToken } from "./jwt.js";

const creteTokens = (id: Types.ObjectId) => {
  const payload = { id };

  const accessToken: string = generateToken(payload, { expiresIn: "15m" });

  const refreshToken: string = generateToken(payload, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

export default creteTokens;
