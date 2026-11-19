import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    songIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "song" }],
    image: { type: String },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

playlistSchema.index({ userId: 1, createdAt: -1 });

const playlistModel =
  mongoose.models.playlist || mongoose.model("playlist", playlistSchema);

export default playlistModel;
