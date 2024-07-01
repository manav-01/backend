//import mongoose from 'mongoose'
//import express from 'express'
//import { DB_NAME } from './constants'
// const app = express();
// require('dotenv').config({ path: './env' }); // it's true but here we are wite another way.
import dotenv from 'dotenv'
import connectDB from './db/index.js'

dotenv.config({
  path: "/.env",
})


connectDB();










/*
? First Approach. 

; (async () => {
  try {

    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error", error);
      throw error;
    })

    app.listen(process.env.PORT, () => {
      console.log(`App is Listening on port ${process.env.PORT}`)
    })

  } catch (error) {
    console.log("ERROR:: DB Connection:: Failed :: ", error);
    throw error

  }
})()

*/