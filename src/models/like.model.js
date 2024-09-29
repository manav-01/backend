import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({

    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    },

    likeBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tweet",
    },

}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);