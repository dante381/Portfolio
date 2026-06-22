"use client";

import { useEffect } from "react";
import { profile } from "@/lib/content";
import { track } from "@/lib/track";
import HeroPipelineAnim from "@/components/HeroPipelineAnim";

export default function HeroSection() {
  useEffect(() => {
    track({ type: "view", path: "/" });
  }, []);

  return (
    <section
      aria-label="Introduction"
      className="flex flex-col gap-10 pt-16 pb-8 lg:pt-24 lg:pb-12"
    >
      {/* Mobile-only: name + title (hidden on lg where LeftColumn shows it) */}
      <div className="lg:hidden">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {profile.name}
        </h1>
        <p className="mt-2 text-lg font-medium text-[var(--color-accent)]">
          {profile.title}
        </p>
        <p className="mt-3 text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-sm">
          {profile.tagline}
        </p>
      </div>

      {/* DAG Pipeline animation */}
      <div className="flex justify-start">
        <HeroPipelineAnim />
      </div>

      {/* Subtitle chips */}
      <div
        className="flex flex-wrap gap-2"
        aria-label="Key technologies"
      >
        {["PySpark", "Azure Databricks", "Delta Lake", "Data Reliability", "MDM"].map((chip) => (
          <span
            key={chip}
            className="px-3 py-1 rounded-full text-xs font-medium border border-[var(--color-pipeline)] text-[var(--color-pipeline)] bg-[var(--color-pipeline-dim)]"
          >
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
