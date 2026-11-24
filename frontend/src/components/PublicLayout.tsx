import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function PublicLayout() {
  return (
    <div className="public-site flex min-h-screen flex-col bg-canvas text-ink transition-colors duration-300 dark:bg-obsidian dark:text-stone-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
