// Replace with the computer's LAN address when running on a physical device.
export const API_BASE_URL = "http://10.214.252.138:3000";

export async function requestJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new Error("Could not connect to the server. Check your connection and retry.");
  }

  if (!response.ok) {
    throw new Error(`The server request failed (${response.status}). Please retry.`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The server returned an invalid response. Please retry.");
  }
}
