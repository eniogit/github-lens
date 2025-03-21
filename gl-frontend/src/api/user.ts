import { z } from "zod";

const userSchema = z
  .object({
    userInfo: z.object({
      id: z.number(),
      name: z.string(),
      login: z.string(),
    }),
    starredRepos: z.array(
      z.object({
        id: z.number(),
        full_name: z.string(),
        stargazers_count: z.number(),
        open_issues: z.number(),
        commits: z.array(
          z.object({
            date: z.string(),
            count: z.number(),
          })
        ),
      })
    ),
    total: z.number(),
    page: z.number(),
  })
  .required();

export type UserResponse = z.infer<typeof userSchema>;

export async function user(page: number = 1): Promise<UserResponse | null> {
  const url = new URL("/user", import.meta.env.VITE_API_URL);
  url.searchParams.append("provider", "github");
  url.searchParams.append("page", page.toString());
  const user = await fetch(url, {
    credentials: "include",
  });

  if (user.status === 403 || user.status === 401) {
    // User is not logged in
    return null;
  }
  if (!user.ok) {
    const error = await user.json();
    throw new Response(error.message, {
      status: user.status,
      statusText: user.statusText,
    });
  }
  const userData = await userSchema.parseAsync(await user.json());

  return userData;
}
