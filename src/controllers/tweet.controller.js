import mongoose, {isValidObjectId} from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { response } from "express";

const createTweet = asyncHandler(async (req, res) => {
    // Todo: Create Tweet
    const { content } = req.body;

    if (!content || content.length === 0 || content === "") {
        throw new ApiError(400, "Content must be required");
    }

    if (!req?.user._id) {
        throw new ApiError(400, "User not authorized");
    }

    try {
        const tweet = await Tweet.create(
            {
                owner: req?.user._id,
                content
            }
        );

        if (!tweet) {
            new ApiError(500, "There is issue in create Tweet");
        }

        console.log("Successfully Created Tweet");
        res
            .status(200)
            .json(new ApiResponse(200, "Successfully Created Tweet", tweet));

    } catch (error) {
        new ApiError(500, "Issue Occur in create Tweet");
    }
});

const getUserTweets = asyncHandler(async (req, res) => {
    // Todo: get user tweets
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User not found");
    }

    try {
        const result = await Tweet.find({ owner: userId });
        if (!result) {
            console.log(Tweet);
            return new ApiError(500, "User Tweet's not found");
        }

        res
            .status(200)
            .json(new ApiResponse(200, result, "Successfully found user tweets"))
    } catch (error) {
        throw new ApiError(500, "Error occurs get user tweets founding")
    }
})

const updateTweet = asyncHandler(async (req, res) => { 

    // Todo: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content || content.length === 0 || content === "") {
        throw new ApiError(400, "Content must be required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet id is not valid");
    }

    try {
        const result = await Tweet.findByIdAndUpdate(tweetId, { $set: {content} }, { new: true });

        if (!result) {
            throw new ApiError(500, "Tweet not updated");
        }

        res
            .status(200)
            .json(new ApiResponse(200, "Tweet successfully updated", result));
    } catch (error) {
        throw new ApiError(500, "Error occur in tweet update process.");
    }

});

const deleteTweet = asyncHandler(async (req, res) => {
    
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet id is not valid");
    }

    try {
        const result = await Tweet.findByIdAndDelete(tweetId);
    
        if (!result) {
            throw new ApiError(500, "Tweet cannot be delete");
        }
    
        res
            .status(200)
            .json(new ApiResponse(200, {},"Tweet successfully deleted"))
    
    } catch (error) {
        throw new ApiError(500, "Error occur in deleting Tweet",error) ;
    }
})

export { 
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};