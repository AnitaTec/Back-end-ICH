import { RequestHandler } from "express";
import HttpError from "../../utils/HttpError.js";
import { verifyToken } from "../../utils/jwt.js";
import { findUser, UserFindResult } from "../../services/auth.services.js";

const authenticate: RequestHandler = async (req, res, next) => {
  const authorization = req.get("Authorization");
  if (!authorization) throw HttpError(401, "authorization header missing");

  const [bearer, token] = authorization.split(" ");
  if (bearer !== "Bearer")
    throw HttpError(401, "authorization header must have type Bearer");
  if (!token) throw HttpError(401, "authorization header must have token");

  const { data: payload, error } = verifyToken(token);

  if (error && error.message === "jwt expired")
    throw HttpError(401, "accessToken expired");

  if (error) throw HttpError(401, error.message);
  if (!payload) throw HttpError(401, "JWT payload not found");

  const user: UserFindResult = await findUser({ _id: payload.id });
  if (!user) throw HttpError(401, "User not found");

  req.user = user;
  next();
};

export default authenticate;
