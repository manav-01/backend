const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1 } = req.query;
    
    // Parse and validate query parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const sortOrder = parseInt(sortType, 10) === -1 ? -1 : 1; // Ensure sort type is valid

    try {
        // Define the aggregation pipeline
        const pipeline = [
            {
                $match: {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } }
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
                                avatar: "$avatar.url",
                                username: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] } // Efficiently get the first element
                }
            },
            {
                $sort: {
                    [sortBy]: sortOrder
                }
            },
            {
                $skip: (pageNumber - 1) * limitNumber
            },
            {
                $limit: limitNumber
            }
        ];

        // Aggregate with pagination
        const result = await Video.aggregatePaginate(Video.aggregate(pipeline), {
            page: pageNumber,
            limit: limitNumber,
            customLabels: {
                totalDocs: "totalVideos",
                docs: "videos"
            }
        });

        // Respond based on the aggregation result
        if (result.videos.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No videos found"));
        }

        return res.status(200).json(new ApiResponse(200, result, "Videos fetched successfully"));

    } catch (error) {
        console.error("Error in video aggregation:", error);
        return res.status(500).json(new ApiError(500, error.message || "Internal server error in video aggregation"));
    }
});


/// video.controller.js --> getAllVideos
/*
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
                        ...(userId ? [{ owner: userId }] : []), 
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
                                avatar: "$avatar.url",
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

*/

/*
! @ Answer 2
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
                        ...(userId ? [{ owner: userId }] : []),
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
                                avatar: "$avatar.url",
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
                $facet: {
                    videos: [
                        { $skip: (pageNumber - 1) * limitNumber }, // Skip documents to implement pagination
                        { $limit: limitNumber } // Limit the number of documents returned for pagination
                    ],
                    totalCount: [
                        { $count: "count" } // Count the total number of documents that match the query
                    ]
                }
            }
        ];

        // Execute aggregation pipeline
        const result = await Video.aggregate(pipeline).exec();

        // Calculate total videos and total pages
        const totalVideos = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
        const totalPages = Math.ceil(totalVideos / limitNumber);

        // Format response
        const response = {
            totalVideos,
            totalPages,
            currentPage: pageNumber,
            videos: result[0].videos
        };

        // Handle the response based on the result
        if (response.videos.length === 0) {
            return res.status(200).json(new ApiResponse(200, response, "No videos found"));
        }

        return res.status(200).json(new ApiResponse(200, response, "Videos fetched successfully"));
    } catch (error) {
        // Log the error for debugging
        console.error("Error in video aggregation:", error);
        // Return a 500 error with a meaningful message
        return res.status(500).json(new ApiError(500, error.message || "Internal server error in video aggregation"));
    }
});


*/

/**
 ! ANswer 2
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
        // Define the base aggregation pipeline without pagination for counting
        const basePipeline = [
            {
                $match: {
                    $and: [
                        ...(userId ? [{ owner: userId }] : []), // Filter by userId if provided
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
                                avatar: "$avatar.url",
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
        ];

        // Aggregate to count the total number of videos
        const totalVideosPipeline = [
            ...basePipeline,
            {
                $count: "totalVideos"
            }
        ];

        // Execute the aggregation to get the total number of videos
        const totalVideosResult = await Video.aggregate(totalVideosPipeline);
        const totalVideos = totalVideosResult[0]?.totalVideos || 0;

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalVideos / limitNumber);

        // Define the aggregation pipeline with pagination
        const paginatedPipeline = [
            ...basePipeline,
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
        const videos = await Video.aggregate(paginatedPipeline);

        // Construct the response data
        const responseData = {
            totalVideos, // Total number of videos matching the query
            totalPages, // Total number of pages
            currentPage: pageNumber, // Current page number
            videos // Array of videos for the current page
        };

        // Send the response
        return res.status(200).json(new ApiResponse(200, responseData, "Videos fetched successfully"));
    } catch (error) {
        // Log the error for debugging
        console.error("Error in video aggregation:", error);
        // Return a 500 error with a meaningful message
        return res.status(500).json(new ApiError(500, error.message || "Internal server error in video aggregation"));
    }
});

 */