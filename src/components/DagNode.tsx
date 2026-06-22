"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CaseStudy } from "@/lib/content";

interface DagNodeProps {
  study: CaseStudy;
}

export default function DagNode({ study }: DagNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `dag-panel-${study.id}`;
  const triggerId = `dag-trigger-${study.id}`;

  return (
    <article
      className={[
        "rounded-lg border transition-all duration-200",
        "bg-[var(--color-surface)]",
        expanded
          ? "border-[var(--color-accent)]"
          : "border-[var(--color-border)] hover:border-[var(--color-pipeline)]",
      ].join(" ")}
      aria-label={study.title}
    >
      {/* Collapsed header — always visible */}
      <button
        id={triggerId}
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
        className="
          w-full flex items-center justify-between gap-4 p-6 text-left
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]
          focus-visible:outline-offset-1 rounded-lg
        "
      >
        <div className="flex flex-col gap-1.5">
          {/* Node indicator */}
          <div className="flex items-center gap-2 mb-1">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full bg-[var(--color-accent)]"
            />
            <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
              Case Study
            </span>
          </div>
          <span className="text-base font-semibold text-[var(--color-text-primary)]">
            {study.title}
          </span>
          <span className="text-sm font-medium text-[var(--color-accent)]">
            {study.impactHeadline}
          </span>
        </div>

        <ChevronDown
          aria-hidden="true"
          size={18}
          className={[
            "text-[var(--color-text-muted)] flex-shrink-0 transition-transform duration-200",
            expanded ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="px-6 pb-6 flex flex-col gap-6 border-t border-[var(--color-border)]"
        >
          {/* Problem */}
          <div className="pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-pipeline)] mb-2">
              Problem
            </h4>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {study.problem}
            </p>
          </div>

          {/* Architecture — mini horizontal DAG */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-pipeline)] mb-3">
              Architecture
            </h4>
            <div
              className="flex items-center gap-0 overflow-x-auto pb-2"
              aria-label="Architecture pipeline"
              role="list"
            >
              {study.architecture.map((step, i) => (
                <div key={step.label} className="flex items-center flex-shrink-0" role="listitem">
                  <div
                    className="
                      flex flex-col items-center text-center gap-1
                      px-3 py-2.5 rounded-lg
                      bg-[var(--color-surface-2)] border border-[var(--color-border)]
                      min-w-[90px]
                    "
                  >
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {step.label}
                    </span>
                    {step.description && (
                      <span className="text-[10px] text-[var(--color-text-muted)] leading-tight">
                        {step.description}
                      </span>
                    )}
                  </div>

                  {/* Arrow connector */}
                  {i < study.architecture.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="flex items-center px-1"
                    >
                      <div className="w-4 h-px bg-[var(--color-pipeline)] opacity-60" />
                      <div className="border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-[var(--color-pipeline)] opacity-60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tech chips */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-pipeline)] mb-2">
              Tech
            </h4>
            <ul
              className="flex flex-wrap gap-2"
              aria-label={`Technologies for ${study.title}`}
            >
              {study.tech.map((t) => (
                <li key={t}>
                  <span className="px-2.5 py-1 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-2)]">
                    {t}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Impact metrics */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-pipeline)] mb-2">
              Impact
            </h4>
            <ul
              className="flex flex-col gap-1.5"
              aria-label={`Impact metrics for ${study.title}`}
            >
              {study.impacts.map((impact, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0"
                  />
                  <span className="text-[var(--color-text-secondary)]">{impact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
}
