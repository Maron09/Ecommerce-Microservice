import mongoose from "mongoose";
import argon2 from "argon2"


const { Schema, model } = mongoose


const UserSchema = new Schema({
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
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        unique: true,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "vendor", "customer"],
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (error) {
            return next(error);
        }
    }
    next();
});


UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw new Error("Password comparison failed");
    }
}

const User = model("User", UserSchema);


export default User;
