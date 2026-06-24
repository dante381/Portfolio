// src/lib/content.ts
// Single source of truth for all portfolio content.
// Components MUST import from here — never hardcode strings in components.

// ── Types ──────────────────────────────────────────────────────────────────

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  github: string;
  githubUrl: string;
  linkedin: string;
  linkedinUrl: string;
  phone: string;
}

export interface Summary {
  paragraphs: string[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  companyUrl?: string;
  period: string;
  type: "full-time" | "intern" | "part-time";
  bullets: string[];
}

export interface ArchStep {
  label: string;
  description?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  impactHeadline: string;
  problem: string;
  approach: string;
  architecture: ArchStep[];
  tech: string[];
  impacts: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tech: string[];
  githubUrl: string;
  impact?: string;
}

export interface SkillGroup {
  label: string;
  skills: string[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  location: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

export const profile: Profile = {
  name: "Anish Kshirsagar",
  title: "Data Engineer",
  tagline:
    "Building production-scale data infrastructure — MDM, reliability platforms, and Azure lakehouses that move the needle.",
  location: "Hyderabad → Bangalore, India",
  email: "anishkshirsagar02@gmail.com",
  github: "dante381",
  githubUrl: "https://github.com/dante381",
  linkedin: "anish-kshirsagar02",
  linkedinUrl: "https://linkedin.com/in/anish-kshirsagar02",
  phone: "+91-9908741411",
};

export const summary: Summary = {
  paragraphs: [
    "I'm a Data Engineer with 2+ years of experience designing and shipping production-scale data infrastructure. My work lives at the intersection of data quality, distributed processing, and real-world impact — I care about pipelines that actually run reliably, not just demos that work once.",
    "At Northern Tool + Equipment I built the customer MDM system that collapsed 80M+ duplicate records into a clean 40M-record golden dataset at 90%+ precision, drove a Data Reliability Platform that cut downstream failures by 35%, and architected end-to-end Azure ETL/ELT pipelines across 5+ heterogeneous sources feeding a centralized lakehouse.",
    "I reach for PySpark, Azure (ADF/Synapse/Databricks/Delta Lake), and Python for the heavy lifting, with general AWS ecosystem familiarity (S3, IAM, EC2). Equally comfortable with the unglamorous parts: schema validation, anomaly detection, performance tuning, and on-call debugging at 2 AM.",
  ],
};

export const experience: ExperienceItem[] = [
  {
    id: "nte-de1",
    role: "Data Engineer I",
    company: "Northern Tool + Equipment",
    period: "May 2024 – Present",
    type: "full-time",
    bullets: [
      "Designed and shipped the Customer MDM system using probabilistic record linkage + Spark batch embedding pipelines, reducing 80M+ duplicate records to 40M unique golden records at 90%+ precision and cutting false match rate by 25%.",
      "Built the Enterprise Data Reliability Platform — schema enforcement, null-validation, and anomaly-detection layers that detect silent failures before they reach consumers, reducing downstream issues by 35%.",
      "Architected end-to-end Azure ETL/ELT pipelines from 5+ heterogeneous sources (CRM, ERP, third-party feeds) into a centralized lakehouse using ADF, Synapse, Databricks, and Delta Lake with incremental/partitioned loading.",
      "Tuned Spark jobs and partition strategies to cut pipeline runtimes by 30–40% across critical daily batch workloads.",
    ],
  },
  {
    id: "nte-intern",
    role: "Software Engineering Intern",
    company: "Northern Tool + Equipment",
    period: "September 2023 – April 2024",
    type: "intern",
    bullets: [
      "Developed a Flutter BLE telemetry application for real-time device monitoring, achieving 40% latency reduction and 95%+ user satisfaction in internal testing.",
      "Collaborated with the data team on early ETL prototypes, gaining hands-on experience with Azure Data Factory and the company's source systems.",
    ],
  },
  {
    id: "procareer-ta",
    role: "Teaching Assistant",
    company: "ProCareer Academy",
    period: "August 2023 – September 2023",
    type: "part-time",
    bullets: [
      "Mentored 100+ students in Python programming and backend development fundamentals, conducting code reviews and debugging sessions.",
      "Designed practical assignments and exercises focused on Python, SQL, and backend problem-solving, improving student engagement and problem-solving depth by 40%.",
    ],
  },
];

export const caseStudies: CaseStudy[] = [
  {
    id: "mdm",
    title: "Master Customer Dataset (MDM)",
    impactHeadline: "80M → 40M records · 90%+ precision",
    problem:
      "The customer database contained 80M+ records spread across CRM, ERP, and third-party data feeds — riddled with duplicates, inconsistent formats, and conflicting identities. Sales and marketing were acting on stale, fragmented profiles, directly impacting revenue targeting.",
    approach:
      "Designed a probabilistic record-linkage pipeline on Spark: fingerprint generation → candidate-pair blocking → cosine-similarity scoring on embedding vectors → threshold-based merge decision → golden-record assembly. Iterated on blocking rules and embedding models to hit precision targets without recall collapse.",
    architecture: [
      { label: "Source Ingestion", description: "CRM / ERP / 3rd-party feeds" },
      { label: "Fingerprint & Block", description: "De-dup candidate pairs" },
      { label: "Spark Embedding", description: "Batch cosine similarity" },
      { label: "Match & Score", description: "Probabilistic linkage" },
      { label: "Golden Record", description: "40M unique entities" },
    ],
    tech: ["PySpark", "Azure Databricks", "Delta Lake", "Python", "Cosine Similarity", "Probabilistic Linkage", "Azure Data Factory"],
    impacts: [
      "80M+ → 40M unique golden records",
      "90%+ precision on match decisions",
      "25% reduction in false-positive matches",
      "Single source of truth for CRM/ERP consumers",
    ],
  },
  {
    id: "reliability",
    title: "Enterprise Data Reliability Platform",
    impactHeadline: "−35% downstream failures",
    problem:
      "Silent pipeline failures — schema drift, null explosions, duplicate indexes — were reaching downstream consumers (analytics, reporting, ML features) undetected, causing cascading data quality issues and sales analysis errors that were painful to diagnose after the fact.",
    approach:
      "Built a layered reliability framework woven into the existing ETL: schema-enforcement checks at ingestion, null/threshold validation on critical fields, statistical anomaly detection (z-score + rolling median) on key metrics, and a monitoring/alerting layer that fires before data lands in the lakehouse. Every check produces a structured quality report artifact.",
    architecture: [
      { label: "Raw Ingestion", description: "5+ source systems" },
      { label: "Schema Enforce", description: "Type + field presence" },
      { label: "Null Validate", description: "Critical field checks" },
      { label: "Anomaly Detect", description: "Statistical outlier scan" },
      { label: "Quality Gate", description: "Pass / quarantine / alert" },
    ],
    tech: ["PySpark", "Azure Data Factory", "Azure Synapse", "Python", "Statistical Anomaly Detection", "Delta Lake", "Azure Monitor"],
    impacts: [
      "35% reduction in downstream data issues",
      "Failures caught pre-impact, not post-mortem",
      "Structured quality reports per pipeline run",
      "Reusable validation framework across 5+ pipelines",
    ],
  },
  {
    id: "lakehouse",
    title: "Azure Lakehouse ETL/ELT",
    impactHeadline: "5+ sources → unified lakehouse · −30–40% runtime",
    problem:
      "Data was siloed across five-plus heterogeneous source systems with different schemas, update cadences, and freshness requirements. Analysts and ML teams had no unified, reliable data layer to work from, resulting in duplicated extraction logic and inconsistent metrics.",
    approach:
      "Designed a medallion-architecture lakehouse on Azure: raw → bronze (schema-on-read) → silver (cleansed, conformed) → gold (aggregated, domain-ready). Used ADF for orchestration, Synapse/Databricks for heavy transforms, and Delta Lake for ACID guarantees + time-travel. Implemented incremental/partition-pruning strategies to eliminate full table scans.",
    architecture: [
      { label: "Multi-Source Ingest", description: "ADF orchestration" },
      { label: "Bronze Layer", description: "Raw, schema-on-read" },
      { label: "Silver Layer", description: "Cleansed & conformed" },
      { label: "Gold Layer", description: "Domain aggregates" },
      { label: "Consumers", description: "Analytics / ML / Reporting" },
    ],
    tech: ["Azure Data Factory", "Azure Synapse Analytics", "Azure Databricks", "Delta Lake", "PySpark", "Python", "Incremental Load", "Partitioning"],
    impacts: [
      "5+ heterogeneous sources unified in one lakehouse",
      "30–40% reduction in pipeline runtime",
      "Incremental loads replacing full table scans",
      "Single consistent data layer for analytics + ML",
    ],
  },
];

export const projects: Project[] = [
  {
    id: "pc-monitoring",
    name: "PC Monitoring Platform",
    description:
      "Full-stack system performance dashboard integrating Unreal Engine visualizations with a backend metrics collector. Deployed internally and reduced service-desk tickets by 25% by giving users self-serve visibility into hardware health.",
    tech: ["Unreal Engine", "Python", "Backend Services", "System Metrics"],
    githubUrl: "https://github.com/dante381",
    impact: "−25% service-desk tickets",
  },
  {
    id: "virtual-assistant",
    name: "Virtual Assistant Chatbot",
    description:
      "Conversational AI assistant built full-stack with OpenAI API integration, featuring context management, streaming responses, and a clean chat UI. Designed for extensibility with pluggable tool integrations.",
    tech: ["Python", "OpenAI API", "Node.js", "Full-stack"],
    githubUrl: "https://github.com/dante381",
  },
  {
    id: "smart-home",
    name: "Smart Home Security",
    description:
      "IoT + AI security system combining computer vision and sensor fusion for threat detection. Reduced false alarm rate by 35% over baseline rule-based systems through ML-assisted classification.",
    tech: ["Python", "IoT", "Computer Vision", "AI/ML"],
    githubUrl: "https://github.com/dante381",
    impact: "−35% false alarms",
  },
];

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    skills: ["Python", "SQL", "Java", "C++", "Node.js"],
  },
  {
    label: "Big Data / Spark",
    skills: ["PySpark", "Apache Spark", "Distributed Batch", "Partitioning", "Performance Tuning"],
  },
  {
    label: "Cloud",
    skills: ["Azure Data Factory", "Azure Synapse", "Azure Databricks", "Microsoft Fabric", "Delta Lake", "AWS S3", "AWS IAM", "AWS EC2"],
  },
  {
    label: "Data Engineering",
    skills: ["ETL / ELT", "Data Modeling", "Lakehouse Architecture", "Incremental Load", "Medallion Architecture"],
  },
  {
    label: "Reliability",
    skills: ["Schema Validation", "Data Quality Frameworks", "Anomaly Detection", "Monitoring & Alerting", "Git / CI/CD"],
  },
  {
    label: "ML Data Systems",
    skills: ["Embeddings", "Similarity Search", "Record Linkage", "Clustering", "Vector Ops"],
  },
];

export const education: Education = {
  degree: "B.Tech in Computer Science",
  institution: "Keshav Memorial Institute of Technology (KMIT)",
  period: "2020 – 2024",
  location: "Hyderabad, India",
};

export const navSections = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "case-studies", label: "Case Studies" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof navSections)[number]["id"];
