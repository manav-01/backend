import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // Extract query parameters and set defaults
    const {
        page = 1, // Default page is 1
        limit = 10, // Default limit is 10
        query = "", // Default query is an empty string (matches all)
        sortBy = "createdAt", // Default sort field
        sortType = 1, // Default sort order (ascending)
        userId = "" // Default is an empty string (no user filtering)
    } = req.query;

    // Parse and validate query parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const sortOrder = parseInt(sortType, 10) === -1 ? -1 : 1; // Ensure sortType is either 1 (asc) or -1 (desc)

    try {
        // Define the aggregation pipeline
        const pipeline = [
            {
                $match: {
                    $and: [
                        // If `userId` is provided, filter videos by `userId`
                        ...(userId ? [{ owner: new mongoose.Types.ObjectId(userId) }] : []), 
                        {
                            $or: [
                                { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
                                { description: { $regex: query, $options: "i" } } // Case-insensitive search in description
                            ]
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                avatar: 1,
                                username: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] } // Extract the first user object from the array
                }
            },
            {
                $sort: {
                    [sortBy]: sortOrder // Dynamically sort based on the provided field and order
                }
            },
            {
                $skip: (pageNumber - 1) * limitNumber // Skip documents to implement pagination
            },
            {
                $limit: limitNumber // Limit the number of documents returned for pagination
            }
        ];

        // Execute aggregation with pagination
        const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
            page: pageNumber,
            limit: limitNumber,
            customLabels: {
                totalDocs: "totalVideos", // Rename total count field
                docs: "videos" // Rename returned documents field
            }
        });

        // Handle the response based on the result
        if (result.videos.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No videos found"));
        }

        return res.status(200).json(new ApiResponse(200, result, "Videos fetched successfully"));
    } catch (error) {
        // Log the error for debugging
        console.error("Error in video aggregation:", error);
        // Return a 500 error with a meaningful message
        return res.status(500).json(new ApiError(500, error.message || "Internal server error in video aggregation"));
    }
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const emptyFields = Object.keys(req.body).filter((field) => !req.body[field]);

    //  make error and throw it.
    if (emptyFields.length > 0) {
    const errorMessage = `field${emptyFields.length > 1 ? "s" : ""} ${emptyFields.join(' & ')} ${emptyFields.length > 1 ? 'are' : 'is'} required`;

    throw new ApiError(400, errorMessage);
    }
    const videoLocalPathFile = (req.files?.video && req.files.video.length > 0) ? req.files.video[0].path : null; 
    const thumbnailPathFile = (req.files?.thumbnail && req.files.thumbnail.length > 0) ? req.files.thumbnail[0].path : null;
    if (!videoLocalPathFile) {
        throw new ApiError(400, "Video file is required.");
    }
    if (!thumbnailPathFile) {
        throw new ApiError(400, "Video thumbnail is required.");
    }

    let videoUploader;
    let thumbnailUploader;
    
    try {
            thumbnailUploader = await uploadOnCloudinary(thumbnailPathFile);
        videoUploader = await uploadOnCloudinary(videoLocalPathFile);
        if (!videoUploader) {
        throw new ApiError(400, "Video file cloudinary is required.");
        };

        if (!thumbnailUploader) {
        throw new ApiError(400, "Video thumbnail cloudinary is required.");
        };

        const videoFileDB = await Video.create(
            {
                videoFile: videoUploader.url,// check url
                thumbnail: thumbnailUploader.url, // check url
                title,
                description,
                duration: videoUploader.duration, // update field
                views: 0,
                isPublished: true,
                owner: req.user._id
            }
        );

        if (!videoFileDB) {
            throw new ApiError(500, "Video cannot upload in Database", videoFileDB);
        }

        res
            .status(200)
            .json(
                new ApiResponse(200, videoFileDB, "Video upload successfully")
        );
        
    } catch (error) {
        console.log(error.message)
        if (videoUploader) {
            console.log("videoUploader.url", videoUploader.url);
            await deleteOnCloudinary(videoUploader.url);
        }
        if (thumbnailUploader) {
            await deleteOnCloudinary(thumbnailUploader.url);
        }
        throw new ApiError(500, "Error occur in video publish process",error);
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;
    // Todo: get video by id

    if (!videoId || videoId === "") {
        throw new ApiError(400, "Video id is required");
    }
try {
    
        // const result = await Video.findById({ _id: videoId });
    const result = await Video.aggregate(
        [
            {
                $match : {_id: new mongoose.Types.ObjectId(videoId)}    
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                                avatar: 1,
                                username: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] } // Extract the first user object from the array
                }
            },
        ]
        )
    
        if (!result) {
            console.error("Video not found");
            throw new ApiError(404, "Not found video");
        };
    
        return res
            .status(200)
            .json(new ApiResponse(200, result[0], "Successfully get your video"));   
} catch (error) {
    throw new ApiError(500, "Error occur in get Video from the DB");
}
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // Todo: update video details like title, description, thumbnail
    const { title, description } = req.body;
    const emptyFields = Object.keys(req.body).filter((field) => !req.body[field]);
    
    if (emptyFields.length > 0) {
    const errorMessage = `field${emptyFields.length > 1 ? "s" : ""} ${emptyFields.join(' & ')} ${emptyFields.length > 1 ? 'are' : 'is'} required`;

    throw new ApiError(400, errorMessage);
    }
    
    // handle thumbnail
    let thumbnailUploader;
    try {
        const thumbnailPath = req.file?.path || null;
         // if (!thumbnailPath) {
            //     throw new ApiError(400, "thumbnailPath file is missing")
            // }
            
            if (thumbnailPath) {
            thumbnailUploader = await uploadOnCloudinary(thumbnailPath);
            if (!thumbnailUploader) {
                throw new ApiError(500, "Error occur in thumbnail upload on Cloudinary");
            }
        }
        
        if (thumbnailUploader) {
            const video = await Video.findOne({ _id: videoId });            
            if (!video) {
                throw new ApiError(404, "Video not found");
            }
            
            const oldVideoThumbnailUrl = video?.thumbnail;
            
            // upload data on DB
            video.title = title;
            video.description = description;
            video.thumbnail = thumbnailUploader.url;
            const newVideoDetails = await video.save({ validationBeforeSave: false })
          

            if (oldVideoThumbnailUrl) {
                await deleteOnCloudinary(oldVideoThumbnailUrl);
            }

            if (!newVideoDetails) {
                throw new ApiError(500, "Video cannot be updated");
            }
            return res
                .status(200)
                .json(new ApiResponse(200, newVideoDetails, "Video updated successfully"));
            
        } else {
            const video = await Video.findByIdAndUpdate(
                { _id: videoId },
                {
                    $set: {
                        title,
                        description
                    }
                },
                {
                    new: true
                }
            )
            if (!video) {
                throw new ApiError(500, "Video cannot be updated");
            }
            return res
                .status(200)
                .json(new ApiResponse(200, video, "Video updated successfully"));
        }
        
    } catch (error) {
        if (thumbnailUploader) {
            await deleteOnCloudinary(thumbnailUploader.url)
        }

        throw new ApiError(500, "Error occur in update video details", error);
    }
    
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId || videoId === "") {
        throw new ApiError(500, "Video Id is required");
    }
    try {
        const video =  await Video.findById(videoId);
        await deleteOnCloudinary(video.thumbnail);
        await deleteOnCloudinary(video.videoFile);
        const result = await Video.findByIdAndDelete(videoId);

        if (!result) {
            throw new ApiError(500, "Video cannot deleted");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video Deleted Successfully"))

    } catch (error) {
        throw new ApiError(500, "Error occur in deleting Video on DB");
    }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

     if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    // Toggle the isPublish field
    video.isPublished = !video.isPublished;

    // Save the updated video
    await video.save({ validationBeforeSave: false });

    if (!video)
    {
        throw new ApiError(500, "Video cannot be updated");
    }
    return res.status(200)
        .json(new ApiResponse(200, {isPublished:video.isPublished}, "isPublished toggle Successfully"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}