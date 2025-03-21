import { LoaderFunction, useLoaderData } from "react-router-dom";
import { user, UserResponse } from "../api/user";
import { BadgeAlert, Star } from "lucide-react";
import Chart from "@/components/Chart";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationFirst,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { useCallback } from "react";

const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page"));
  if (isNaN(page) || page < 1) {
    return await user(1);
  }
  return await user(page);
};

export function Home() {
  const user = useLoaderData() as UserResponse;

  const paginationBtns = useCallback(() => {
    if (!user) return null;
    const btns = [];
    for (let i = user.page - 5; i < user.page + 5; i++) {
      if (i < 1 || i > user.total) continue;
      if (i === user.page) {
        btns.push(
          <PaginationItem key={i}>
            <PaginationLink
              className="bg-gray-900 text-white"
              href={`?page=${i}`}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
        continue;
      }
      btns.push(
        <PaginationItem key={i}>
          <PaginationLink
            className="text-gray-900 hover:bg-gray-200"
            href={`?page=${i}`}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationFirst href={`?page=${user.page - 1}`} />
          </PaginationItem>
          {...btns}
          <PaginationItem>
            <PaginationNext href={`?page=${user.total}`} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto flex flex-col gap-20 justify-center items-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8 leading-12">
          GitHub Lens <br /> preview your GitHub statistics
        </h1>
        <a
          href={`${import.meta.env.VITE_GITHUB_LOGIN_URL}?client_id=${
            import.meta.env.VITE_GITHUB_CLIENT_ID
          }&redirect_uri=${import.meta.env.VITE_BASE_URL}${
            import.meta.env.VITE_GITHUB_REDIRECT_URL
          }`}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors shadow-md"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-500 text-white shadow">
        <div className="mx-auto max-w-[1200px] flex gap-2 justify-between p-4">
          <p>
            Welcome {user.userInfo.name} ({user.userInfo.login})
          </p>
          <a href={import.meta.env.VITE_API_URL + "/logout"}>Logout</a>
        </div>
      </div>
      {paginationBtns()}
      <div className="mx-auto max-w-[800px] flex flex-col gap-2 mt-4">
        {user.starredRepos.length ? (
          user.starredRepos.map((repo) => (
            <>
              <Chart data={repo.commits} key={repo.id}>
                <div
                  key={repo.id}
                  className="flex gap-2 justify-between p-4 shadow rounded border border-gray-300 bg-gray-100 text-gray-900"
                >
                  <p>{repo.full_name}</p>
                  <div className="flex gap-2 items-center">
                    <p>{repo.stargazers_count}</p>
                    <Star className="text-yellow-400" fill="yellow" />
                    <p>{repo.open_issues}</p>
                    <BadgeAlert fill="red" />
                  </div>
                </div>
              </Chart>
            </>
          ))
        ) : (
          <div className="flex gap-2 justify-between p-4 shadow rounded border border-gray-300 bg-gray-100 text-gray-900">
            <p>No starred repositories</p>
          </div>
        )}
        {paginationBtns()}
      </div>
    </>
  );
}

Home.loader = loader;
