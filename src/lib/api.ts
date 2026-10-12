const DEFAULT_API = "https://ecotrail-api.46-224-126-66.sslip.io/api";
const DEFAULT_WEB = "https://ecotrail-frontend.vercel.app";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, "");
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB).replace(/\/$/, "");
const API_ORIGIN = API_URL.replace(/\/api$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API request failed with status ${status}`);
  }

  /** Laravel validation errors flattened to the first message per field ("regions.0" → "regions"). */
  get fieldErrors(): Record<string, string> {
    const errors = (this.body as { errors?: Record<string, string[]> } | null)?.errors ?? {};
    const out: Record<string, string> = {};
    for (const [key, messages] of Object.entries(errors)) {
      const field = key.split(".")[0];
      if (!out[field] && messages[0]) out[field] = messages[0];
    }
    return out;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(`${API_URL}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const body = res.headers.get("content-type")?.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

/** Build a query string, with Laravel's key[]= form for arrays. Empty values are dropped. */
export function query(params: Record<string, string | number | boolean | string[] | null | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    if (Array.isArray(value)) value.forEach((v) => parts.push(`${key}[]=${encodeURIComponent(v)}`));
    else parts.push(`${key}=${encodeURIComponent(value === true ? "1" : String(value))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

/** Uploads live on the API host; bundled catalogue photos are served by the website. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/storage/")) return API_ORIGIN + path;
  return WEB_URL + (path.startsWith("/") ? path : `/${path}`);
}
