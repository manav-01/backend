import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

/// create route
const router = Router();

// route of register
router.route("/register").post(

  upload.fields(
    [
      {
        name: "avatar",
        maxCount: 1
      },
      {
        name: "coverImage",
        maxCount: 1
      }
    ]
  )
  ,
  registerUser
);

// route of login
router.route("/login").post(loginUser);

// ? Secure routes by using "verifyJWT" middleware
// roue of logout
router.route("/logout").post(verifyJWT, logoutUser);

export default router;