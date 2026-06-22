import { summary } from "@/lib/content";
import SectionHeading from "@/components/SectionHeading";

export default function AboutSection() {
  return (
    <>
      <SectionHeading id="about-heading">About</SectionHeading>
      <div className="flex flex-col gap-4 max-w-2xl">
        {summary.paragraphs.map((para, i) => (
          <p
            key={i}
            className="text-[var(--color-text-secondary)] leading-relaxed text-base"
          >
            {para}
          </p>
        ))}
      </div>
    </>
  );
}
