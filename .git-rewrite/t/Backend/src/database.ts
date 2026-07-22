import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    
    const uri = process.env.MONGODB_URI as string;
    
    if (!uri) {
      throw new Error("MongoDB URI is missing in .env file");
    }

    const conn = await mongoose.connect(uri);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB:`, error);
    
    process.exit(1); 
  }
};