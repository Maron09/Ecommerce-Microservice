import mongoose from "mongoose";

const {Schema, model} = mongoose




const refreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {timestamps: true})


refreshTokenSchema.index({expiresAt: 1}, {expiresAfterSeconds: 0})

const RefreshToken = model("RefreshToken", refreshTokenSchema)

export default RefreshToken