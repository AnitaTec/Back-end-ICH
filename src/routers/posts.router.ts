import { Router } from "express";
import authenticate from "../db/middlewares/authenticate.js";
import {
  createPostController,
  getMyPostsController,
  getPostsByUsernameController,
  getExplorePostsController,
} from "../controllers/posts.controller.js";

const postsRouter = Router();

postsRouter.get("/explore", authenticate, getExplorePostsController); // ✅ первым
postsRouter.post("/", authenticate, createPostController);
postsRouter.get("/me", authenticate, getMyPostsController);
postsRouter.get("/user/:username", authenticate, getPostsByUsernameController);

export default postsRouter;
