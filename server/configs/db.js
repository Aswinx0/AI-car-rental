import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        mongoose.connection.on('connected', ()=> console.log("Database Connected"));
        await mongoose.connect(`${process.env.MONGODB_URI}/car-rental`, {
            serverSelectionTimeoutMS: 10000,
        })
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        console.error("Check your internet, MongoDB Atlas IP whitelist, and MONGODB_URI in .env");
    }
}

export default connectDB;