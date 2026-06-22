"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { profile, SectionId } from "@/lib/content";
import Nav from "./Nav";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/SocialIcons";

interface LeftColumnProps {
  activeSection: SectionId | null;
}

export default function LeftColumn({ activeSection }: LeftColumnProps) {
  return (
    <aside
      className="
        flex flex-col justify-between gap-8
        lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto
        py-16 lg:py-24
      "
      aria-label="Profile and navigation"
    >
      {/* Top: Name / title / tagline */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] lg:text-5xl">
            <Link
              href="/"
              className="hover:text-[var(--color-accent)] transition-colors focus-visible:outline-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
            >
              {profile.name}
            </Link>
          </h1>
          <h2 className="mt-3 text-lg font-medium text-[var(--color-accent)] tracking-wide">
            {profile.title}
          </h2>
          <p className="mt-4 max-w-xs text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {profile.tagline}
          </p>
        </div>

        {/* Nav */}
        <div className="hidden lg:block mt-4">
          <Nav activeSection={activeSection} />
        </div>
      </div>

      {/* Bottom: Social links */}
      <div className="flex items-center gap-5">
        <Link
          href={profile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`GitHub profile of ${profile.github}`}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors p-1 rounded focus-visible:outline-[var(--color-accent)] focus-visible:outline-2"
        >
          <GitHubIcon size={20} aria-hidden="true" />
        </Link>
        <Link
          href={profile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`LinkedIn profile of ${profile.name}`}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors p-1 rounded focus-visible:outline-[var(--color-accent)] focus-visible:outline-2"
        >
          <LinkedInIcon size={20} aria-hidden="true" />
        </Link>
        <Link
          href={`mailto:${profile.email}`}
          aria-label={`Email ${profile.name}`}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors p-1 rounded focus-visible:outline-[var(--color-accent)] focus-visible:outline-2"
        >
          <Mail size={20} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
