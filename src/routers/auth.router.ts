import { Router } from "express";
import {
  registerController,
  loginController,
  getCfurrentController,
  updateProfileController,
  refreshController,
  logoutController,
} from "../controllers/auth.controller.js";

import authenticate from "../db/middlewares/authenticate.js";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.get("/current", authenticate, getCfurrentController);
authRouter.patch("/profile", authenticate, updateProfileController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", authenticate, logoutController);

export default authRouter;
