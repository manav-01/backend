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
  // console.log(req.body);

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

  const existUser = User.findOne(
    {
      $or: [{ username }, { email }]
    }
  );

  if (existUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //! upload for image, avatar, check for avatar V14: 30.37 Logic building | Register controller
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0].path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  //! upload them to cloudinary, avatar   --> it takes time to upload so add await here
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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

  // check user is successfully created or not and also remove unwanted data from the response 
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  };

  // ! return response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully.")
  )

});





export { registerUser };