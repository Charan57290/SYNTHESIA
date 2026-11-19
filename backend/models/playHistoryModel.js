import mongoose from "mongoose";

const playHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "song",
    required: true,
  },
  playedAt: { type: Date, default: Date.now },
  durationPlayed: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

playHistorySchema.index({ userId: 1, playedAt: -1 });
playHistorySchema.index({ songId: 1 });
playHistorySchema.index({ songId: 1, playedAt: -1 });

const playHistoryModel =
  mongoose.models.playhistory ||
  mongoose.model("playhistory", playHistorySchema);

export default playHistoryModel;
