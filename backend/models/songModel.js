import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String },
    image: { type: String },
    file: { type: String },
    // Backward-compat string album field
    album: { type: String },
    // New ObjectId reference
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: "album" },
    artistIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "artist" }],
    // duration as Number (new); durationStr preserves old string value
    duration: { type: Number, default: 0 },
    durationStr: { type: String },
    genre: { type: String },
    releaseDate: { type: Date },
    playCount: { type: Number, default: 0 },
    isExplicit: { type: Boolean, default: false },
    externalIds: {
      musicbrainz: { type: String },
      itunes: { type: String },
      jamendo: { type: String },
      lastfm: { type: String },
    },
  },
  { timestamps: true }
);

songSchema.index({ artistIds: 1 });
songSchema.index({ albumId: 1 });
songSchema.index({ genre: 1 });
songSchema.index({ genre: 1, playCount: -1 });
songSchema.index({ "externalIds.jamendo": 1 }, { sparse: true, unique: true });
songSchema.index({ "externalIds.itunes": 1 }, { sparse: true, unique: true });

const songModel = mongoose.models.song || mongoose.model("song", songSchema);

export default songModel;
