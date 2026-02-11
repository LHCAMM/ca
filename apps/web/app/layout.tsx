import "./globals.css";
import { Nav } from "../components/Nav";

export const metadata = { title: "Mission Control" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="p-6 space-y-4">
        <Nav />
        {children}
      </body>
    </html>
  );
}
