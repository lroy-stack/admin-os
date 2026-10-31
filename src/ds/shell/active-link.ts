/** True when `pathname` is `url` or lives under it. */
export function isActiveLink(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}
