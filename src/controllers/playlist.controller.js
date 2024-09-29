import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    // Create playlist
    if (!name || !description) {
        throw new ApiError(400, "Name and Description field required");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(500, "User not authorized");
    }

    const existingPlaylist = await Playlist.findOne({ name });

    console.log("existingPlaylist", existingPlaylist);

    if (existingPlaylist) {
        return res.status(200).json(new ApiResponse(200, existingPlaylist, "Playlist already existed"));
    }

    const result = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });

    if (!result) {
        throw new ApiError(500, "Error occur during create Playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Playlist successfully created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        new ApiError(400, "User id is not valid");
    }

    try {
        const result = await Playlist.find({ owner: userId });

        if (!result) {
            throw new ApiError(500, "Error occur during  Playlist find");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, result, "User playlists successfully found"));
    } catch (error) { }
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        new ApiError(400, "Playlist id is not valid");
    }

    try {
        const result = await Playlist.findById(playlistId);

        if (!result) {
            throw new ApiError(500, "Playlist cannot found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, result, "Playlist found successfully"));
    } catch (error) {
        throw new ApiError(500, "Error occur during find playlist");
    }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate playlistId and videoId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist id is not valid");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is not valid");
    }

    try {
        // Find the playlist by ID
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Check if the video already exists in the playlist
        const videoExists = playlist.videos.includes(videoId);

        if (videoExists) {
            return res.status(200).json(new ApiResponse(200, playlist, "Video already exists in the playlist"));
        }

        // Add the video to the playlist if it doesn't already exist
        playlist.videos.push(videoId);
        await playlist.save();

        // Return the updated playlist
        return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"));

    } catch (error) {
        throw new ApiError(500, error.message || "Error occurred during adding video to playlist");
    }
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
        new ApiError(400, "Playlist id is not valid");
    }
    if (!isValidObjectId(videoId)) {
        new ApiError(400, "Video id is not valid");
    }

    try {
        const result = await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { videos: videoId } },
            { new: true }
        );

        if (!result) {
            throw new ApiError(404, "Video not remove")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, result, "Video successfully remove from Playlist"));
    } catch (error) {
        throw new ApiError(404, "Error occur during remove video from playlist");
    }
}
);

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        new ApiError(400, "Playlist id is not valid");
    }

    try {
        const playlistDelete = await Playlist.findByIdAndDelete(playlistId);

        if (!playlistDelete) {
            throw new ApiError(500, "Playlist cannot be delete");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { success: true }, "Playlist delete successfully"));
    } catch (error) {
        throw new ApiError(500, "Error occur during deleting playlist", error);
    }

})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!name || !description) {
        throw new ApiError(400, "Name and Description field required");
    }

    if (!isValidObjectId(playlistId)) {
        new ApiError(400, "Playlist id is not valid");
    }

    try {

        const updatePlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $set: { name, description } },
            { new: true }
        );

        if (!updatePlaylist) {
            throw new ApiError(500, "Error occur during update playlist in DB");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatePlaylist, "Successfully updated paly list details"));
    } catch (error) {
        throw new ApiError(500, "Error occur during update playlist", error);
    }

})



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

