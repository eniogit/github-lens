export async function login(code: string): Promise<boolean> {
  const url = new URL("/login", import.meta.env.VITE_API_URL);
  const response = await fetch(url, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      state: "123",
    }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return true;
}
