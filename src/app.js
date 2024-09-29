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
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"

app.get("/", (req, res) => {
  res.send("Hello")
})

// https://stackoverflow.com/questions/15601703/difference-between-app-use-and-app-get-in-express-js
// router declaration
// http//:localhost:8000/api/v1/users/register
app.use("/api/v1/users", userRouter); // ! don't forget `/`api/v1/... 
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/likes", likeRouter);
export { app }
