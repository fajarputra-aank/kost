import { describe, expect, it } from "vitest";
import { getRequestSessionToken } from "./_core/sessionToken";

describe("request session token", () => {
  it("prefers the session cookie", () => {
    expect(getRequestSessionToken({ headers: { cookie: "app_session_id=cookie-token", authorization: "Bearer bearer-token" } } as never)).toBe("cookie-token");
  });

  it("falls back to bearer authorization when cookies are blocked", () => {
    expect(getRequestSessionToken({ headers: { authorization: "Bearer bearer-token" } } as never)).toBe("bearer-token");
  });
});
