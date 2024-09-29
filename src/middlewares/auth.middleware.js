import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


export const verifyJWT = asyncHandler(async (req, _, next) => {

  try {
    // get token data
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");
    // console.log(`************
    //     Location File : "auth.middleware",\n
    //     Data : Token \n
    //     ${token} \n
    //   `);

    if (!token) {
      throw new ApiError(401, "Unauthorized request")
    };



    // decrypt token by using jwt methods
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // 




    if (!decodedToken) { throw new ApiError(500, "Token is unidentified") };

    // console.log(`************
    //   Location File : "auth.middleware",\n
    //   Data : Decoded Token \n
    //   ${decodedToken._id} \n
    // `);

    // get  user data
    const user = await User.findById(decodedToken?._id).select(" -password -refreshToken");
    if (!user) { throw new ApiError(401, "Invalid access Token") };

    // send data in request and pass rout
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token");
  }

})