/**
 * tests/aggregations.test.js
 * Tests aggregation pipelines from aggregationService.js.
 */

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import songModel from "../models/songModel.js";
import playHistoryModel from "../models/playHistoryModel.js";
import userModel from "../models/userModel.js";

import {
  genreDistribution,
  mostPlayedFromHistory,
  topSongs,
} from "../services/aggregationService.js";

const MONGO_URI =
  process.env.TEST_MONGODB_URI ||
  "mongodb://localhost:27017/synthesia_test_aggregations";

before(async () => {
  await mongoose.connect(MONGO_URI);
});

after(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (err) {}
  await mongoose.disconnect();
});

// ─── genreDistribution ───────────────────────────────────────────────────────

describe("genreDistribution aggregation", () => {
  beforeEach(async () => {
    await songModel.deleteMany({});
  });

  it("returns [] on empty DB without throwing", async () => {
    const result = await genreDistribution();
    assert.deepEqual(result, []);
  });

  it("counts genres correctly and sorts desc", async () => {
    await songModel.insertMany([
      { name: "E1", genre: "electronic" },
      { name: "E2", genre: "electronic" },
      { name: "E3", genre: "electronic" },
      { name: "J1", genre: "jazz" },
      { name: "J2", genre: "jazz" },
    ]);

    const result = await genreDistribution();
    assert.ok(result.length >= 2, "should have at least 2 genres");

    const electronic = result.find((r) => r.genre === "electronic");
    const jazz = result.find((r) => r.genre === "jazz");

    assert.ok(electronic, "electronic genre missing");
    assert.ok(jazz, "jazz genre missing");
    assert.equal(electronic.count, 3);
    assert.equal(jazz.count, 2);

    // Sorted descending — electronic should come first
    const eIdx = result.findIndex((r) => r.genre === "electronic");
    const jIdx = result.findIndex((r) => r.genre === "jazz");
    assert.ok(eIdx < jIdx, "electronic (3) should sort before jazz (2)");
  });

  it("excludes songs with empty string genre", async () => {
    await songModel.insertMany([
      { name: "NoGenre", genre: "" },
      { name: "WithGenre", genre: "pop" },
    ]);
    const result = await genreDistribution();
    const empty = result.find((r) => r.genre === "");
    assert.ok(!empty, "empty genre should be excluded");
  });
});

// ─── mostPlayedFromHistory ────────────────────────────────────────────────────

describe("mostPlayedFromHistory aggregation", () => {
  beforeEach(async () => {
    await Promise.all([
      songModel.deleteMany({}),
      playHistoryModel.deleteMany({}),
    ]);
  });

  it("returns [] on empty DB without throwing", async () => {
    const result = await mostPlayedFromHistory();
    assert.deepEqual(result, []);
  });

  it("returns songs sorted by play count descending", async () => {
    const song1 = await songModel.create({ name: "Hit Song" });
    const song2 = await songModel.create({ name: "Deep Cut" });
    const userId = new mongoose.Types.ObjectId();

    // song1 played 3 times, song2 played 1 time
    await playHistoryModel.insertMany([
      { userId, songId: song1._id },
      { userId, songId: song1._id },
      { userId, songId: song1._id },
      { userId, songId: song2._id },
    ]);

    const result = await mostPlayedFromHistory(10);
    assert.ok(result.length >= 2, "should have at least 2 entries");

    // First entry should be song1
    assert.equal(result[0].songName, "Hit Song");
    assert.equal(result[0].plays, 3);
    assert.equal(result[1].songName, "Deep Cut");
    assert.equal(result[1].plays, 1);
  });

  it("respects the limit parameter", async () => {
    const userId = new mongoose.Types.ObjectId();
    // Create 5 songs each played once
    for (let i = 0; i < 5; i++) {
      const song = await songModel.create({ name: `Song ${i}` });
      await playHistoryModel.create({ userId, songId: song._id });
    }

    const result = await mostPlayedFromHistory(3);
    assert.equal(result.length, 3, "limit should be respected");
  });
});

// ─── topSongs ─────────────────────────────────────────────────────────────────

describe("topSongs aggregation", () => {
  beforeEach(async () => {
    await songModel.deleteMany({});
  });

  it("returns [] on empty DB without throwing", async () => {
    const result = await topSongs();
    assert.deepEqual(result, []);
  });

  it("sorts by playCount descending", async () => {
    await songModel.insertMany([
      { name: "Popular", playCount: 1000 },
      { name: "Niche", playCount: 10 },
      { name: "Moderate", playCount: 500 },
    ]);

    const result = await topSongs(3);
    assert.equal(result[0].name, "Popular");
    assert.equal(result[1].name, "Moderate");
    assert.equal(result[2].name, "Niche");
  });
});
