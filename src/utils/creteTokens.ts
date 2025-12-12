import jwt from "jsonwebtoken";
import { Types } from "mongoose";

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not define in environment variables");
}

const creteTokens = (id: Types.ObjectId) => {
  const payload = { id };

  // accessToken живет 15 минут
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

  // refreshToken живет 7 дней
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

export default creteTokens;
