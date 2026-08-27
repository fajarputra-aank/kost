import type { Request } from "express";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";

export function getRequestSessionToken(req: Pick<Request, "headers">) {
  const cookieToken = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authorization = req.headers.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}
