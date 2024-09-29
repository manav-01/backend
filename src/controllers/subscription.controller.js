import mongoose, {isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Check if the user is authorized
    if (!req.user?._id) {
        throw new ApiError(400, "User not authorized");
    }

    // Validate the channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channelId is not valid");
    }

    try {
        // Check if the subscription already exists
        const existingSubscription = await Subscription.findOne({
            subscriber: req.user._id,
            channel: channelId,
        });

        if (existingSubscription) {
            // If subscription exists, return channel data and message
            return res
                .status(200)
                .json(new ApiResponse(200, existingSubscription, "Channel already subscribed"));
        }

        // If subscription doesn't exist, create a new subscription
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });

        if (!newSubscription) {
            throw new ApiError(500, "An error occurred during subscription");
        }

        // Return success response with subscription data
        res
            .status(200)
            .json(new ApiResponse(200, newSubscription, "Successfully subscribed"));
    } catch (error) {
        // Handle errors during subscription process
        throw new ApiError(500, error.message || "Error occurred during subscription toggle");
    }
});


// controller to return subscriber list of a channel
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    
    // Validate the channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel Id is not valid");
    }

    try {
        // Fetch subscribers and count the total number of subscribers concurrently
        const subscribersPromise = Subscription.find({ channel: channelId })
            .populate("subscriber", "fullName email username avatar coverImage");
        
        const totalSubscribersPromise = Subscription.countDocuments({ channel: channelId });

        // Execute both promises concurrently
        const [subscribers, totalSubscribers] = await Promise.all([subscribersPromise, totalSubscribersPromise]);

        // Check if subscribers were fetched successfully
        if (!subscribers) {
            throw new ApiError(500, "Error occurred during subscribers retrieval");
        }

        // Return response with subscribers list and total count
        return res.status(200).json(
            new ApiResponse(
                200,
                { totalSubscribers, subscribers },
                "Subscribers are fetched successfully"
            )
        );

    } catch (error) {
        // Handle errors during fetching subscribers
        throw new ApiError(500, error.message || "Internal server error while fetching subscribers");
    }
});


// controller to return channel list to which user has subscribed
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriberId id")
    }

    console.log(subscriberId);

    const subscribedChannel = await Subscription.find({subscriber: subscriberId}).populate("channel", "fullName email username avatar coverImage")

    if (!subscribedChannel) {
        throw new ApiError(500, "Error occur during finding subscribe list")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannel, "Successfully find user channel list"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
 };