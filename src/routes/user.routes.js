import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

/// create route
const router = Router();

// https://expressjs.com/en/resources/middleware/multer.html
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

// route of refresh Token
router.route("/refresh-token").post(refreshAccessToken);

// route of change password
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// get current user details
router.route("/current-user").get(verifyJWT, getCurrentUser);

// route for account update
// patch() --> use for perticular data or element to update or change purpose. 
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// route for change avatar
// upload.single("avatar") --> is multer middleware which use to file transfer activity.
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// route for change coverImage
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// route for get data of channel basse on username
// /:`username` --> use this name in function which pass in params
// V21: 26:20 (How to write sub pipelines and routes)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

// route for watch history data
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;