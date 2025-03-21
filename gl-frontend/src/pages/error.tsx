import { useRouteError, Link } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError() as {
    status: number;
    statusText: string;
    message: string;
  };

  if (error.status === 429) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-4xl font-bold text-red-600">Rate Limit Exceeded</h1>
        <p className="mt-4 text-lg text-gray-700">
          You have exceeded the rate limit. Please try again later.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          {error.status} - {error.statusText}
        </p>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
        <Link
          to="/"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600">Error</h1>
      <p className="mt-4 text-lg text-gray-700">
        Something went wrong. Please try again later.
      </p>
      <p className="mt-2 text-sm text-gray-500">
        {error.status} - {error.statusText}
      </p>
      <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      <Link
        to="/"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
      >
        Go to Home
      </Link>
    </div>
  );
}
