import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo/Name */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 text-xl font-bold"
        >
          <span>Romiafan</span>
        </Link>

        {/* Social Links */}
        <nav className="flex items-center space-x-4">
          <Link
            href="https://github.com/romiafan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <Github className="h-5 w-5" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
          <Link
            href="https://www.linkedin.com/in/romi-afan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <Linkedin className="h-5 w-5" />
            <span className="hidden sm:inline">LinkedIn</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}