import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "../components/auth/LoginPage"; // relative import to resolve module

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <LoginPage />;
}
