import { Router } from "express";
import authenticate from "../db/middlewares/authenticate.js";
import {
  getUserByUsernameController,
  searchUsersController,
} from "../controllers/auth.controller.js";

const usersRouter = Router();

usersRouter.get("/search", authenticate, searchUsersController);
usersRouter.get("/:username", authenticate, getUserByUsernameController);

export default usersRouter;
