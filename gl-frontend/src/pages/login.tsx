import { LoaderFunction, redirect } from "react-router-dom";
import { login } from "../api/login";

export const loader: LoaderFunction = async ({ request }) => {
  const query = new URL(request.url).searchParams;
  const code = query.get("code");

  if (!code) {
    throw new Error("No code provided");
  }

  await login(code);

  return redirect("/");
};
