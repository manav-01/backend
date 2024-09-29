import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Parse and validate page and limit
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Page number must be a positive integer");
    }

    if (isNaN(limitNumber) || limitNumber < 1) {
        throw new ApiError(400, "Limit must be a positive integer");
    }

    try {
        // Calculate the number of documents to skip
        const skip = (pageNumber - 1) * limitNumber;

        // Fetch the total number of comments for pagination calculation
        const totalComments = await Comment.countDocuments({ video: videoId });

        // Fetch comments with pagination
        const comments = await Comment.find({ video: videoId })
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 }); // Optional: Sort comments by creation date (most recent first)

        // Calculate total pages
        const totalPages = Math.ceil(totalComments / limitNumber);

        // Prepare the response data
        const responseData = {
            comments,
            totalComments,
            totalPages,
            currentPage: pageNumber,
        };

        // Return the response
        return res.status(200).json(new ApiResponse(200, responseData, "Fetched all comments successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Internal server error while fetching comments");
    }
});


const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video Id not matched in DB");
    };

    if (!content || !content?.trim().length > 0) {
        throw new ApiError(400, "Content is either empty or not found");
    }

    if (!req.user._id) {
        throw new ApiError(400, "User is not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });

    if (!comment) {
        throw new ApiError(500, "Something went wrong when storing a comment.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Message successfully created")
        );

});

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { newContent } = req.body;

    if (!commentId) {
        throw new ApiError(400, "Video Id not matched in DB");
    };

    if (!newContent || !newContent.trim().length > 0) {
        throw new ApiError(400, "New content is either empty or not found");
    }

    if (!req.user._id) {
        throw new ApiError(400, "User is not found")
    }

    const commentUpdate = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: newContent,
            }
        },
        {
            new: true,
        },
    );

    if (!commentUpdate) {
        throw new ApiError(400, "Comment does not updated");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, commentUpdate, "Comment is successfully updated."))

});

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {

        throw new ApiError(400, "Comment id is required");
    }

    if (!req.user._id) {
        new ApiError(400, "User is not found")
    }

    const deleteContent = await Comment.findByIdAndDelete(commentId);

    if (!deleteContent) { new ApiError(500, "Comment does not deleted") };

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment is successfully deleted"));

})




export { getVideoComments, addComment, updateComment, deleteComment };