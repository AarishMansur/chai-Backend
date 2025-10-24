import { Schema ,Model} from "mongoose";
import mongoose  from "mongoose";

const SubscriptionSchema = new Schema({
     subscriber:{
        type:Schema.Types.ObjectId, // one who is subscribed
        ref:'User',
     },
     chanel :{
        type:Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref:'User',
     }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",SubscriptionSchema);