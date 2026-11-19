import mongoose from "mongoose";

let cachedPromise = null;

export const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI environment variable is missing!");
        return;
    }

    if (!cachedPromise) {
        cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 8000,
        }).then(() => {
            console.log("DB Connected");
        }).catch((error) => {
            cachedPromise = null;
            console.error("DB Connection Error:", error);
        });
    }

    await cachedPromise;
};
