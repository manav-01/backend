//import mongoose from 'mongoose'
import { app } from './app.js';
//import { DB_NAME } from './constants'
// require('dotenv').config({ path: './env' }); // it's true but here we are wite another way.
import dotenv from 'dotenv'
import connectDB from './db/index.js'

dotenv.config({
  path: "../.env",
})


connectDB()
  .then(
    () => {

      app.on("error", (error) => {
        console.log("Error", error);
        throw error;
      })


      app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️  Server is running at port : http://localhost:${process.env.PORT}/`);
      })



    }
  )
  .catch(
    (error) => { console.log("MONGO db connection failed !!! ", error); }
  );










/*
? First Approach. 

; (async () => {
  try {

    await mongoose.connect(`${ process.env.MONGODB_URI } / ${ DB_NAME }`);
    app.on("error", (error) => {
      console.log("Error", error);
      throw error;
    })

    app.listen(process.env.PORT, () => {
      console.log(`App is Listening on port ${ process.env.PORT }`)
    })

  } catch (error) {
    console.log("ERROR:: DB Connection:: Failed :: ", error);
    throw error

  }
})()

*/