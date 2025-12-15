import { Router } from "express";
import authenticate from "../db/middlewares/authenticate.js";
import {
  getCounts,
  isFollowing,
  follow,
  unfollow,
  getFollowers,
  getFollowing,
} from "../controllers/followController.js";

const router = Router();

router.get("/:userId/counts", authenticate, getCounts);
router.get("/:userId/is-following", authenticate, isFollowing);

router.post("/:userId", authenticate, follow);
router.delete("/:userId", authenticate, unfollow);

router.get("/:userId/followers", authenticate, getFollowers);
router.get("/:userId/following", authenticate, getFollowing);

export default router;
