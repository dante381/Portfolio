interface SectionHeadingProps {
  id: string;
  children: React.ReactNode;
}

export default function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className="mb-8 text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] flex items-center gap-3"
    >
      <span aria-hidden="true" className="inline-block w-8 h-px bg-[var(--color-accent)]" />
      {children}
    </h2>
  );
}
