import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
// Database always in another continent

const connectDB = async () => {
  try {
    console.log("URL:", process.env.MONGODB_URI)
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n MONGODB Connected !! DB Host: ${connectionInstance.connection.host}`)

  } catch (error) {
    console.log("ERROR:: MONGODB Connection Failed:: ", error);
    process.exit(1)
    throw error
  }
};

export default connectDB;