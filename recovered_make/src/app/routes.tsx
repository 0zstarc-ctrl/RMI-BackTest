import { createBrowserRouter } from "react-router";
import { BackTestPage } from "./pages/BackTestPage";
import { ResultPage } from "./pages/ResultPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: BackTestPage,
  },
  {
    path: "/result",
    Component: ResultPage,
  },
]);
