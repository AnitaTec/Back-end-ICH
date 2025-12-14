import { RequestHandler } from "express";
import User from "../db/models/User.js";
import Posts from "../db/models/Posts.js";
import { AuthRequest } from "../types/interfaces.js";

export const createPostController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const { image, caption } = (req.body || {}) as {
    image?: string;
    caption?: string;
  };

  if (!image || typeof image !== "string") {
    return res.status(400).json({ message: "image is required" });
  }

  if (!image.startsWith("data:image/")) {
    return res.status(400).json({ message: "image must be base64 dataURL" });
  }

  const created = await Posts.create({
    owner: userId,
    image,
    caption: typeof caption === "string" ? caption : "",
  });

  const full = await Posts.findById(created._id).populate(
    "owner",
    "username email avatarURL fullName",
  );

  return res.status(201).json(full);
};

export const getMyPostsController: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const posts = await Posts.find({ owner: userId })
    .sort({ createdAt: -1 })
    .populate("owner", "username email avatarURL fullName");

  return res.json(posts);
};

export const getPostsByUsernameController: RequestHandler = async (
  req,
  res,
) => {
  const { username } = req.params as { username: string };

  if (!username) {
    return res.status(400).json({ message: "username is required" });
  }

  const user = await User.findOne({ username }).select("_id username email");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const posts = await Posts.find({ owner: user._id })
    .sort({ createdAt: -1 })
    .populate("owner", "username email avatarURL fullName");

  return res.json(posts);
};

export const getExplorePostsController: RequestHandler = async (req, res) => {
  const limitRaw = Number(req.query.limit || 24);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 6), 60)
    : 24;

  const posts = await Posts.aggregate([
    { $match: { image: { $exists: true, $ne: "" } } },
    { $sample: { size: limit } },
    { $project: { image: 1, caption: 1, createdAt: 1 } },
  ]);

  return res.json(posts);
};
