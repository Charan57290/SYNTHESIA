/**
 * tests/relationships.test.js
 * Tests ObjectId cross-document references and populate.
 */

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";
import artistModel from "../models/artistModel.js";
import albumModel from "../models/albumModel.js";
import songModel from "../models/songModel.js";
import playlistModel from "../models/playlistModel.js";
import playHistoryModel from "../models/playHistoryModel.js";

const MONGO_URI =
  process.env.TEST_MONGODB_URI ||
  "mongodb://localhost:27017/synthesia_test_relationships";

before(async () => {
  await mongoose.connect(MONGO_URI);
});

after(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (err) {}
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Promise.all([
    userModel.deleteMany({}),
    artistModel.deleteMany({}),
    albumModel.deleteMany({}),
    songModel.deleteMany({}),
    playlistModel.deleteMany({}),
    playHistoryModel.deleteMany({}),
  ]);
});

// ─── Artist → Album ──────────────────────────────────────────────────────────

describe("Artist → Album reference", () => {
  it("album.artistIds[0] equals artist._id", async () => {
    const artist = await artistModel.create({ name: "Test Artist" });
    const album = await albumModel.create({
      name: "Test Album",
      artistIds: [artist._id],
    });

    const found = await albumModel.findById(album._id);
    assert.equal(
      found.artistIds[0].toString(),
      artist._id.toString(),
      "artistId should match"
    );
  });

  it("populate album.artistIds returns artist name", async () => {
    const artist = await artistModel.create({ name: "Pop Artist" });
    const album = await albumModel.create({
      name: "Pop Album",
      artistIds: [artist._id],
    });

    const populated = await albumModel
      .findById(album._id)
      .populate("artistIds");
    assert.equal(populated.artistIds[0].name, "Pop Artist");
  });
});

// ─── Song → Album + Artist ───────────────────────────────────────────────────

describe("Song → Album + Artist references", () => {
  it("song.albumId and song.artistIds reference correct docs", async () => {
    const artist = await artistModel.create({ name: "DJ Nova" });
    const album = await albumModel.create({
      name: "Nova Album",
      artistIds: [artist._id],
    });
    const song = await songModel.create({
      name: "Nova Track",
      albumId: album._id,
      artistIds: [artist._id],
    });

    const populated = await songModel
      .findById(song._id)
      .populate("albumId")
      .populate("artistIds");

    assert.equal(populated.albumId.name, "Nova Album");
    assert.equal(populated.artistIds[0].name, "DJ Nova");
  });
});

// ─── Playlist → Song ─────────────────────────────────────────────────────────

describe("Playlist → Song reference", () => {
  it("songIds contains song._id after adding", async () => {
    const user = await userModel.create({
      name: "User1",
      email: "user1@x.com",
      password: "pw",
    });
    const song = await songModel.create({ name: "My Song" });
    const playlist = await playlistModel.create({
      name: "My Playlist",
      userId: user._id,
      songIds: [song._id],
    });

    const found = await playlistModel.findById(playlist._id);
    assert.equal(found.songIds[0].toString(), song._id.toString());
  });

  it("populate songIds returns song names", async () => {
    const user = await userModel.create({
      name: "User2",
      email: "user2@x.com",
      password: "pw",
    });
    const song = await songModel.create({ name: "Evening Track" });
    const playlist = await playlistModel.create({
      name: "Evening Mix",
      userId: user._id,
      songIds: [song._id],
    });

    const populated = await playlistModel
      .findById(playlist._id)
      .populate("songIds");
    assert.equal(populated.songIds[0].name, "Evening Track");
  });
});

// ─── PlayHistory → User + Song ───────────────────────────────────────────────

describe("PlayHistory → User + Song reference", () => {
  it("stores userId and songId correctly", async () => {
    const user = await userModel.create({
      name: "Listener",
      email: "listener@x.com",
      password: "pw",
    });
    const song = await songModel.create({ name: "Heard Song" });
    const ph = await playHistoryModel.create({
      userId: user._id,
      songId: song._id,
    });

    const found = await playHistoryModel.findById(ph._id);
    assert.equal(found.userId.toString(), user._id.toString());
    assert.equal(found.songId.toString(), song._id.toString());
  });

  it("populate userId and songId returns names", async () => {
    const user = await userModel.create({
      name: "Fann",
      email: "fann@x.com",
      password: "pw",
    });
    const song = await songModel.create({ name: "Fan Favorite" });
    const ph = await playHistoryModel.create({
      userId: user._id,
      songId: song._id,
    });

    const populated = await playHistoryModel
      .findById(ph._id)
      .populate("userId")
      .populate("songId");
    assert.equal(populated.userId.name, "Fann");
    assert.equal(populated.songId.name, "Fan Favorite");
  });
});
