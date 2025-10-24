import { Router } from "express";
import {registerUser, UserLogOut,refreshAccessToken} from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.middleware.js'
import { UserLoggedIn } from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
    upload.fields([
        {
            name :"avatar",
            maxCount:1
        } , {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(UserLoggedIn)


// secured Routes
router.route("/logout").post(verifyJWT, UserLogOut)
router.route("/refresh-token").post(refreshAccessToken)


export default router;