import { createCookie } from "@remix-run/node";

import { parseCookie } from "./parse-cookie.server";

export const previewModeCookie = createCookie("stage", {
  path: "/",
  sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
  secure: process.env.NODE_ENV !== "development",
  httpOnly: true,
  secrets: [process.env.CONTENTFUL_PREVIEW_SECRET as string],
});

export async function isPreviewMode(request: Request) {
  const cookie = await parseCookie(request, previewModeCookie);

  return cookie?.stage === "draft";
}
