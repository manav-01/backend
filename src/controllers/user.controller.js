import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { OPTION } from "../constants.js"
import mongoose  from "mongoose"
// Demo Code and initial testing for write
// const registerUser = asyncHandler(async (req, res) => {
//   await res.status(200).json(
//     {
//       message: "ok"
//     }
//   );
// });

// ? Define Access and refresh Token methods
const generateAccessAndRefreshToken = async (userId) => {

  try {

    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    // user.save()  is save what you give and already exist data it will be kick In. so we need to "remove" before save.


    user.save({ validationBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {

    throw new ApiError(500, error?.message || "Something went wrong while generating refresh and Access Token");

  }
}


const registerUser = asyncHandler(async (req, res) => {

  // ? Algorithm
  // get user details from the frontend 
  // validation not empty
  // check if user already exists: username and email
  // upload for image, avatar, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in DB
  // remove password and refreshToken fielder from the response
  // check for user creation
  // return response


  // ! get user details from the frontend 

  const { fullName, email, username, password } = req.body;
  // console.log("req.body : \n", req.body);

  // ! validation not empty

  // * Method 1 check validation by using if() condition

  // if (fullName === "") {
  //   throw new ApiError(400, "Full Name is required ")
  // }

  // * Method 2 check validation by using Array.some() method
  // if (
  //   [fullName, email, username, password].some((field) => field?.trim() === "")) {

  //   throw new ApiError(400, "All fields are required")
  // }

  // * Method 3 check validation by using Array method
  // Method 3 step 1: check for  the empty fields
  const emptyFields = Object.keys(req.body).filter((field) => !req.body[field]);

  // Method 3 step 2: make error and throw it.
  if (emptyFields.length > 0) {
    const errorMessage = `field${emptyFields.length > 1 ? "s" : ""} ${emptyFields.join(' & ')} ${emptyFields.length > 1 ? 'are' : 'is'} required`;

    throw new ApiError(400, errorMessage);
  }

  // ! check if user already exists: username and email

  // ! checks and verification or requirements check on Top and then last phase whe all thing work properly and verified base on over requirement then we will add data in Database. 

  const existUser = await User.findOne(
    {
      $or: [{ username }, { email }]
    }
  );

  if (existUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //! upload for image, avatar, check for avatar V14: 30.37 Logic building | Register controller
  //? handle this another way Error: Cannot read properties of undefined 
  // * here we write `req.files` instant of `req.body.files`.
  const avatarLocalPath = (req.files?.avatar && req.files.avatar.length > 0) ? req.files.avatar[0].path : null;
  const coverImageLocalPath = (req.files?.coverImage && req.files.coverImage.length > 0) ? req.files.coverImage[0].path : null;

  // console.log(`\n *****Cloudinary avatar Store here*****\n`)
  // console.log(`\t\t req.files \n ${req.body.files}`)
  // console.log(`\n *****Cloudinary avatar Store here Part 2*****\n`)
  // console.log(`\t\t req.files \n ${req.files.avatar}`)


  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }
  // if (!avatarLocalPath) {
  //   console.log("Avatar file is not uploaded or not accessible.");
  // }
  // if (!coverImageLocalPath) {
  //   console.log("Cover image file is not uploaded or not accessible.");
  // }

  //! upload them to cloudinary, avatar   --> it takes time to upload so add await here
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log(`\n *****Cloudinary Response Data of avatar****\n`)
  // console.log(`\t\t req.files \n ${avatar}`)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  };

  //! create user object - create entry in DB

  // DB might be in another continent So, use "await"
  const user = await User.create(
    {
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
    }
  );

  // console.log(`\n *****Mongo DB User Created data about*****\n`)
  // console.log(`  ${user}`)

  // check user is successfully created or not and also remove unwanted data from the response 
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  };

  // console.log(`\n *****Mongo DB User Created *****\n`)
  // console.log(`  ${createdUser}`)


  // ! return response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully.")
  )

});


const loginUser = asyncHandler(async (req, res) => {

  // ? LoginUser Algorithm steps
  // request body --> data
  // username and email required
  // find the user or email in DB
  // password and check
  // access and refresh token
  // send cookie

  // ! request body --> data

  const { email, username, password } = req.body;



  // console.log(req.body);

  // password is required
  if (!password) {
    throw new ApiError(400, "Password field is required");
  }

  // username and email required
  if (!(username || email)) {
    throw new ApiError(400, "Either username or email is required");
  }

  // Find out user in DB base on "username" and "email"
  const user = await User.findOne(
    {
      $or: [{ username }, { email }]
    }
  )

  // if user is not exist
  if (!user) {
    throw new ApiError(404, "User does not exist in DataBase");
  }


  // ? V 16 15.40 Access Refresh Token, Middleware and cookies in Backend
  // ! NOTE: Custom method is store in "user". which we get by from the dataBase
  // ! And, Mongoose methods is have to "User" , because "User" is mongoose Object.

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // we serval time use and create "AccessToken" and "GenerateToken"., so we make separate file of methods.
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  // make sure in file: app.js, it apply cookieParser() in middleware like : "app.use(cookieParser())"; 

  // V16 27.34 : if DB call is not expensive then update user value from the DB, otherwise update "user" field manually.

  const loggedInUser = await User.findById(user._id)
    .select(" -password -refreshToken "); // remove this data

  // ! send cookie
  // 29.11 Note: Cookie is updated by frontend side, if it want to be pretend, that case we need below configuration option, then only server side, cookie value changed.(in frontend side you can see but not modifies)


  return res
    .status(200)
    .cookie("accessToken", accessToken, OPTION)
    .cookie("refreshToken", refreshToken, OPTION)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken,
        },
        "User Logged in successfully"
      )
    );


})


