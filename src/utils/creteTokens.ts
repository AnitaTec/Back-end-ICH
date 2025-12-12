import { Types } from "mongoose";

import { generateToken } from "./jwt.js";

const creteTokens = (id: Types.ObjectId) => {
  const accessToken: string = generateToken({ id }, { expiresIn: "15m" });
  const refreshToken: string = generateToken({ id }, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

export default creteTokens;
