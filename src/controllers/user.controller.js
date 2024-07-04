import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
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

    user, refreshToken = refreshToken;
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
  console.log("req.body : \n", req.body);

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

  console.log(`\n *****Cloudinary avatar Store here*****\n`)
  console.log(`\t\t req.files \n ${req.body.files}`)
  console.log(`\n *****Cloudinary avatar Store here Part 2*****\n`)
  console.log(`\t\t req.files \n ${req.files.avatar}`)


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

  console.log(`\n *****Cloudinary Response Data of avatar****\n`)
  console.log(`\t\t req.files \n ${avatar}`)

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

  console.log(`\n *****Mongo DB User Created data about*****\n`)
  console.log(`  ${user}`)

  // check user is successfully created or not and also remove unwanted data from the response 
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  };

  console.log(`\n *****Mongo DB User Created *****\n`)
  console.log(`  ${createdUser}`)


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
  const option = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
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
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      }
    },
    {
      new: true
    }
    //* new: true -->  By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
  );

  //!  cleared cookie data and response to  user
  const option = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(
      new ApiResponse(200, {}, "User logged Out")
    );

})



export {
  registerUser,
  loginUser,
  logoutUser

};