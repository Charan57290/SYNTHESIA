import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    image: {
      type: String,
      default: "",
    },
    favoriteSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: "song" }],
  },
  { timestamps: true }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
