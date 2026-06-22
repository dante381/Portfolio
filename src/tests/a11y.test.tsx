import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import DagNode from "@/components/DagNode";
import Nav from "@/components/Nav";
import ContactSection from "@/components/sections/ContactSection";
import AboutSection from "@/components/sections/AboutSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import SkillsSection from "@/components/sections/SkillsSection";
import { caseStudies } from "@/lib/content";

// Mock track for ContactSection
vi.mock("@/lib/track", () => ({ track: vi.fn() }));

/**
 * Assert no axe violations. We check the violations array directly
 * (avoids Vi namespace augmentation issues with vitest v4).
 */
async function assertNoViolations(container: Element) {
  const results = await axe(container);
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  if (serious.length > 0) {
    const details = serious
      .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
      .join("\n");
    throw new Error(`Axe found ${serious.length} serious/critical violations:\n${details}`);
  }
  // Non-blocking: log minor/moderate
  const minor = results.violations.filter(
    (v) => v.impact !== "critical" && v.impact !== "serious"
  );
  if (minor.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      "Non-critical axe issues:",
      minor.map((v) => v.id).join(", ")
    );
  }
  expect(serious).toHaveLength(0);
}

describe("Accessibility (axe) — 0 serious/critical violations", () => {
  it("Nav has no serious/critical violations", async () => {
    const { container } = render(<Nav activeSection="about" />);
    await assertNoViolations(container);
  });

  it("DagNode (collapsed) has no serious/critical violations", async () => {
    const { container } = render(
      <main>
        <DagNode study={caseStudies[0]} />
      </main>
    );
    await assertNoViolations(container);
  });

  it("DagNode (expanded) has no serious/critical violations", async () => {
    const { container } = render(
      <main>
        <DagNode study={caseStudies[0]} />
      </main>
    );
    const button = container.querySelector("button")!;
    button.click();
    await new Promise((r) => setTimeout(r, 0));
    await assertNoViolations(container);
  });

  it("ContactSection has no serious/critical violations", async () => {
    const { container } = render(
      <main>
        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading">Contact</h2>
          <ContactSection />
        </section>
      </main>
    );
    await assertNoViolations(container);
  });

  it("AboutSection has no serious/critical violations", async () => {
    const { container } = render(
      <main>
        <section aria-labelledby="about-heading">
          <AboutSection />
        </section>
      </main>
    );
    await assertNoViolations(container);
  });

  it("ExperienceSection has no serious/critical violations", async () => {
    const { container } = render(
      <main>
        <section aria-labelledby="experience-heading">
          <ExperienceSection />
        </section>
      </main>
    );
    await assertNoViolations(container);
  });

  it("SkillsSection has no serious/critical violations", async () => {
    const { container } = render(
      <main>
        <section aria-labelledby="skills-heading">
          <SkillsSection />
        </section>
      </main>
    );
    await assertNoViolations(container);
  });
});
