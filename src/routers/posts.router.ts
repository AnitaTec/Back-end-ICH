import { Router } from "express";
import authenticate from "../db/middlewares/authenticate.js";
import {
  createPostController,
  getMyPostsController,
  getPostsByUsernameController,
  getExplorePostsController,
  getFeedPostsController,
  getPostByIdController,
  deletePostController,
} from "../controllers/posts.controller.js";

const postsRouter = Router();

postsRouter.get("/feed", authenticate, getFeedPostsController);
postsRouter.get("/explore", authenticate, getExplorePostsController);

postsRouter.post("/", authenticate, createPostController);
postsRouter.get("/me", authenticate, getMyPostsController);
postsRouter.get("/user/:username", authenticate, getPostsByUsernameController);

postsRouter.delete("/:id", authenticate, deletePostController);
postsRouter.get("/:id", authenticate, getPostByIdController);

export default postsRouter;