const logoutUser = asyncHandler(async (req, res) => {

  // * Algorithm of Logout user 
  // make own middleware and ejected in route
  // help of middleware get data of user then,
  // find user base on _id
  // update user data on Database 
  //  cleared cookie data and response to  user

  // ! find user base on _id and Update
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      }
    },
    {
      new: true
    }
    //* new: true -->  By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
  );


  //!  cleared cookie data and response to  user

  return res
    .status(200)
    .clearCookie("accessToken", OPTION)
    .clearCookie("refreshToken", OPTION)
    .json(
      new ApiResponse(200, {}, "User logged Out")
    );

})



// *create refresh access token from the User to update token by user
const refreshAccessToken = asyncHandler(async (req, res) => {

  try {
    // Algorithm
    // get refresh access token from the User to update token by user
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!incomingRefreshToken) { throw new ApiError(401, "Unauthorized request") };
    
    // decode Token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find the  user in database
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token ");
    };
    // console.log("Hello" ,incomingRefreshToken ===  user?.refreshToken)

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token id expired or used")
    }

    // generate new access Token
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    // Send the response
    return res
      .status(200)
      .cookie("accessToken", accessToken, OPTION)
      .cookie("refresh", newRefreshToken, OPTION)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }


});


//* update password on Database

const changeCurrentPassword = asyncHandler(async (req, res) => {

  try {
    // get data from the body
    // also for user identification for add "middleware" 
    const { oldPassword, newPassword } = req.body;
    const emptyFields = Object.keys(req.body).filter((field) => !req.body[field]);
    if (emptyFields.length > 0) {
      const errorMessage = `field${emptyFields.length > 1 ? "s" : ""} ${emptyFields.join(' & ')} ${emptyFields.length > 1 ? 'are' : 'is'} required`;
      throw new ApiError(400, errorMessage);
    }

    // check user given old password is true or not.
    const user = await User.findById(req.user?._id);
    if (!user) { throw new ApiError(400, "user is not found"); };
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) { throw new ApiError(401, error?.message || "Invalid old password") }

    // save new password in Database
    user.password = newPassword;
    await user.save({ validationBeforeSave: false })

    // send response
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully."))



  } catch (error) {
    throw new ApiError(401, error?.message || "There is an error in changing current password");
  }


})

// get Current user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse (200, req.user, "current user fetched successfully."));
})

// * Update account details
const updateAccountDetails = asyncHandler(async (req, res) => {

  // get Data From the request
  // make sure add middleware in "endpoint"
  const { email, fullName } = req.body;
  if (!email || !fullName) { throw new ApiError(400, "All fields are required") };

  // update new data in Database
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName, email }
    },
    { new: true }

  )
    .select(" -password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully. "));


});

// Todo: Production level advised : V18 : Writing update controllers for user | Backend with JS :: when upload file or perform height task so for that task for make different file of `controller` and `endpoints` --> which is more better approach  to handle that. Why reason : V18 Time : 23.36

// * Update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {

  try {
    // console.log(req.file,req.user._id,req.cookies)
    // Local Path details
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) { throw new ApiError(400, "Error while uploading on avatar"); }

     // upload on Cloudinary
    // TODO: delete old image - assignment
    // delete old image
    await deleteOnCloudinary(req.user?.avatar);

    // Update Database
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { avatar: avatar.url }
      },
      { new: true }
    )
      .select("-password -refreshToken");

    // send response
    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "There is an error in updating Avatar");

  }
})

// * update user Cover Image

const updateUserCoverImage = asyncHandler(async (req, res) => {

  // get path of image
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }

  
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) { throw new ApiError(400, "Error while uploading on coverImage"); }

  // upload on Cloudinary
  // TODO: delete old image - assignment
  // delete old image
  await deleteOnCloudinary(req.user?.coverImage);

  // Update Database
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password -refreshToken");

  // respond response
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover image updated successfully")
    )



});

// * get User Channel Profile details
const getUserChannelProfile = asyncHandler(async (req, res) => {

  // identified who is user from the url
  const { username } = req.params;

  if (!username.trim()) { throw new ApiError(400, "username is missing"); };

  // Apply Aggregation : get data from the DB and math user and get there data

  const channel = await User.aggregate(
    [
      {
        $match: { username: username?.toLowerCase() },
      },
      {
        $lookup: // lookup is used to join DB
        {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $lookup:
        {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo"
        }
      },
      {
        $addFields: // Adding new Fields
        {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo"
          },
          isSubscribed:
          {
            $cond:
            {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project:// which fields you get in response
        {
          fullName: 1,
          username: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
        }
      }
    ]
  );

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    )


});

// * Get Watch History

const getWatchHistory = asyncHandler(async (req, res) => {

  // V21 6.21 (How to write sub pipelines and routes) NOTE: when you get user id from the request like `req.user._id` , there actually you get _id in form of "String" and then you give that string `User` by mongoose , there mongoose cover `_id` sting data into BSON Object id (An ObjectID is a 12-byte Field Of BSON type) which actually Story in DB.
  //NOTE:  but, when use user Aggregation pipeline there you need to give object id for math so backend developer need to convert that 
  //NOTE:  Convert : `new mongoose.Types.ObjectId(req.user._id)`
  // console.log("Hello This is a Histrory console")
  const user = await User.aggregate([
    {
      $match: { _id : new mongoose.Types.ObjectId(req.user._id)}

    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
                // else `owner: { $arrayElemAt: [ <array> ""$owner"", <idx> "0" ] }`
              }
            }
          }
        ]
      }
    }
  ]);


  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    )


});



export {
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
};