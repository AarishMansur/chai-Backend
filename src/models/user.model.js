import mongoose,{Schema,model} from "mongoose";

import pkg from 'jsonwebtoken';
const {jwt} = pkg;
import bcrypt from 'bcrypt'

const UserSchema =  new Schema({
   username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true, // it makes easy for searchable
   },
     email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
   },
     fullname:{
    type:String,
    required:true,
    lowercase:true,
    trim:true,
    index:true, 
   },
    avatar:{
    type:String, // cloudinary url 
    required:true,
    lowercase:true, 
   },
   coverImage:{
    type:String  
 },
 watchHistory :[
    {
        type:Schema.Types.ObjectId,
        ref:"Video"
    }
 ],
 password:{
    type:String,
    required:[true,"Password is required"],
 },
 refreshToken:{
    type:String,
 }
},{timestamps:true})

UserSchema.pre("save", async function(next){
   if(!this.isModified("password")) return next();
   this.password  = await bcrypt.hash(this.password,10)
   next()
})

UserSchema.methods.isPasswordCorrect = async function (password){
 return await bcrypt.compare(password,this.password)
}

UserSchema.method.generateAccessToken = function (){
 return jwt.sign(
   {
      _id:this._id,
      email:this.email,
      username:this.username,
      fullname:this.fullname
   },
   process.env.ACCESS_TOKEN_SECRET,{
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
   }
  )
}
UserSchema.method.generateRefreshToken = function(){
   return jwt.sign(
   {
      _id:this._id,
      email:this.email,
      username:this.username,
      fullname:this.fullname
   },
   process.env.REFRESH_TOKEN_SECRET,{
      expiresIn:process.env.REFERESH_TOKEN_EXPIRY
   }
  )
}

export const Users = mongoose.model("User",UserSchema)