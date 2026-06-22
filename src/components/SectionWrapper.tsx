"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";
import { SectionId } from "@/lib/content";

interface SectionWrapperProps {
  id: SectionId;
  children: React.ReactNode;
  className?: string;
  onSectionVisible?: (id: SectionId) => void;
}

export default function SectionWrapper({
  id,
  children,
  className = "",
  onSectionVisible,
}: SectionWrapperProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onSectionVisible?.(id);
            track({ type: "scroll", section: id, path: "/" });
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [id, onSectionVisible]);

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`py-16 lg:py-24 scroll-mt-8 ${className}`}
    >
      {children}
    </section>
  );
}
