
const asyncHandler = (requestHandler) => {

  return (req, res, next) => {
    Promise
      .resolve(
        requestHandler(req, res, next)
      )
      .catch((error) => next(error)
      )
  }

  // ! must be "return" this wrapper function.
}


// For the understanding prepose
// const asyncHandler = () => {}
// const asyncHandler = (func) => { () => {}} 
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// ! (err,res,req,next) =>{}

// ? Method 2 

// const asyncHandler = (fn) => async (req, res, next) => {

//   try {

//     await fn(req, res, next)

//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

export { asyncHandler }