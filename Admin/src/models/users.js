import mongoose from "mongoose";



const { Schema, model } = mongoose;

const userSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    role: {
        type: String
    },
    isActive: {
        type: Boolean,
    },
}, { timestamps: true });

const Users = model("Users", userSchema);

export default Users;