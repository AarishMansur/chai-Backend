import connectDB from "./db/index.js"
import express from "express";
 const app = express();
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at PORT ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MongoDb connection failed",err);
    
})


// (async()=>{
//  try {
//    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Name}`)
//  app.on("error",()=>{
//     console.log("Used when database is working fine but express cant");
//  })
//  app.listen(process.env.PORT,()=>{
//     console.log('Server is running on Port');
    
//  })
//  } catch (error) {
//      console.error("Error:",error);
//      throw error;
     
//  }
// })()