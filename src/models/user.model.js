import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema(

  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true // it's help for Searching
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory:
      [{
        type: Schema.Types.ObjectId,
        ref: "Video"
      }]
    ,
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    refreshToken: {
      type: String,
    }
  }
  , { timestamps: true });

// Make Encrypt Password by using `pre` --> Middleware
userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) return next(); // make condition base on modification other wise every time reRender Code.

  this.password = await bcrypt.hash(this.password, 10);
  next();

});

// Make Custom methods 

// check password which given by user for checking with DB is (it true or false)
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Make Token and Function

// Generate Access token
// not required to make async function but here i use it.

// ? 'await' has no effect on the type of this expression.
// userSchema.methods.generateAccessToken = async function () {
//   return await jwt.sign(
//     {
//       _id: this._id,
//       email: this.email,
//       username: this.username,
//       fullName: this.fullName
//     },
//     process.env.ACCESS_TOKEN_SECRET,
//     {
//       expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
//     }
//   );
// }

// ? without async
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
}

// make refresh token --> it content less content because is refresh lot.

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
}



export const User = mongoose.model("User", userSchema)