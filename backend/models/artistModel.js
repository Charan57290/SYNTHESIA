import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: { type: String },
    image: { type: String },
    country: { type: String },
    genres: [{ type: String }],
    externalIds: {
      musicbrainz: { type: String },
      lastfm: { type: String },
      jamendo: { type: String },
      itunes: { type: String },
    },
  },
  { timestamps: true }
);

artistSchema.index({ name: 1 });
artistSchema.index(
  { "externalIds.musicbrainz": 1 },
  { sparse: true, unique: true }
);
artistSchema.index(
  { "externalIds.jamendo": 1 },
  { sparse: true, unique: true }
);
artistSchema.index(
  { "externalIds.itunes": 1 },
  { sparse: true, unique: true }
);

const artistModel =
  mongoose.models.artist || mongoose.model("artist", artistSchema);

export default artistModel;
