import mongoose from "mongoose";


const { Schema, model } = mongoose


const BankSchema = new Schema({
    name: {
        type: String
    },
    slug: {
        type: String
    },
    code: {
        type: String
    },
    longcode: {
        type: String
    },
}, { timestamps: true })

const Bank = model("Bank", BankSchema)


export default Bank