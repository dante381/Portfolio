"use client";

import { useRef } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";

// Node positions in the SVG viewport (320 × 160)
const NODES = [
  { id: "source", x: 30, y: 80, label: "Source" },
  { id: "ingest", x: 110, y: 40, label: "Ingest" },
  { id: "transform", x: 190, y: 80, label: "Transform" },
  { id: "validate", x: 110, y: 120, label: "Validate" },
  { id: "output", x: 290, y: 80, label: "Output" },
];

const EDGES: [string, string][] = [
  ["source", "ingest"],
  ["source", "validate"],
  ["ingest", "transform"],
  ["validate", "transform"],
  ["transform", "output"],
];

function getNode(id: string) {
  return NODES.find((n) => n.id === id)!;
}

const nodeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.15, type: "spring", stiffness: 200, damping: 18 },
  }),
};

const edgeVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: { delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

export default function HeroPipelineAnim() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // On reduced motion: render static version, no animation
  const animate = !prefersReduced;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      className="w-full max-w-sm opacity-80"
    >
      <svg
        viewBox="0 0 320 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-hidden="true"
      >
        {/* Edges */}
        {EDGES.map(([fromId, toId], i) => {
          const from = getNode(fromId);
          const to = getNode(toId);
          return animate ? (
            <motion.line
              key={`${fromId}-${toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--color-pipeline)"
              strokeWidth={1.5}
              strokeOpacity={0.5}
              strokeDasharray="8 4"
              custom={i}
              variants={edgeVariants}
              initial="hidden"
              animate="visible"
              className="pipeline-edge"
            />
          ) : (
            <line
              key={`${fromId}-${toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--color-pipeline)"
              strokeWidth={1.5}
              strokeOpacity={0.4}
              strokeDasharray="8 4"
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((node, i) => {
          const isOutput = node.id === "output";
          const r = isOutput ? 12 : 9;
          const strokeColor = isOutput
            ? "var(--color-accent)"
            : "var(--color-pipeline)";

          return animate ? (
            <motion.g
              key={node.id}
              custom={i}
              variants={nodeVariants}
              initial="hidden"
              animate="visible"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill="var(--color-surface-2)"
                stroke={strokeColor}
                strokeWidth={isOutput ? 2 : 1.5}
                className={isOutput ? "pipeline-node-pulse" : ""}
              />
              <text
                x={node.x}
                y={node.y + r + 10}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-text-secondary)"
                fontFamily="inherit"
              >
                {node.label}
              </text>
            </motion.g>
          ) : (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill="var(--color-surface-2)"
                stroke={strokeColor}
                strokeWidth={isOutput ? 2 : 1.5}
              />
              <text
                x={node.x}
                y={node.y + r + 10}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-text-secondary)"
                fontFamily="inherit"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
