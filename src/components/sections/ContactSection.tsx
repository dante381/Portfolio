"use client";

import Link from "next/link";
import { Mail, Download } from "lucide-react";
import { profile } from "@/lib/content";
import { track } from "@/lib/track";
import SectionHeading from "@/components/SectionHeading";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/SocialIcons";

export default function ContactSection() {
  const handleEmailClick = () => {
    track({ type: "click", section: "contact", path: "/" });
  };

  const handleLinkedInClick = () => {
    track({ type: "click", section: "contact", path: "/" });
  };

  const handleGitHubClick = () => {
    track({ type: "click", section: "contact", path: "/" });
  };

  const handleResumeDownload = () => {
    track({ type: "download", section: "contact", path: "/resume.pdf" });
  };

  return (
    <>
      <SectionHeading id="contact-heading">Contact</SectionHeading>
      <div className="max-w-xl flex flex-col gap-8">
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">
          I&apos;m open to data engineering roles — if you have an interesting problem involving
          distributed data, reliability, or lakehouse architecture, let&apos;s talk.
        </p>

        <div className="flex flex-col gap-4">
          {/* Email */}
          <Link
            href={`mailto:${profile.email}`}
            onClick={handleEmailClick}
            className="
              group flex items-center gap-3 text-sm
              text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
              transition-colors focus-visible:outline-[var(--color-accent)]
              focus-visible:outline-2 focus-visible:outline-offset-2 rounded
            "
            aria-label={`Send email to ${profile.email}`}
          >
            <Mail size={16} aria-hidden="true" className="text-[var(--color-accent)] flex-shrink-0" />
            <span>{profile.email}</span>
          </Link>

          {/* LinkedIn */}
          <Link
            href={profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkedInClick}
            className="
              group flex items-center gap-3 text-sm
              text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
              transition-colors focus-visible:outline-[var(--color-accent)]
              focus-visible:outline-2 focus-visible:outline-offset-2 rounded
            "
            aria-label={`LinkedIn profile (opens in new tab)`}
          >
            <LinkedInIcon size={16} aria-hidden="true" className="text-[var(--color-accent)] flex-shrink-0" />
            <span>linkedin.com/in/{profile.linkedin}</span>
          </Link>

          {/* GitHub */}
          <Link
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGitHubClick}
            className="
              group flex items-center gap-3 text-sm
              text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
              transition-colors focus-visible:outline-[var(--color-accent)]
              focus-visible:outline-2 focus-visible:outline-offset-2 rounded
            "
            aria-label={`GitHub profile (opens in new tab)`}
          >
            <GitHubIcon size={16} aria-hidden="true" className="text-[var(--color-accent)] flex-shrink-0" />
            <span>github.com/{profile.github}</span>
          </Link>
        </div>

        {/* Resume download */}
        <div>
          <a
            href="/resume.pdf"
            download="anish-kshirsagar-resume.pdf"
            onClick={handleResumeDownload}
            className="
              inline-flex items-center gap-2 px-5 py-3 rounded-lg
              border border-[var(--color-accent)] text-[var(--color-accent)]
              text-sm font-medium
              hover:bg-[var(--color-accent-dim)] transition-colors duration-200
              focus-visible:outline focus-visible:outline-2
              focus-visible:outline-[var(--color-accent)]
              focus-visible:outline-offset-2
            "
            aria-label="Download résumé as PDF"
          >
            <Download size={15} aria-hidden="true" />
            Download Résumé
          </a>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">PDF · Updated June 2026</p>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-4">
          This site collects anonymous visit data (page views, section engagement) to help me understand
          how visitors interact with the portfolio. No personal data is stored.
        </p>
      </div>
    </>
  );
}
