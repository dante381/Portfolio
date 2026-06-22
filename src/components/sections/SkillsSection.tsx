import { skillGroups } from "@/lib/content";
import SectionHeading from "@/components/SectionHeading";

export default function SkillsSection() {
  return (
    <>
      <SectionHeading id="skills-heading">Skills</SectionHeading>
      {/* Lineage-graph / connected-node layout */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-label="Skill groups"
      >
        {skillGroups.map((group) => (
          <div
            key={group.label}
            className="
              relative rounded-lg border border-[var(--color-border)]
              bg-[var(--color-surface)] p-5
              hover:border-[var(--color-pipeline)] transition-colors duration-200
            "
          >
            {/* Group label — styled as "node header" */}
            <div className="flex items-center gap-2 mb-4">
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full bg-[var(--color-pipeline)] flex-shrink-0"
              />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-pipeline)]">
                {group.label}
              </h3>
            </div>

            {/* Skills as chips */}
            <ul
              className="flex flex-wrap gap-2"
              aria-label={`${group.label} skills`}
            >
              {group.skills.map((skill) => (
                <li key={skill}>
                  <span
                    className="
                      inline-block px-2.5 py-1 rounded text-xs
                      bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]
                      border border-[var(--color-border)]
                    "
                  >
                    {skill}
                  </span>
                </li>
              ))}
            </ul>

            {/* Connector line visual (decorative) */}
            <span
              aria-hidden="true"
              className="absolute top-1/2 -right-3 w-6 h-px bg-[var(--color-border)] hidden lg:block"
            />
          </div>
        ))}
      </div>
    </>
  );
}
