import { experience } from "@/lib/content";
import SectionHeading from "@/components/SectionHeading";

const typeBadge: Record<string, string> = {
  "full-time": "Full-time",
  intern: "Intern",
  "part-time": "Part-time",
};

export default function ExperienceSection() {
  return (
    <>
      <SectionHeading id="experience-heading">Experience</SectionHeading>
      <ol className="flex flex-col gap-0" aria-label="Work experience timeline">
        {experience.map((item, idx) => (
          <li key={item.id} className="relative flex gap-6">
            {/* Timeline rail */}
            <div
              className="flex flex-col items-center flex-shrink-0"
              aria-hidden="true"
            >
              {/* Dot */}
              <div className="w-3 h-3 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-bg)] mt-1 flex-shrink-0" />
              {/* Connector */}
              {idx < experience.length - 1 && (
                <div className="flex-1 w-px bg-[var(--color-border)] mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-12 last:pb-0">
              {/* Period */}
              <p className="text-xs font-mono text-[var(--color-text-muted)] mb-1">
                {item.period}
              </p>

              {/* Role + Company */}
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {item.role}
                </h3>
                <span className="text-[var(--color-accent)] text-sm font-medium">
                  @ {item.company}
                </span>
                <span className="text-[var(--color-text-muted)] text-xs px-2 py-0.5 rounded border border-[var(--color-border)]">
                  {typeBadge[item.type]}
                </span>
              </div>

              {/* Bullets */}
              <ul className="flex flex-col gap-2 mt-3" role="list">
                {item.bullets.map((bullet, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--color-pipeline)] flex-shrink-0"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
