import { Router } from "express";
import {
  registerController,
  loginController,
  getCfurrentController,
  updateProfileController,
} from "../controllers/auth.controller.js";

import authenticate from "../db/middlewares/authenticate.js";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.get("/current", authenticate, getCfurrentController);
authRouter.patch("/profile", authenticate, updateProfileController);

export default authRouter;
