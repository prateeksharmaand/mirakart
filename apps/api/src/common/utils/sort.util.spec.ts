import { buildOrderBy } from "./sort.util";

describe("buildOrderBy", () => {
  const ALLOWED = ["createdAt", "name"] as const;

  it("uses the requested field and direction when allowed", () => {
    expect(buildOrderBy("name", "asc", ALLOWED, "createdAt")).toEqual({ name: "asc" });
  });

  it("falls back to the default field when sortBy is not in the allowlist", () => {
    expect(buildOrderBy("passwordHash", "asc", ALLOWED, "createdAt")).toEqual({ createdAt: "asc" });
  });

  it("falls back to the default field when sortBy is omitted", () => {
    expect(buildOrderBy(undefined, "asc", ALLOWED, "createdAt")).toEqual({ createdAt: "asc" });
  });

  it("defaults sortOrder to desc when omitted", () => {
    expect(buildOrderBy("name", undefined, ALLOWED, "createdAt")).toEqual({ name: "desc" });
  });
});
