/**
 * tests/models.test.js
 * Tests all model validations using node:test runner.
 * Uses an isolated MongoDB at TEST_MONGODB_URI (defaults to localhost).
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
  "mongodb://localhost:27017/synthesia_test_models";

before(async () => {
  await mongoose.connect(MONGO_URI);
});

after(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (err) {}
  await mongoose.disconnect();
});

// ─── User ───────────────────────────────────────────────────────────────────

describe("User model", () => {
  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it("requires name, email, password", async () => {
    const u = new userModel({});
    const err = await u.validate().catch((e) => e);
    assert.ok(err.errors.name, "name required");
    assert.ok(err.errors.email, "email required");
    assert.ok(err.errors.password, "password required");
  });

  it("saves a valid user", async () => {
    const saved = await userModel.create({
      name: "Alice",
      email: "alice@example.com",
      password: "hashed_pw",
    });
    assert.equal(saved.name, "Alice");
    assert.equal(saved.email, "alice@example.com");
    assert.ok(saved.createdAt, "timestamps enabled");
  });

  it("enforces unique email", async () => {
    await userModel.create({ name: "A", email: "dup@x.com", password: "pw" });
    const err = await userModel
      .create({ name: "B", email: "dup@x.com", password: "pw" })
      .catch((e) => e);
    assert.ok(err.code === 11000, "duplicate key error");
  });

  it("favoriteSongs defaults to empty array", async () => {
    const u = await userModel.create({
      name: "B",
      email: "b@x.com",
      password: "pw",
    });
    assert.deepEqual(u.favoriteSongs, []);
  });

  it("favoriteSongs accepts ObjectId values", async () => {
    const id = new mongoose.Types.ObjectId();
    const u = await userModel.create({
      name: "C",
      email: "c@x.com",
      password: "pw",
      favoriteSongs: [id],
    });
    assert.equal(u.favoriteSongs[0].toString(), id.toString());
  });

  it(".select('-password') omits password field", async () => {
    await userModel.create({ name: "D", email: "d@x.com", password: "secret" });
    const found = await userModel.findOne({ email: "d@x.com" }).select("-password");
    assert.equal(found.password, undefined, "password should not be present");
  });
});

// ─── Artist ─────────────────────────────────────────────────────────────────

describe("Artist model", () => {
  beforeEach(async () => {
    await artistModel.deleteMany({});
  });

  it("requires name", async () => {
    const a = new artistModel({});
    const err = await a.validate().catch((e) => e);
    assert.ok(err.errors.name, "name required");
  });

  it("saves a valid artist", async () => {
    const a = await artistModel.create({
      name: "Daft Punk",
      bio: "French duo",
      country: "France",
      genres: ["electronic"],
      externalIds: { musicbrainz: "mbid-dp", lastfm: "lfm-dp" },
    });
    assert.equal(a.name, "Daft Punk");
    assert.equal(a.externalIds.musicbrainz, "mbid-dp");
    assert.deepEqual(a.genres, ["electronic"]);
  });

  it("externalIds fields are optional", async () => {
    const a = await artistModel.create({ name: "Solo Artist" });
    assert.ok(!a.externalIds?.musicbrainz);
  });
});

// ─── Album ───────────────────────────────────────────────────────────────────

describe("Album model", () => {
  beforeEach(async () => {
    await albumModel.deleteMany({});
  });

  it("requires name", async () => {
    const a = new albumModel({});
    const err = await a.validate().catch((e) => e);
    assert.ok(err.errors.name, "name required");
  });

  it("saves a valid album with artistIds", async () => {
    const artistId = new mongoose.Types.ObjectId();
    const a = await albumModel.create({
      name: "Discovery",
      artistIds: [artistId],
      albumType: "album",
    });
    assert.equal(a.name, "Discovery");
    assert.equal(a.artistIds[0].toString(), artistId.toString());
    assert.equal(a.albumType, "album");
  });

  it("artistIds defaults to empty array", async () => {
    const a = await albumModel.create({ name: "Empty" });
    assert.deepEqual(a.artistIds, []);
  });
});

// ─── Song ────────────────────────────────────────────────────────────────────

describe("Song model", () => {
  beforeEach(async () => {
    await songModel.deleteMany({});
  });

  it("requires name", async () => {
    const s = new songModel({});
    const err = await s.validate().catch((e) => e);
    assert.ok(err.errors.name, "name required");
  });

  it("playCount defaults to 0", async () => {
    const s = await songModel.create({ name: "Test Song" });
    assert.equal(s.playCount, 0);
  });

  it("duration is a Number with default 0", async () => {
    const s = await songModel.create({ name: "Song A" });
    assert.equal(typeof s.duration, "number");
    assert.equal(s.duration, 0);
  });

  it("albumId is optional", async () => {
    const s = await songModel.create({ name: "Song B" });
    assert.ok(!s.albumId);
  });

  it("stores genre and externalIds", async () => {
    const s = await songModel.create({
      name: "One More Time",
      genre: "electronic",
      externalIds: { jamendo: "jmnd-123" },
    });
    assert.equal(s.genre, "electronic");
    assert.equal(s.externalIds.jamendo, "jmnd-123");
  });

  it("isExplicit defaults to false", async () => {
    const s = await songModel.create({ name: "Clean Song" });
    assert.equal(s.isExplicit, false);
  });
});

// ─── Playlist ────────────────────────────────────────────────────────────────

describe("Playlist model", () => {
  beforeEach(async () => {
    await playlistModel.deleteMany({});
  });

  it("requires userId and name", async () => {
    const p = new playlistModel({});
    const err = await p.validate().catch((e) => e);
    assert.ok(err.errors.name, "name required");
    assert.ok(err.errors.userId, "userId required");
  });

  it("saves a valid playlist", async () => {
    const userId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "My Mix", userId });
    assert.equal(p.name, "My Mix");
    assert.deepEqual(p.songIds, []);
    assert.equal(p.isPublic, false);
  });

  it("songIds accepts ObjectId array", async () => {
    const userId = new mongoose.Types.ObjectId();
    const songId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "Mix2", userId, songIds: [songId] });
    assert.equal(p.songIds[0].toString(), songId.toString());
  });

  it("$addToSet prevents duplicate songIds", async () => {
    const userId = new mongoose.Types.ObjectId();
    const songId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "NoDup", userId, songIds: [songId] });
    await playlistModel.updateOne(
      { _id: p._id },
      { $addToSet: { songIds: songId } }
    );
    const updated = await playlistModel.findById(p._id);
    assert.equal(updated.songIds.length, 1, "$addToSet should not add duplicate");
  });
});

// ─── PlayHistory ─────────────────────────────────────────────────────────────

describe("PlayHistory model", () => {
  beforeEach(async () => {
    await playHistoryModel.deleteMany({});
  });

  it("requires userId and songId", async () => {
    const ph = new playHistoryModel({});
    const err = await ph.validate().catch((e) => e);
    assert.ok(err.errors.userId, "userId required");
    assert.ok(err.errors.songId, "songId required");
  });

  it("playedAt defaults to now", async () => {
    const before = new Date();
    const ph = await playHistoryModel.create({
      userId: new mongoose.Types.ObjectId(),
      songId: new mongoose.Types.ObjectId(),
    });
    const after = new Date();
    assert.ok(ph.playedAt >= before && ph.playedAt <= after, "playedAt should be ~now");
  });

  it("saves with all fields", async () => {
    const userId = new mongoose.Types.ObjectId();
    const songId = new mongoose.Types.ObjectId();
    const ph = await playHistoryModel.create({ userId, songId, durationPlayed: 180 });
    assert.equal(ph.userId.toString(), userId.toString());
    assert.equal(ph.songId.toString(), songId.toString());
    assert.equal(ph.durationPlayed, 180);
  });
});
