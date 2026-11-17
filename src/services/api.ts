// Replace with the computer's LAN address when running on a physical device.
export const API_BASE_URL = "http://10.214.252.138:3000";

export class ApiError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = "ApiError";
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === null;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError("Could not connect to the server. Check your connection and retry.", null);
  }

  if (!response.ok) {
    throw new ApiError(`The server request failed (${response.status}). Please retry.`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("The server returned an invalid response. Please retry.", response.status);
  }
}
