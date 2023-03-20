import mongoose from "mongoose";

export default async function connectDB(uri: string): Promise<boolean> {
  try {
    mongoose.connect(uri);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
