import multer from "multer";

const storage = multer.diskStorage(
  {
    destination: function (req, file, cb) {
      cb(null, "/public/temp")
    },
    filename: function (req, file, cb) {
      // TODO: "file.originalname" --> use proper formate marked new file name instant of "file.originalname" because sometime originalname of path make you in trouble.   
      // ? File name make and store by using "unique id or name" or using "nenoId" 
      cb(null, file.originalname) //file.originalname : Name of the file on the uploader's computer.
    }
  }
);

export const upload = multer(
  {
    storage,
  }
)