import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactSection from "@/components/sections/ContactSection";

// Mock the track module to spy on calls
vi.mock("@/lib/track", () => ({
  track: vi.fn(),
}));

import { track } from "@/lib/track";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ContactSection", () => {
  it("renders email link", () => {
    render(<ContactSection />);
    const emailLink = screen.getByRole("link", { name: /send email/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("renders LinkedIn link", () => {
    render(<ContactSection />);
    const linkedinLink = screen.getByRole("link", { name: /linkedin/i });
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute("href", expect.stringContaining("linkedin.com"));
  });

  it("renders GitHub link", () => {
    render(<ContactSection />);
    const githubLink = screen.getByRole("link", { name: /github/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute("href", expect.stringContaining("github.com"));
  });

  it("renders the resume download button", () => {
    render(<ContactSection />);
    const downloadBtn = screen.getByRole("link", { name: /download résumé/i });
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn).toHaveAttribute("href", "/resume.pdf");
    expect(downloadBtn).toHaveAttribute("download");
  });

  it("calls track with type=click when email link is clicked", async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    const emailLink = screen.getByRole("link", { name: /send email/i });
    await user.click(emailLink);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ type: "click", section: "contact" })
    );
  });

  it("calls track with type=download when resume link is clicked", async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    const downloadBtn = screen.getByRole("link", { name: /download résumé/i });
    await user.click(downloadBtn);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ type: "download", path: "/resume.pdf" })
    );
  });
});
