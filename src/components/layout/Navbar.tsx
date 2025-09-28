"use client";

import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function Navbar() {
  // Determine owner to expose Toolkit link only for authorized user
  const { user } = useUser();
  const ownerId = process.env.NEXT_PUBLIC_OWNER_USER_ID;
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (user && ownerId) {
      setIsOwner(user.id === ownerId);
    } else {
      setIsOwner(false);
    }
  }, [user, ownerId]);

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

        {/* Primary Nav + Social */}
  <nav className="flex items-center space-x-6">
          {/* Internal anchors */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="#about" className="transition-colors hover:text-primary">About</Link>
            <Link href="#projects" className="transition-colors hover:text-primary">Projects</Link>
            <Link href="#tech" className="transition-colors hover:text-primary">Tech</Link>
            <Link href="#contact" className="transition-colors hover:text-primary">Contact</Link>
            {isOwner && (
              <Link href="/toolkit" className="transition-colors hover:text-primary">Toolkit</Link>
            )}
          </div>
          {/* Social Links */}
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
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {ownerId && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-sm font-medium underline-offset-4 hover:underline">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
                </SignedIn>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}