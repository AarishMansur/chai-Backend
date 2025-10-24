import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { Users } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'


const generateAccessAndRefereshTokens = async(userId)=>{
   try {
   const user =  await Users.findById(userId)
 const accessToken =   user.generateAccessToken()
 const refreshToken=   user.generateRefreshToken ()

 user.refreshToken = refreshToken
 user.save({validateBeforeSave:false})
 return {accessToken,refreshToken}

   } catch (error) {
       throw new ApiError(500,"something went wrong while generatint refresh and acess token")
   }
}

const registerUser = asyncHandler( async (req,res)=>{

    // get user details from frontend
    // validation - not empty
    // check if user already exists : username, email;
    // check for images, check for avatar
    // upload them to cloudinary, avatar check again
    // create user object - create entry calls
    // remove password and refresh tokens from response
    // check for user creation
    // return response

   const {fullname,email,username,password} = req.body
   console.log("email:",email);

 if([fullname,email,username,password].some((field)=>field?.trim()==='')){
    throw new ApiError(400,"All fields are required")
 }
   
 const existedUser = await Users.findOne({
    $or:[{username} , {email}]
 })

 if(existedUser){
    throw new ApiError(409,"User with email and username already exist")
 }
const avatarLocalPath =  req.files?.avatar[0]?.path;
const coverImageLocalPath =req.files?.coverImage[0]?.path

if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
}

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 if(!avatar){
    throw new ApiError(400,"Avatar file is required")
 }
 const user =  await Users.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url ||"",
    email,
    password,
    username:username.toLowerCase(),
 })

const createdUser = await  Users.findById(user._id).select(
    "-password -refreshToken" // means these fields aren't selected
)
if(!createdUser) {
    throw new ApiError(500,"Something went wrong while registering User")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Succesfully")
)



})

const UserLoggedIn = asyncHandler(async(req,res)=>{
  // req body -> data
  // username or email
  // find the user
  // password check 
  // access and refresh token
  // send cookie

  const {email,username,password} = req.body

  if(!username && !email){  // or alternate !(username||email)
   throw new ApiError(400,"username and Email required")
  }

 const user = await Users.findOne({
   $or:[{username},{email}]
  })

  if(!user){
   throw new ApiError(404,"User does not exit")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
   throw new ApiError(401,"Invalid Password credentials")
  }
 const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

const loggedInUser =  await Users.findById(user._id).select("-password -refreshToken")

const options = {
   httpOnly :true,
   secure:true
}
return res.status(200).cookie("acessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
   new ApiResponse(
      200,
      {
         user:loggedInUser,accessToken,
         refreshToken
      },
      "User  Logged in Successfully"
   )
)



})

const UserLogOut = asyncHandler(async(req,res)=>{
Users.findByIdAndUpdate(
   req.user._id,
   {
      $set:{refreshToken : undefined}
   }
)
const options = {
   httpOnly :true,
   secure:true
}
return res.status(200).clearCoookie("accessToken",options)
.clearCoookie("refreshToken",options)
.json(new ApiRespons(200,{},"User Logged Out"))
})

const refreshAccessToken =  asyncHandler(async (req,res)=>{
  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
      throw new ApiError(401,"Unauthorized request")
  }
   const decodedToken = jwt.verify(
  incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
  )

 const user = Users.findOne(decodedToken?._id)
 if(!user){
   throw new ApiError(401,"Refresh Token is invalid")
 }
 if(incomingRefreshToken !== user?.refreshAccessToken){
   throw new ApiError(401,"Refresh token is expired")
 }

 const options = {
   httpOnly:true,
   secure:true,
 }

const {accessToken,NewrefreshToken} =  await generateAccessAndRefereshTokens(user._id)

 return res.status(200).cookie("access-token",accessToken,options).cookie("refreshToken",NewrefreshToken,options).json(
   new ApiResponse(200,{accessToken,refreshToken:NewrefreshToken},
      "Access Token refreshed "
   )
 )
} )

const changeCurrentPassword = asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword} = req.body

   const user = await Users.findById(req.user?._id)
 const isPasswordCorrect =   user.isPasswordCorrect(oldPassword)
 if(!isPasswordCorrect){
   throw new ApiError(400,"Invalid password");
 }
 user.password = newPassword
await user.save({validateBeforeSave:false})

return res.
status(200)
.json(new ApiResponse(200,{},"Password Changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{

   return res.status(200).json(new ApiResponse(200,req.user,"Current user fetched successfully"))



})

const updateAccountDetails = asyncHandler(async(req,res)=>{
   const {fullname,email} =req.body

   if(!fullname || !email ){
      throw new ApiError(400,"All fields are required")
   }

const user =  Users.findByIdAndUpdate( req.user?._id, {
   $set:{
      fullname:fullname,
      email:email,
   }
},{new:true}).select("-password")
return res
.status(200)
.json( new ApiResponse(200,user,"Account Details updated Successfully"))
}) 


const updateUserAvatar  = asyncHandler(async(req,res)=>{
  const avatarLocalPath =   req.file?.path // if you dont wanna use cloudinary you can save it too 
  if(!avatarLocalPath){
   throw new ApiError(404,"Avatar is not provided")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
   throw new ApiError(401,"Error while uploading on avatar")
  }

 const user  =  await Users.findByIdAndUpdate(
   req.user?._id,
   {
      $set:{
         avatar:avatar.url // setting up avatar same as Password
      }
   },
   {new:true}
  ) .select("-password")
return res.status(200)
   .json(new ApiResponse(200,user,"Avatar  updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverImagePath = req.file?.path
   if(!coverImagePath){
      throw new ApiError(400,"Cover Image required")
   }

   const coverImage = await uploadOnCloudinary(coverImagePath)
   if(!coverImage){
      throw new ApiError(400,"Error while uploading an Avatar")
   }
  const user =  await Users.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage : coverImage.url
         },
      },
      {new:true}
   ).select("-password")

   return res.status(200)
   .json(new ApiResponse(200,user,"Cover Image updated successfully"))
})


export {registerUser,UserLoggedIn,UserLogOut,refreshAccessToken,getCurrentUser,changeCurrentPassword,updateAccountDetails,updateUserAvatar,updateUserCoverImage}