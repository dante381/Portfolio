import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Nav from "@/components/Nav";
import { navSections, SectionId } from "@/lib/content";

// Mock scrollIntoView (jsdom doesn't implement it)
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  // Create mock section elements for navigation
  navSections.forEach(({ id }) => {
    if (!document.getElementById(id)) {
      const el = document.createElement("section");
      el.id = id;
      document.body.appendChild(el);
    }
  });
});

describe("Nav", () => {
  it("renders all section links", () => {
    render(<Nav activeSection={null} />);
    navSections.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("marks the active section with aria-current='location'", () => {
    const activeId: SectionId = "experience";
    render(<Nav activeSection={activeId} />);

    const activeLink = screen.getByText("Experience").closest("a");
    expect(activeLink).toHaveAttribute("aria-current", "location");
  });

  it("does not mark non-active sections with aria-current", () => {
    render(<Nav activeSection="about" />);

    const experienceLink = screen.getByText("Experience").closest("a");
    expect(experienceLink).not.toHaveAttribute("aria-current");
  });

  it("calls scrollIntoView when a nav link is clicked", async () => {
    const user = userEvent.setup();
    render(<Nav activeSection={null} />);

    const aboutLink = screen.getByText("About").closest("a")!;
    await user.click(aboutLink);

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("has a nav landmark element", () => {
    render(<Nav activeSection={null} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("active link has teal accent color class", () => {
    render(<Nav activeSection="skills" />);
    const skillsLink = screen.getByText("Skills").closest("a")!;
    expect(skillsLink.className).toContain("text-[var(--color-accent)]");
  });

  it("inactive links have muted color class", () => {
    render(<Nav activeSection="skills" />);
    const aboutLink = screen.getByText("About").closest("a")!;
    expect(aboutLink.className).toContain("text-[var(--color-text-muted)]");
  });
});
