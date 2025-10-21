import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
const app = express()
const port = 3000

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,

}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static('public')) // means it will save our files in public folder
app.use(cookieParser())



// routes 
import userRouter from './routes/user.routes.js'


// routers Desclaration
app.use("/api/v1/users",userRouter) // this is prefix


export {app }