import { version } from "../package.json";

/** Keep un-hashed data coherent when an older installed worker still controls a tab. */
export const ASSET_REVISION = version;
export function assetURL(path: string, base: URL): URL {
  const url = new URL(path, base);
  url.searchParams.set("v", ASSET_REVISION);
  return url;
}
