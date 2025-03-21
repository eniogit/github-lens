import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { Home } from "./pages/home";
import "./index.css";
import { loader } from "./pages/login";
import { ErrorPage } from "./pages/error";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    loader: Home.loader,
    errorElement: <ErrorPage />,
  },
  {
    path: import.meta.env.VITE_GITHUB_REDIRECT_URL,
    loader: loader,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
