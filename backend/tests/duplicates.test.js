/**
 * tests/duplicates.test.js
 * Tests duplicate-key prevention on unique indexes.
 */

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import userModel from "../models/userModel.js";
import artistModel from "../models/artistModel.js";

const MONGO_URI =
  process.env.TEST_MONGODB_URI ||
  "mongodb://localhost:27017/synthesia_test_duplicates";

before(async () => {
  await mongoose.connect(MONGO_URI);
  // Ensure indexes are built
  await userModel.ensureIndexes();
  await artistModel.ensureIndexes();
});

after(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (err) {}
  await mongoose.disconnect();
});

// ─── User email uniqueness ───────────────────────────────────────────────────

describe("User email uniqueness", () => {
  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it("inserting same email twice throws duplicate key error", async () => {
    await userModel.create({ name: "Alice", email: "dupe@test.com", password: "pw1" });
    const err = await userModel
      .create({ name: "Alice2", email: "dupe@test.com", password: "pw2" })
      .catch((e) => e);
    assert.ok(err, "should throw an error");
    assert.equal(err.code, 11000, "MongoDB duplicate key error code");
  });

  it("different emails can coexist", async () => {
    await userModel.create({ name: "A", email: "a@test.com", password: "pw" });
    await userModel.create({ name: "B", email: "b@test.com", password: "pw" });
    const count = await userModel.countDocuments();
    assert.equal(count, 2);
  });
});

// ─── Artist musicbrainz uniqueness ──────────────────────────────────────────

describe("Artist externalIds.musicbrainz uniqueness", () => {
  beforeEach(async () => {
    await artistModel.deleteMany({});
  });

  it("inserting same musicbrainz id twice throws duplicate key error", async () => {
    await artistModel.create({
      name: "Artist One",
      externalIds: { musicbrainz: "mbid-123" },
    });
    const err = await artistModel
      .create({
        name: "Artist Two",
        externalIds: { musicbrainz: "mbid-123" },
      })
      .catch((e) => e);
    assert.ok(err, "should throw an error");
    assert.equal(err.code, 11000, "MongoDB duplicate key error code");
  });

  it("artists without musicbrainz id do not conflict (sparse index)", async () => {
    // Both have no musicbrainz — sparse index allows multiple nulls
    await artistModel.create({ name: "No MB Artist 1" });
    await artistModel.create({ name: "No MB Artist 2" });
    const count = await artistModel.countDocuments();
    assert.equal(count, 2, "sparse index should allow multiple documents without the field");
  });

  it("upsert by musicbrainz id updates existing doc instead of inserting", async () => {
    await artistModel.create({
      name: "Original",
      externalIds: { musicbrainz: "mbid-upsert" },
    });

    await artistModel.updateOne(
      { "externalIds.musicbrainz": "mbid-upsert" },
      { $set: { name: "Updated" } },
      { upsert: true }
    );

    const count = await artistModel.countDocuments({
      "externalIds.musicbrainz": "mbid-upsert",
    });
    assert.equal(count, 1, "upsert should not create a duplicate");

    const doc = await artistModel.findOne({ "externalIds.musicbrainz": "mbid-upsert" });
    assert.equal(doc.name, "Updated");
  });
});
