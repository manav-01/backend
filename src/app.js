import express from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";
const app = express();

/*
? Structure of "app.js"
1st --> import important packages and library
2nd --> add or write important middleware things
3rd --> import and write Router and router logic

in last add --> export things (usually)
*/


// 2nd --> add or write important middleware things
// ? use() --> use for middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}))

// set limit of json file
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// router import
import userRouter from "./routes/user.routes.js"

app.get("/", (req, res) => {
  res.send("Hello")
})

// router declaration
app.use("/api/v1/users", userRouter); // ! don't forget `/`api/v1/... 

// http//:localhost:8000/api/v1/users/register

export { app }
