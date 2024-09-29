import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is not valid");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "user is not authorized");
    }

    try {
        const likeExist = await Like.findOne(
            { $and: [{ video: videoId }, { likeBy: req.user._id }] }
        );

        if (likeExist) {
            const result = await Like.deleteOne();
            if (!result) {
                throw new ApiError(500, "Error occur during delete dislike")
            }
            return res.status(200).json(new ApiResponse(200, { success: true }, "dislike successfully"))
        }

        const like = await Like.create({ video: videoId, likeBy: req.user._id });

        if (!like) {
            throw new ApiError(500, "Error occur during like video");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { success: true }, "like video successfully"));
    } catch (error) {
        throw new ApiError(500, "Error occur during toggle video like", error);
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is not valid");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "user is not authorized");
    }

    try {
        const toggleCommentLikeExist = await Like.findOne(
            { $and: [{ comment: commentId }, { likeBy: req.user._id }] }
        )

        if (toggleCommentLikeExist) {
            const result = await toggleCommentLikeExist.deleteOne();
            if (!result) {
                throw new ApiError(500, "Error occur during dislike toggle comment");
            }
            return res.status(200).json(new ApiResponse(200, { success: true, toggleCommentLike: false }, "successfully dislike comment"))
        }

        const commentLike = await Like.create({ comment: commentId, likeBy: req.user._id });
        if (!commentLike) {
            throw new ApiError(500, "Error occur during like comment")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { commentLike, success: true, toggleCommentLike: true }, "Successfully like comment"))
    } catch (error) {
        throw new ApiError(500, "Error occur during toggle comment like", error);
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Comment id is not valid");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "user is not authorized");
    }

    try {

        const toggleTweetLikeExist = await Like.findOne(
            { $and: [{ tweet: tweetId }, { likeBy: req.user._id }] }
        );

        if (toggleTweetLikeExist) {
            const result = await toggleTweetLikeExist.deleteOne();
            if (!result) {
                throw new ApiError(500, "Error occur during dislike tweet");
            }
            return res.status(200).json(new ApiResponse(200, { success: true, toggleTweetLike: false }, "successfully dislike tweet"))
        }

        const tweetLike = await Like.create({ tweet: tweetId, likeBy: req.user._id });
        if (!tweetLike) {
            throw new ApiError(500, "Error occur during like tweet")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { tweetLike, success: true, toggleTweetLike: false }, "Successfully like tweet"))

    } catch (error) {
        throw new ApiError(500, "Error occur during toggle tweet like", error);
    }
}
);


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    console.log("Reached")
    const likes = await Like.find({ $and: [{ likeBy: req.user?._id }, { video: { $ne: null } }] }).populate("video")
    console.log("likes", likes, req.user?._id)
    // except null extract all data from likes array
    const likedVideos = likes.filter(like => like.video).map(like => like.video)

    if (likedVideos.length === 0) {
        return res.status(200)
            .json(new ApiResponse(200, { likes }, "You haven't liked any videos yet"))
    }

    // const videos = likes.map(like => like.video)
    return res.status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}