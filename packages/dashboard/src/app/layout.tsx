import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniMCP Platform',
  description: 'Connect any MCP server to any LLM with a single integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
