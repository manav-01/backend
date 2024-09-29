- https://dev.to/hakimraissi/pagination-with-express-and-mongoose-pnh
- // https://stackoverflow.com/questions/13085824/sort-in-mongoosejs-3-3-1-in-ascending-and-descending-order
- https://unpkg.com/browse/mongoose-paginate-v2@1.3.15/README.md

```js
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "1",
    userId = "",
  } = req.query;
  console.log(req.query);

  // Parse and validate query parameters
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const sortOrder = parseInt(sortType, 10) === -1 ? -1 : 1; // Ensure sortType is either 1 (asc) or -1 (desc)

  try {
    // Define the aggregation pipeline
    const pipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
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
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ["$owner", 0] }, // Efficiently get the first element
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder, // Dynamically sort based on the provided field and order
        },
      },
      {
        $skip: (pageNumber - 1) * limitNumber,
      },
      {
        $limit: limitNumber, // Correctly prefixed with '$'
      },
    ];

    // Execute the aggregation pipeline
    const result = await Video.aggregate(pipeline);

    // Count total videos based on query without pagination
    const totalVideosPipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      },
      {
        $count: "totalVideos",
      },
    ];
    const totalVideosResult = await Video.aggregate(totalVideosPipeline);
    const totalVideos = totalVideosResult[0]?.totalVideos || 0;
    const totalPages = Math.ceil(totalVideos / limitNumber);

    // Response based on the aggregation result
    if (result.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No videos found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { videos: result, totalVideos, totalPages, currentPage: pageNumber },
          "Videos fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error in video aggregation:", error);
    return res
      .status(500)
      .json(
        new ApiError(
          500,
          error.message || "Internal server error in video aggregation"
        )
      );
  }
});
```

### Solution 2

```js
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "1",
    userId = "",
  } = req.query;
  console.log(req.query);

  // Parse and validate query parameters
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const sortOrder = parseInt(sortType, 10) === -1 ? -1 : 1; // Ensure sortType is either 1 (asc) or -1 (desc)

  try {
    // Define the aggregation pipeline
    const pipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
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
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ["$owner", 0] }, // Efficiently get the first element
        },
      },
      {
        $sort: {
          [sortBy]: sortOrder, // Dynamically sort based on the provided field and order
        },
      },
      {
        $skip: (pageNumber - 1) * limitNumber,
      },
      {
        $limit: limitNumber, // Correctly prefixed with '$'
      },
    ];

    // Execute the aggregation pipeline
    const result = await Video.aggregate(pipeline);

    // Count total videos based on query without pagination
    const totalVideosPipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      },
      {
        $count: "totalVideos",
      },
    ];
    const totalVideosResult = await Video.aggregate(totalVideosPipeline);
    const totalVideos = totalVideosResult[0]?.totalVideos || 0;
    const totalPages = Math.ceil(totalVideos / limitNumber);

    // Response based on the aggregation result
    if (result.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No videos found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { videos: result, totalVideos, totalPages, currentPage: pageNumber },
          "Videos fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error in video aggregation:", error);
    return res
      .status(500)
      .json(
        new ApiError(
          500,
          error.message || "Internal server error in video aggregation"
        )
      );
  }
});
```
