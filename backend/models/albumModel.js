import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String },
    bgColour: { type: String },
    image: { type: String },
    artistIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "artist" }],
    releaseDate: { type: Date },
    albumType: { type: String, default: "album" },
    externalIds: {
      musicbrainz: { type: String },
      itunes: { type: String },
      jamendo: { type: String },
    },
  },
  { timestamps: true }
);

albumSchema.index({ artistIds: 1 });
albumSchema.index(
  { "externalIds.musicbrainz": 1 },
  { sparse: true, unique: true }
);
albumSchema.index(
  { "externalIds.jamendo": 1 },
  { sparse: true, unique: true }
);
albumSchema.index(
  { "externalIds.itunes": 1 },
  { sparse: true, unique: true }
);

const albumModel =
  mongoose.models.album || mongoose.model("album", albumSchema);

export default albumModel;
