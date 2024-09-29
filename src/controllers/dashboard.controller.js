import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    if (!req.user?._id) {
        throw new ApiError(404, "Unauthorized request");
    }
    const userId = req.user._id;

    try {
        const channelStats = await Video.aggregate([
            // Match videos by the current user
            { $match: { owner: new mongoose.Types.ObjectId(userId) } },

            // Lookup subscriptions to count subscribers
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "owner",
                    foreignField: "channel",
                    as: "subscribers",
                },
            },

            // Lookup subscriptions to find channels the user is subscribed to
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "owner",
                    foreignField: "subscriber",
                    as: "subscribedTo",
                },
            },

            // Lookup likes for the user's videos
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likedVideos",
                },
            },

            // Lookup comments for the user's videos
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "video",
                    as: "videoComments",
                },
            },

            // Group by null to calculate total statistics
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },
                    totalViews: { $sum: "$views" },
                    totalSubscribers: { $first: { $size: "$subscribers" } },
                    subscribedTo: { $first: { $size: "$subscribedTo" } },
                    totalLikes: { $sum: { $size: "$likedVideos" } },
                    totalComments: { $sum: { $size: "$videoComments" } },
                },
            },

            // Project the fields to be returned in the response
            {
                $project: {
                    _id: 0,
                    totalVideos: 1,
                    totalViews: 1,
                    totalSubscribers: 1,
                    subscribedTo: 1,
                    totalLikes: 1,
                    totalComments: 1,
                },
            },
        ]);

        // Check if stats were calculated correctly
        const stats = channelStats[0] || {
            totalVideos: 0,
            totalViews: 0,
            totalSubscribers: 0,
            subscribedTo: 0,
            totalLikes: 0,
            totalComments: 0,
        };

        res
            .status(200)
            .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
    } catch (error) {
        console.error("Error fetching channel stats: ", error);
        throw new ApiError(500, "Error fetching channel stats");
    }
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // Check if the user is authenticated
    if (!req.user?._id) {
        throw new ApiError(404, "Unauthorized request");
    }

    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

    // Parse pagination and sorting parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1; // Sort type (1 for ascending, -1 for descending)

    try {
        // Fetch videos uploaded by the channel (user)
        const videos = await Video.find({ owner: req.user._id })
            .sort({ [sortBy]: sortOrder })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        // Fetch total video count for pagination metadata
        const totalVideos = await Video.countDocuments({ owner: req.user._id });

        // If no videos are found, respond with an empty list
        if (videos.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No videos found"));
        }

        // Prepare response with video data and pagination information
        const response = {
            videos,
            totalVideos,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalVideos / limitNumber),
        };

        return res.status(200).json(new ApiResponse(200, response, "Total videos fetched successfully"));

    } catch (error) {
        console.error("Error fetching videos: ", error);
        throw new ApiError(500, "Error fetching videos");
    }
});

export { getChannelStats, getChannelVideos };
