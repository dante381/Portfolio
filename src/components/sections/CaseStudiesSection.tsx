import { caseStudies } from "@/lib/content";
import SectionHeading from "@/components/SectionHeading";
import DagNode from "@/components/DagNode";

export default function CaseStudiesSection() {
  return (
    <>
      <SectionHeading id="case-studies-heading">Case Studies</SectionHeading>
      <p className="text-[var(--color-text-muted)] text-sm mb-8 max-w-xl">
        Production work from Northern Tool &amp; Equipment — each card expands into the full problem → architecture → impact breakdown.
      </p>
      <div className="flex flex-col gap-5">
        {caseStudies.map((study) => (
          <DagNode key={study.id} study={study} />
        ))}
      </div>
    </>
  );
}
