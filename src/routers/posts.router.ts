import { Router } from "express";
import authenticate from "../db/middlewares/authenticate.js";

// ✅ обычные посты (как было, но БЕЗ like/comment/view)
import {
  createPostController,
  getMyPostsController,
  getPostsByUsernameController,
  getExplorePostsController,
  getFeedPostsController,
  getPostByIdController,
  deletePostController,
} from "../controllers/posts.controller.js";

// ✅ likes/comments/view (НОВЫЙ файл)
import {
  getPostViewController,
  likePostController,
  unlikePostController,
  addCommentController,
  likeCommentController,
  unlikeCommentController,
} from "../controllers/posts.interactions.controller.js";

const postsRouter = Router();

postsRouter.get("/feed", authenticate, getFeedPostsController);
postsRouter.get("/explore", authenticate, getExplorePostsController);

postsRouter.post("/", authenticate, createPostController);
postsRouter.get("/me", authenticate, getMyPostsController);
postsRouter.get("/user/:username", authenticate, getPostsByUsernameController);

postsRouter.post("/:id/like", authenticate, likePostController);
postsRouter.post("/:id/unlike", authenticate, unlikePostController);

postsRouter.post("/:id/comments", authenticate, addCommentController);
postsRouter.post(
  "/:id/comments/:commentId/like",
  authenticate,
  likeCommentController,
);
postsRouter.post(
  "/:id/comments/:commentId/unlike",
  authenticate,
  unlikeCommentController,
);

postsRouter.get("/:id/view", authenticate, getPostViewController);

postsRouter.delete("/:id", authenticate, deletePostController);
postsRouter.get("/:id", authenticate, getPostByIdController);

export default postsRouter;
