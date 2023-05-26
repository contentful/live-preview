import type { Cookie } from '@remix-run/node';

export const parseCookie = async (request: Request, cookie: Cookie) => {
  const cookieHeader = request.headers.get('Cookie');
  const parsedCookie = (await cookie.parse(cookieHeader)) || {};

  return parsedCookie;
};
