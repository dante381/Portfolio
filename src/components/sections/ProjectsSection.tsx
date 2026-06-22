import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { projects, profile } from "@/lib/content";
import SectionHeading from "@/components/SectionHeading";

export default function ProjectsSection() {
  return (
    <>
      <SectionHeading id="projects-heading">Projects</SectionHeading>
      <p className="text-[var(--color-text-muted)] text-sm mb-8 max-w-xl">
        Earlier personal and academic work.{" "}
        <Link
          href={profile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-accent)] hover:underline focus-visible:outline-[var(--color-accent)] focus-visible:outline-2 rounded"
          aria-label="View all projects on GitHub"
        >
          View all on GitHub
        </Link>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <article
            key={project.id}
            className="
              flex flex-col gap-3 p-5 rounded-lg
              bg-[var(--color-surface)] border border-[var(--color-border)]
              hover:border-[var(--color-pipeline)] transition-colors duration-200
            "
            aria-label={project.name}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                {project.name}
              </h3>
              <Link
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.name} on GitHub (opens in new tab)`}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors flex-shrink-0 focus-visible:outline-[var(--color-accent)] focus-visible:outline-2 rounded"
              >
                <ExternalLink size={15} aria-hidden="true" />
              </Link>
            </div>

            {project.impact && (
              <span className="text-xs font-medium text-[var(--color-accent)]">
                {project.impact}
              </span>
            )}

            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
              {project.description}
            </p>

            <ul className="flex flex-wrap gap-2 mt-auto" aria-label={`Technologies for ${project.name}`}>
              {project.tech.map((t) => (
                <li key={t}>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    {t}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
}
