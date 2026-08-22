import { createFileRoute } from "@tanstack/react-router";
import { AppProvider } from "../state/app-context.tsx"; // Adjust import path according to your project structure
import { AppShell } from "../components/layout/AppShell.tsx"; // Adjust import path according to your project structure

export const Route = createFileRoute("/app")({
  component: AppPage,
});

function AppPage() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
