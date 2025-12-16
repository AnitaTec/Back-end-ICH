import { RequestHandler } from "express";
import { Types } from "mongoose";
import Posts from "../db/models/Posts.js";
import { AuthRequest } from "../types/interfaces.js";

type PopulatedUser = {
  _id: Types.ObjectId;
  username?: string;
  email?: string;
  avatarURL?: string;
  fullName?: string;
};

type PostComment = {
  _id: Types.ObjectId;
  user: Types.ObjectId | PopulatedUser;
  text: string;
  createdAt: Date;
  likes?: Array<Types.ObjectId>;
  likesCount?: number;
};

type PostDocLike = {
  _id: Types.ObjectId;
  owner: Types.ObjectId | PopulatedUser;
  image: string;
  caption: string;
  likes?: Array<Types.ObjectId>;
  likesCount?: number;
  comments?: Array<PostComment>;
  createdAt?: Date;
  updatedAt?: Date;
  toObject: () => unknown;
};

const strId = (v: unknown) => String(v ?? "");
const isValidObjectId = (v: string) => Boolean(v && Types.ObjectId.isValid(v));
const toObjectId = (v: unknown) => new Types.ObjectId(String(v));

const getAuthUserId = (req: unknown) => {
  const authReq = req as AuthRequest;
  return authReq.user?._id ? String(authReq.user._id) : "";
};

const getCommentById = (post: PostDocLike, commentId: string) => {
  const list = Array.isArray(post.comments) ? post.comments : [];
  return list.find((c) => strId(c?._id) === String(commentId));
};

export const getPostViewController: RequestHandler = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authorized" });

  const { id } = req.params as { id: string };

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "invalid post id" });
  }

  const post = (await Posts.findById(id)
    .populate("owner", "username email avatarURL fullName")
    .populate(
      "comments.user",
      "username email avatarURL fullName",
    )) as unknown as PostDocLike | null;

  if (!post) return res.status(404).json({ message: "Post not found" });

  const likesArr = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = likesArr.some((x) => strId(x) === String(userId));

  return res.json({ ...post.toObject(), isLiked });
};

export const likePostController: RequestHandler = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authorized" });

  const { id } = req.params as { id: string };
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "invalid post id" });
  }

  const uid = toObjectId(userId);

  await Posts.updateOne(
    { _id: id, likes: { $ne: uid } },
    { $addToSet: { likes: uid }, $inc: { likesCount: 1 } },
  );

  const post = (await Posts.findById(id).select("likesCount")) as unknown as {
    likesCount?: number;
  } | null;

  return res.json({
    liked: true,
    likesCount: Number(post?.likesCount || 0),
  });
};

export const unlikePostController: RequestHandler = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authorized" });

  const { id } = req.params as { id: string };
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "invalid post id" });
  }

  const uid = toObjectId(userId);

  await Posts.updateOne(
    { _id: id, likes: uid },
    { $pull: { likes: uid }, $inc: { likesCount: -1 } },
  );

  await Posts.updateOne(
    { _id: id, likesCount: { $lt: 0 } },
    { $set: { likesCount: 0 } },
  );

  const post = (await Posts.findById(id).select("likesCount")) as unknown as {
    likesCount?: number;
  } | null;

  return res.json({
    liked: false,
    likesCount: Number(post?.likesCount || 0),
  });
};

export const addCommentController: RequestHandler = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authorized" });

  const { id } = req.params as { id: string };
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "invalid post id" });
  }

  const text = String((req.body as { text?: unknown })?.text || "").trim();
  if (!text) return res.status(400).json({ message: "text is required" });

  const comment = {
    user: toObjectId(userId),
    text,
    createdAt: new Date(),
    likes: [],
    likesCount: 0,
  };

  const updated = (await Posts.findByIdAndUpdate(
    id,
    { $push: { comments: comment } },
    { new: true },
  ).populate(
    "comments.user",
    "username email avatarURL fullName",
  )) as unknown as PostDocLike | null;

  if (!updated) return res.status(404).json({ message: "Post not found" });

  const list = Array.isArray(updated.comments) ? updated.comments : [];
  const created = list[list.length - 1];

  if (!created) {
    return res.status(500).json({ message: "comment was not created" });
  }

  return res.json({
    comment: {
      _id: created._id,
      text: created.text,
      createdAt: created.createdAt,
      likes: Array.isArray(created.likes) ? created.likes : [],
      likesCount: Number(created.likesCount || 0),
      user: created.user,
    },
  });
};

export const likeCommentController: RequestHandler = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authorized" });

  const { id, commentId } = req.params as { id: string; commentId: string };

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "invalid post id" });
  }

  if (!isValidObjectId(commentId)) {
    return res.status(400).json({ message: "invalid comment id" });
  }

  const uid = toObjectId(userId);
  const cid = toObjectId(commentId);

  await Posts.updateOne(
    { _id: id, "comments._id": cid, "comments.likes": { $ne: uid } },
    {
      $addToSet: { "comments.$.likes": uid },
      $inc: { "comments.$.likesCount": 1 },
    },
  );

  const post = (await Posts.findById(id).select(
    "comments",
  )) as unknown as PostDocLike | null;

  if (!post) return res.status(404).json({ message: "Post not found" });

  const c = getCommentById(post, commentId);
  return res.json({ likesCount: Number(c?.likesCount || 0) });
};

export const unlikeCommentController: RequestHandler = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authorized" });

  const { id, commentId } = req.params as { id: string; commentId: string };

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "invalid post id" });
  }

  if (!isValidObjectId(commentId)) {
    return res.status(400).json({ message: "invalid comment id" });
  }

  const uid = toObjectId(userId);
  const cid = toObjectId(commentId);

  await Posts.updateOne(
    { _id: id, "comments._id": cid, "comments.likes": uid },
    {
      $pull: { "comments.$.likes": uid },
      $inc: { "comments.$.likesCount": -1 },
    },
  );

  const post = (await Posts.findById(id).select(
    "comments",
  )) as unknown as PostDocLike | null;

  if (!post) return res.status(404).json({ message: "Post not found" });

  const c = getCommentById(post, commentId);

  const likesCount = Number(c?.likesCount || 0);
  if (likesCount < 0) {
    await Posts.updateOne(
      { _id: id, "comments._id": cid },
      { $set: { "comments.$.likesCount": 0 } },
    );
    return res.json({ likesCount: 0 });
  }

  return res.json({ likesCount });
};
