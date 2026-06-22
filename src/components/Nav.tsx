"use client";

import { navSections, SectionId } from "@/lib/content";

interface NavProps {
  activeSection: SectionId | null;
}

export default function Nav({ activeSection }: NavProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.focus({ preventScroll: true });
    }
  };

  return (
    <nav aria-label="Page sections">
      <ul className="flex flex-col gap-1" role="list">
        {navSections.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                aria-current={isActive ? "location" : undefined}
                className={[
                  "group flex items-center gap-3 py-2 transition-all duration-200",
                  "text-sm font-medium tracking-widest uppercase",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded",
                  isActive
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                {/* Indicator line */}
                <span
                  aria-hidden="true"
                  className={[
                    "inline-block h-px transition-all duration-300",
                    isActive
                      ? "w-12 bg-[var(--color-accent)]"
                      : "w-6 bg-[var(--color-text-muted)] group-hover:w-10 group-hover:bg-[var(--color-text-secondary)]",
                  ].join(" ")}
                />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
