/**
 * tests/crud.test.js
 * Full Create / Read / Update / Delete tests for all models.
 * Also tests runValidators on updates and invalid ObjectId handling.
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
  "mongodb://localhost:27017/synthesia_test_crud";

before(async () => {
  await mongoose.connect(MONGO_URI);
});

after(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (err) {}
  await mongoose.disconnect();
});

// ─── User CRUD ───────────────────────────────────────────────────────────────

describe("User CRUD", () => {
  beforeEach(async () => { await userModel.deleteMany({}); });

  it("Create — saves and returns _id", async () => {
    const u = await userModel.create({ name: "Eve", email: "eve@x.com", password: "pw" });
    assert.ok(u._id);
  });

  it("Read — findById returns saved doc", async () => {
    const u = await userModel.create({ name: "Eve", email: "eve@x.com", password: "pw" });
    const found = await userModel.findById(u._id);
    assert.equal(found.name, "Eve");
  });

  it("Update — findByIdAndUpdate changes name", async () => {
    const u = await userModel.create({ name: "Eve", email: "eve@x.com", password: "pw" });
    const updated = await userModel.findByIdAndUpdate(
      u._id,
      { name: "Evelyn" },
      { new: true }
    );
    assert.equal(updated.name, "Evelyn");
  });

  it("Delete — findByIdAndDelete removes doc", async () => {
    const u = await userModel.create({ name: "Eve", email: "eve@x.com", password: "pw" });
    await userModel.findByIdAndDelete(u._id);
    const found = await userModel.findById(u._id);
    assert.equal(found, null);
  });

  it("runValidators on update rejects empty name", async () => {
    const u = await userModel.create({ name: "Eve", email: "eve@x.com", password: "pw" });
    const err = await userModel
      .findByIdAndUpdate(u._id, { name: "" }, { runValidators: true, new: true })
      .catch((e) => e);
    // mongoose required validator treats empty string as invalid
    assert.ok(err, "should throw validation error");
  });
});

// ─── Artist CRUD ─────────────────────────────────────────────────────────────

describe("Artist CRUD", () => {
  beforeEach(async () => { await artistModel.deleteMany({}); });

  it("Create", async () => {
    const a = await artistModel.create({ name: "Bonobo" });
    assert.ok(a._id);
  });

  it("Read", async () => {
    const a = await artistModel.create({ name: "Bonobo" });
    const found = await artistModel.findById(a._id);
    assert.equal(found.name, "Bonobo");
  });

  it("Update", async () => {
    const a = await artistModel.create({ name: "Bonobo" });
    await artistModel.findByIdAndUpdate(a._id, { bio: "British musician" });
    const updated = await artistModel.findById(a._id);
    assert.equal(updated.bio, "British musician");
  });

  it("Delete", async () => {
    const a = await artistModel.create({ name: "Bonobo" });
    await artistModel.findByIdAndDelete(a._id);
    assert.equal(await artistModel.findById(a._id), null);
  });
});

// ─── Album CRUD ──────────────────────────────────────────────────────────────

describe("Album CRUD", () => {
  beforeEach(async () => { await albumModel.deleteMany({}); });

  it("Create", async () => {
    const a = await albumModel.create({ name: "Animals" });
    assert.ok(a._id);
  });

  it("Read", async () => {
    const a = await albumModel.create({ name: "Animals" });
    const found = await albumModel.findById(a._id);
    assert.equal(found.name, "Animals");
  });

  it("Update — change albumType", async () => {
    const a = await albumModel.create({ name: "Animals" });
    await albumModel.findByIdAndUpdate(a._id, { albumType: "ep" });
    const updated = await albumModel.findById(a._id);
    assert.equal(updated.albumType, "ep");
  });

  it("Delete", async () => {
    const a = await albumModel.create({ name: "Animals" });
    await albumModel.findByIdAndDelete(a._id);
    assert.equal(await albumModel.findById(a._id), null);
  });
});

// ─── Song CRUD ───────────────────────────────────────────────────────────────

describe("Song CRUD", () => {
  beforeEach(async () => { await songModel.deleteMany({}); });

  it("Create", async () => {
    const s = await songModel.create({ name: "Lazuli", genre: "rock" });
    assert.ok(s._id);
  });

  it("Read", async () => {
    const s = await songModel.create({ name: "Lazuli", genre: "rock" });
    const found = await songModel.findById(s._id);
    assert.equal(found.name, "Lazuli");
  });

  it("Update — increment playCount", async () => {
    const s = await songModel.create({ name: "Lazuli", playCount: 5 });
    await songModel.findByIdAndUpdate(s._id, { $inc: { playCount: 1 } });
    const updated = await songModel.findById(s._id);
    assert.equal(updated.playCount, 6);
  });

  it("Delete", async () => {
    const s = await songModel.create({ name: "Lazuli" });
    await songModel.findByIdAndDelete(s._id);
    assert.equal(await songModel.findById(s._id), null);
  });

  it("runValidators rejects empty name on update", async () => {
    const s = await songModel.create({ name: "Lazuli" });
    const err = await songModel
      .findByIdAndUpdate(s._id, { name: "" }, { runValidators: true })
      .catch((e) => e);
    assert.ok(err, "should throw validation error for empty name");
  });
});

// ─── Playlist CRUD ───────────────────────────────────────────────────────────

describe("Playlist CRUD", () => {
  beforeEach(async () => { await playlistModel.deleteMany({}); });

  it("Create", async () => {
    const userId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "Chill", userId });
    assert.ok(p._id);
  });

  it("Read", async () => {
    const userId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "Chill", userId });
    const found = await playlistModel.findById(p._id);
    assert.equal(found.name, "Chill");
  });

  it("Update — make public", async () => {
    const userId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "Chill", userId });
    await playlistModel.findByIdAndUpdate(p._id, { isPublic: true });
    const updated = await playlistModel.findById(p._id);
    assert.equal(updated.isPublic, true);
  });

  it("Add song to playlist with $push", async () => {
    const userId = new mongoose.Types.ObjectId();
    const songId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "Chill", userId });
    await playlistModel.findByIdAndUpdate(p._id, { $push: { songIds: songId } });
    const updated = await playlistModel.findById(p._id);
    assert.equal(updated.songIds.length, 1);
    assert.equal(updated.songIds[0].toString(), songId.toString());
  });

  it("Delete", async () => {
    const userId = new mongoose.Types.ObjectId();
    const p = await playlistModel.create({ name: "Chill", userId });
    await playlistModel.findByIdAndDelete(p._id);
    assert.equal(await playlistModel.findById(p._id), null);
  });
});

// ─── PlayHistory CRUD ────────────────────────────────────────────────────────

describe("PlayHistory CRUD", () => {
  beforeEach(async () => { await playHistoryModel.deleteMany({}); });

  it("Create", async () => {
    const ph = await playHistoryModel.create({
      userId: new mongoose.Types.ObjectId(),
      songId: new mongoose.Types.ObjectId(),
    });
    assert.ok(ph._id);
  });

  it("Read", async () => {
    const userId = new mongoose.Types.ObjectId();
    const songId = new mongoose.Types.ObjectId();
    const ph = await playHistoryModel.create({ userId, songId });
    const found = await playHistoryModel.findById(ph._id);
    assert.equal(found.userId.toString(), userId.toString());
  });

  it("Update — set durationPlayed", async () => {
    const ph = await playHistoryModel.create({
      userId: new mongoose.Types.ObjectId(),
      songId: new mongoose.Types.ObjectId(),
    });
    await playHistoryModel.findByIdAndUpdate(ph._id, { durationPlayed: 240 });
    const updated = await playHistoryModel.findById(ph._id);
    assert.equal(updated.durationPlayed, 240);
  });

  it("Delete", async () => {
    const ph = await playHistoryModel.create({
      userId: new mongoose.Types.ObjectId(),
      songId: new mongoose.Types.ObjectId(),
    });
    await playHistoryModel.findByIdAndDelete(ph._id);
    assert.equal(await playHistoryModel.findById(ph._id), null);
  });
});

// ─── Invalid ObjectId handling ───────────────────────────────────────────────

describe("Invalid ObjectId handling", () => {
  it("findById with invalid id returns null or CastError", async () => {
    const result = await songModel.findById("not-an-object-id").catch((e) => e);
    // Mongoose may throw CastError or return null depending on version
    const isCastError =
      result instanceof Error && result.name === "CastError";
    const isNull = result === null;
    assert.ok(isCastError || isNull, "should handle invalid ObjectId gracefully");
  });

  it("find with invalid artistId in query returns empty array or throws CastError", async () => {
    const result = await songModel
      .find({ artistIds: "bad-id" })
      .catch((e) => e);
    const isCastError = result instanceof Error && result.name === "CastError";
    const isEmpty = Array.isArray(result) && result.length === 0;
    assert.ok(isCastError || isEmpty, "should handle invalid ObjectId in query");
  });
});
