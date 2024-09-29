import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { asyncHandler } from "./asyncHandler.js";
import { ApiError } from "./ApiError.js";

// Make a cloudinary configuration
cloudinary.config(
  {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  }
);

const uploadOnCloudinary = async (localFilePath) => {

  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
    // file has been uploaded successful
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
    return null;
  }

}


const deleteOnCloudinary = asyncHandler(async (url) => {
  try {
    if (!url) return null;
    const urlLink = String(url);
    // Get Public Id
    //a = url.split("/").reverse()[0].split(".")[0];
    //b = url.split('/').pop().split('.')[0];
    const publicId = urlLink.split('/').pop().split('.');
    // console.log(publicId);
    // const response = await cloudinary.uploader.destroy(publicId);
    const response = await cloudinary.api.delete_resources([publicId[0]], { type: "upload", resource_type: publicId[1] === "mp4" ? "video" : 'image' });
    // console.log("response",response)
    if (!response) { throw new ApiError(500, "There is Issue to deleting old Image") };

    return response;


  } catch (error) {

    return new ApiError(500, "Error occur in deleting file on cloudinary", error);
  }

})


export { uploadOnCloudinary, deleteOnCloudinary } 