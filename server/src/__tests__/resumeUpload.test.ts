import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../app";
import { signToken } from "../utils/jwt";

// These tests never reach the database, so the Prisma client is stubbed out.
vi.mock("../config/db", () => ({
  prisma: {},
  checkDatabaseConnection: vi.fn(async () => true),
}));

const token = signToken({ userId: "user-1", email: "a@example.com", role: "USER" });
const auth = { Authorization: `Bearer ${token}` };

describe("POST /api/resumes (upload validation, no database needed)", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/resumes");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: "UNAUTHORIZED" });
  });

  it("returns 400 when no file is sent", async () => {
    const res = await request(app).post("/api/resumes").set(auth);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("FILE_REQUIRED");
  });

  it("rejects unsupported file types", async () => {
    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("resume", Buffer.from("plain text"), { filename: "cv.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("rejects a renamed file whose contents are not a PDF", async () => {
    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("resume", Buffer.from("this is not a pdf"), { filename: "cv.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_FILE_CONTENT");
  });

  it("returns 413 for files over 5 MB", async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 0x20);
    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("resume", big, { filename: "cv.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("FILE_TOO_LARGE");
  });

  it("returns 400 when the file is sent under the wrong field name", async () => {
    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "cv.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("UNEXPECTED_FIELD");
  });

  it("returns a corrupted PDF as UNREADABLE_FILE, not a server error", async () => {
    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("resume", Buffer.from("%PDF-1.4 truncated garbage"), { filename: "cv.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("UNREADABLE_FILE");
  });
});

describe("error shape", () => {
  it("returns JSON for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, code: "NOT_FOUND" });
  });
});
