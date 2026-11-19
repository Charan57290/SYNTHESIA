# SYNTHESIA Backend Tests

## Overview

All test files live in `backend/tests/` and use **Node.js built-in `node:test`** runner (available from Node 18+). No extra test framework is needed. Tests run against an isolated MongoDB database and are safe to run at any time — they never touch production data.

---

## Running Tests

```bash
# From the backend/ directory:
npm test
```

This runs all `*.test.js` files in the `tests/` directory using Node's native test runner.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TEST_MONGODB_URI` | `mongodb://localhost:27017/synthesia_test_<suite>` | Override the test MongoDB connection string. Each test file uses its own unique DB name suffix to avoid cross-suite interference. |

### Custom URI example

```bash
TEST_MONGODB_URI="mongodb://localhost:27017/my_test_db" npm test
```

> [!NOTE]
> When `TEST_MONGODB_URI` is set, the same URI is used for all test files. Each file still runs `dropDatabase()` in its `after()` hook, so they will drop the entire specified database when done. For parallel safety, leave `TEST_MONGODB_URI` unset so each file gets its own named database.

---

## Test Files

| File | What it tests |
|---|---|
| `tests/models.test.js` | Schema validations, required fields, defaults, unique indexes for all 6 models |
| `tests/relationships.test.js` | ObjectId cross-document references and `.populate()` behavior |
| `tests/duplicates.test.js` | Unique index enforcement (email, musicbrainz id), upsert safety |
| `tests/aggregations.test.js` | `genreDistribution`, `mostPlayedFromHistory`, `topSongs` pipelines |
| `tests/crud.test.js` | Full CRUD for every model, `runValidators` on update, invalid ObjectId handling |

---

## Requirements

- **Node.js 18+** (node:test is built-in; Node 26 is fully supported)
- **MongoDB running locally** on `localhost:27017` (or provide `TEST_MONGODB_URI`)
- **npm dependencies installed** (`npm install` in `backend/`)

---

## How Tests Are Isolated

- Each test file connects to a **dedicated database** (e.g. `synthesia_test_models`, `synthesia_test_crud`).
- A `before()` hook connects to MongoDB at the start of each suite.
- A `beforeEach()` hook runs `deleteMany({})` on relevant collections before every test.
- An `after()` hook drops the entire database and disconnects when the suite finishes.

This ensures:
- ✅ No data leaks between test runs
- ✅ No interference with production or development databases
- ✅ Tests are deterministic and order-independent

---

## Adding New Tests

1. Create `tests/<feature>.test.js`
2. Use a unique `MONGO_URI` suffix:
   ```js
   const MONGO_URI = process.env.TEST_MONGODB_URI ||
     "mongodb://localhost:27017/synthesia_test_<feature>";
   ```
3. Add `before`/`after` hooks to connect/disconnect and `beforeEach` to clean collections.
4. Import from `node:test` and `node:assert/strict`.

No configuration changes needed — `npm test` will pick up any file matching `tests/*.test.js`.
