import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Follow } from "../db/models/Follow.js";

type Params = { userId: string };

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

const getMeIdOr401 = (req: Request, res: Response) => {
  const meId = req.user?._id;
  if (!meId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return meId;
};

const pickPopulatedUser = (v: unknown) => {
  if (!v || typeof v !== "object") return null;
  const u = v as Record<string, unknown>;
  const id = u._id;
  if (!id) return null;
  return {
    _id: id,
    username: typeof u.username === "string" ? u.username : undefined,
    email: typeof u.email === "string" ? u.email : undefined,
    avatarURL: typeof u.avatarURL === "string" ? u.avatarURL : undefined,
  };
};

export const getCounts = async (req: Request<Params>, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const uid = new Types.ObjectId(userId);

    const [followers, following] = await Promise.all([
      Follow.countDocuments({ following: uid }),
      Follow.countDocuments({ follower: uid }),
    ]);

    return res.json({ followers, following });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const isFollowing = async (req: Request<Params>, res: Response) => {
  try {
    const meId = getMeIdOr401(req, res);
    if (!meId) return;

    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const uid = new Types.ObjectId(userId);

    const exists = await Follow.exists({
      follower: meId,
      following: uid,
    });

    return res.json({ isFollowing: Boolean(exists) });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const follow = async (req: Request<Params>, res: Response) => {
  try {
    const meId = getMeIdOr401(req, res);
    if (!meId) return;

    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (String(meId) === userId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const uid = new Types.ObjectId(userId);

    const exists = await Follow.exists({ follower: meId, following: uid });
    if (exists) return res.json({ followed: true });

    await Follow.create({ follower: meId, following: uid });

    return res.json({ followed: true });
  } catch (e: unknown) {
    const err = e as { code?: number } | null;
    if (err?.code === 11000) return res.json({ followed: true });
    return res.status(500).json({ message: "Server error" });
  }
};

export const unfollow = async (req: Request<Params>, res: Response) => {
  try {
    const meId = getMeIdOr401(req, res);
    if (!meId) return;

    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const uid = new Types.ObjectId(userId);

    await Follow.deleteOne({ follower: meId, following: uid });

    return res.json({ followed: false });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFollowers = async (req: Request<Params>, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const uid = new Types.ObjectId(userId);

    const rows = await Follow.find({ following: uid })
      .sort({ createdAt: -1 })
      .populate("follower", "username email avatarURL")
      .lean();

    const followers = rows
      .map((r) => pickPopulatedUser((r as Record<string, unknown>)?.follower))
      .filter(Boolean);

    return res.json({ followers });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFollowing = async (req: Request<Params>, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const uid = new Types.ObjectId(userId);

    const rows = await Follow.find({ follower: uid })
      .sort({ createdAt: -1 })
      .populate("following", "username email avatarURL")
      .lean();

    const following = rows
      .map((r) => pickPopulatedUser((r as Record<string, unknown>)?.following))
      .filter(Boolean);

    return res.json({ following });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
