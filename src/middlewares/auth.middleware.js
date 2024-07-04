import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


export const verifyJWT = asyncHandler(async (req, _, next) => {

  try {
    // get token data
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request")
    };

    // decrypt token by using jwt methods
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    if (!decodedToken) { throw new ApiError(500, "Token is unidentified") };

    // get  user data
    const user = User.findById(decodedToken?._id).select(" -password -refreshToken");
    if (!user) { throw new ApiError(401, "Invalid access Token") };

    // send data in request and pass rout
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token");
  }

})