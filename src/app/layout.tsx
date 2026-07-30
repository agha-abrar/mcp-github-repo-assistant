import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP-Powered GitHub Repo Assistant",
  description:
    "Fetch real repository data through an MCP-style layer and get an AI-generated project report: issue triage, PR summary, doc gaps, sprint plan, and a health score.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-bg text-ink min-h-screen">{children}</body>
    </html>
  );
}
