"use client";

import { useState, useCallback } from "react";
import { SectionId } from "@/lib/content";
import LeftColumn from "@/components/LeftColumn";
import Nav from "@/components/Nav";
import SectionWrapper from "@/components/SectionWrapper";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import CaseStudiesSection from "@/components/sections/CaseStudiesSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import ContactSection from "@/components/sections/ContactSection";

export default function PortfolioLayout() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  const handleSectionVisible = useCallback((id: SectionId) => {
    setActiveSection(id);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile top nav */}
      <div
        className="
          lg:hidden sticky top-0 z-40
          bg-[var(--color-bg)]/90 backdrop-blur border-b border-[var(--color-border)]
          px-6 py-3
        "
      >
        <Nav activeSection={activeSection} />
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-6 lg:grid lg:grid-cols-[var(--nav-width)_1fr] lg:gap-12">
        {/* Left: sticky sidebar */}
        <div className="hidden lg:block">
          <LeftColumn activeSection={activeSection} />
        </div>

        {/* Right: scrolling content */}
        <main id="main-content" tabIndex={-1} aria-label="Portfolio content">
          {/* Hero (not wrapped in SectionWrapper — no IntersectionObserver needed) */}
          <HeroSection />

          <SectionWrapper id="about" onSectionVisible={handleSectionVisible}>
            <AboutSection />
          </SectionWrapper>

          <SectionWrapper id="skills" onSectionVisible={handleSectionVisible}>
            <SkillsSection />
          </SectionWrapper>

          <SectionWrapper id="experience" onSectionVisible={handleSectionVisible}>
            <ExperienceSection />
          </SectionWrapper>

          <SectionWrapper id="case-studies" onSectionVisible={handleSectionVisible}>
            <CaseStudiesSection />
          </SectionWrapper>

          <SectionWrapper id="projects" onSectionVisible={handleSectionVisible}>
            <ProjectsSection />
          </SectionWrapper>

          <SectionWrapper id="contact" onSectionVisible={handleSectionVisible}>
            <ContactSection />
          </SectionWrapper>

          {/* Footer */}
          <footer className="py-8 border-t border-[var(--color-border)] mt-8">
            <p className="text-xs text-[var(--color-text-muted)] text-center">
              Built with Next.js + Tailwind · {new Date().getFullYear()} Anish Kshirsagar
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
