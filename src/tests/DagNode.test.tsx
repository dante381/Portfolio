import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DagNode from "@/components/DagNode";
import { caseStudies } from "@/lib/content";

const study = caseStudies[0]; // MDM case study

describe("DagNode", () => {
  it("renders the title and impact headline in collapsed state", () => {
    render(<DagNode study={study} />);
    expect(screen.getByText(study.title)).toBeInTheDocument();
    expect(screen.getByText(study.impactHeadline)).toBeInTheDocument();
  });

  it("does NOT show expanded content when collapsed", () => {
    render(<DagNode study={study} />);
    // Problem text should not be visible in collapsed state
    expect(screen.queryByText(study.problem)).not.toBeInTheDocument();
  });

  it("expands on button click to show problem, tech, and impact", async () => {
    const user = userEvent.setup();
    render(<DagNode study={study} />);

    // Click the expand button (the only button in the component)
    const button = screen.getByRole("button");
    await user.click(button);

    // Problem text should now be visible
    expect(screen.getByText(study.problem)).toBeInTheDocument();
    // Tech chips
    expect(screen.getByText(study.tech[0])).toBeInTheDocument();
    // Impact metrics
    expect(screen.getByText(study.impacts[0])).toBeInTheDocument();
  });

  it("sets aria-expanded=false when collapsed", () => {
    render(<DagNode study={study} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("sets aria-expanded=true after clicking to expand", async () => {
    const user = userEvent.setup();
    render(<DagNode study={study} />);

    const button = screen.getByRole("button");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses again when clicked a second time", async () => {
    const user = userEvent.setup();
    render(<DagNode study={study} />);

    const button = screen.getByRole("button");
    await user.click(button); // expand
    await user.click(button); // collapse
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(study.problem)).not.toBeInTheDocument();
  });

  it("shows architecture steps when expanded", async () => {
    const user = userEvent.setup();
    render(<DagNode study={study} />);

    await user.click(screen.getByRole("button"));

    study.architecture.forEach((step) => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    });
  });

  it("has proper aria-controls linking button to panel", () => {
    render(<DagNode study={study} />);
    const button = screen.getByRole("button");
    const controlsId = button.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(controlsId).toContain(study.id);
  });
});
