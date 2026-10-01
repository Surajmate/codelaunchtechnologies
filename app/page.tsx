"use client";

import AuthModal from "@/components/auth/AuthModal";

import {
  ArrowRight,
  Award,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  Globe2,
  Layers3,
  // Linkedin,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Network,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";

import Link from "next/link";
import { useState } from "react";

/*
 * ==========================================================================
 * COMPANY CONTACT DETAILS
 * ==========================================================================
 *
 * Keep these values in one place so they can easily be changed later.
 *
 * Replace the email/address below with the exact values already used
 * by Codelaunch in your current project.
 *
 * ==========================================================================
 */

const COMPANY_EMAIL = "info@codelaunchtechnologies.com";
const COMPANY_WEBSITE = "https://www.codelaunchtechnologies.com";

const COMPANY_PHONE = "9226283699";
const ENQUIRY_NUMBERS = ["7999139862", "7974291753", "7225960304"];
const HR_NUMBER = "7898311081";

const COMPANY_EMAILS = [
  "accounts@codelaunchtechnologies.com",
  "contact@codelaunchtechnologies.com",
  "hr@codelaunchtechnologies.com",
  "info@codelaunchtechnologies.com",
];
const COMPANY_ADDRESS = "Pune, Maharashtra, India, 412101";

const WHATSAPP_NUMBER = `91${COMPANY_PHONE}`;
const WHATSAPP_DISPLAY = COMPANY_PHONE;

const LINKEDIN_URL =
  "https://www.linkedin.com/company/135757823";

/*
 * ==========================================================================
 * PAGE
 * ==========================================================================
 */

export default function Home() {
  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [authOpen, setAuthOpen] =
    useState(false);

  const [authMode, setAuthMode] =
    useState<"login" | "signup">(
      "login"
    );

  /*
   * --------------------------------------------------------------
   * AUTH
   * --------------------------------------------------------------
   */

  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setAuthOpen(true);
  };

  /*
   * --------------------------------------------------------------
   * SCROLL
   * --------------------------------------------------------------
   */

  const scrollToSection = (
    id: string
  ) => {
    setMobileMenu(false);

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  /*
   * --------------------------------------------------------------
   * WHATSAPP
   * --------------------------------------------------------------
   */

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      {/* ================================================================== */}
      {/* NAVBAR */}
      {/* ================================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#050816]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          {/* LOGO */}

          <button
            type="button"
            onClick={() =>
              scrollToSection("home")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
              <Code2 size={22} />
            </div>

            <div className="text-left">
              <div className="text-lg font-bold tracking-tight">
                Codelaunch
              </div>

              <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                Technologies
              </div>
            </div>
          </button>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "solutions"
                )
              }
              className="text-sm text-white/70 transition hover:text-white"
            >
              Solutions
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "services"
                )
              }
              className="text-sm text-white/70 transition hover:text-white"
            >
              Services
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "aidlc"
                )
              }
              className="text-sm text-white/70 transition hover:text-white"
            >
              AIDLC
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "technology"
                )
              }
              className="text-sm text-white/70 transition hover:text-white"
            >
              Technology
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("team")
              }
              className="text-sm text-white/70 transition hover:text-white"
            >
              Team
            </button>

            <Link
              href="/certificate/verify"
              className="flex items-center gap-1.5 text-sm text-white/70 transition hover:text-white"
            >
              <Award size={15} />
              Verify
            </Link>

            {/* <button
              type="button"
              onClick={openLogin}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Login
            </button>

            <button
              type="button"
              onClick={openSignup}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Get Started
            </button> */}

            <button
              type="button"
              onClick={openSignup}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Register
            </button>
          </nav>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            aria-label="Open menu"
            onClick={() =>
              setMobileMenu(
                !mobileMenu
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 md:hidden"
          >
            {mobileMenu ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}

        {mobileMenu && (
          <div className="border-t border-white/10 bg-[#050816] md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5 sm:px-6">
              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "solutions"
                  )
                }
                className="rounded-lg px-3 py-3 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                Solutions
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "services"
                  )
                }
                className="rounded-lg px-3 py-3 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                Services
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "aidlc"
                  )
                }
                className="rounded-lg px-3 py-3 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                AIDLC
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "technology"
                  )
                }
                className="rounded-lg px-3 py-3 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                Technology
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection("team")
                }
                className="rounded-lg px-3 py-3 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                Team
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "about"
                  )
                }
                className="rounded-lg px-3 py-3 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                About
              </button>

              <Link
                href="/certificate/verify"
                onClick={() =>
                  setMobileMenu(false)
                }
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
              >
                <Award size={16} />
                Verify Certificate
              </Link>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenu(
                      false
                    );
                    openLogin();
                  }}
                  className="rounded-lg border border-white/10 py-3 text-sm"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenu(
                      false
                    );
                    openSignup();
                  }}
                  className="rounded-lg bg-white py-3 text-sm font-semibold text-black"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ================================================================== */}
      {/* HERO */}
      {/* ================================================================== */}

      <section
        id="home"
        className="relative flex min-h-screen items-center overflow-hidden pt-20"
      >
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              <Sparkles size={14} />

              Engineering the digital future
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Build.
              <br />
              Integrate.
              <br />
              <span className="text-white/40">
                Scale.
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              Codelaunch Technologies builds
              scalable digital products,
              enterprise integrations, cloud
              platforms and intelligent
              automation for businesses ready
              to move faster.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "services"
                  )
                }
                className="group flex items-center justify-center gap-3 rounded-xl bg-white px-7 py-4 font-semibold text-black transition hover:bg-white/90"
              >
                Start a Project

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <Link
                href="/certificate/verify"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-4 font-medium text-white transition hover:bg-white/5"
              >
                <Award size={18} />
                Verify Certificate
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                Enterprise Ready
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                API First
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                AI Enabled
              </div>
            </div>
          </div>

          {/* HERO VISUAL */}

          <div className="relative hidden min-h-[500px] items-center justify-center lg:flex">
            <div className="absolute h-[360px] w-[360px] rounded-full border border-white/10" />

            <div className="absolute h-[460px] w-[460px] rounded-full border border-white/5" />

            <div className="relative flex h-48 w-48 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-black">
                <Code2 size={48} />
              </div>
            </div>

            <TechNode
              icon={<Code2 size={16} />}
              label="Engineering"
              className="-left-2 top-20"
            />

            <TechNode
              icon={<Network size={16} />}
              label="Integration"
              className="-right-2 top-32"
            />

            <TechNode
              icon={<Cloud size={16} />}
              label="Cloud"
              className="bottom-24 left-8"
            />

            <TechNode
              icon={<BrainCircuit size={16} />}
              label="AI Agents"
              className="bottom-12 right-10"
            />

            <TechNode
              icon={<Workflow size={16} />}
              label="AIDLC"
              className="left-1/2 top-2 -translate-x-1/2"
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SOLUTIONS */}
      {/* ================================================================== */}

      <section
        id="solutions"
        className="scroll-mt-20 px-5 py-24 sm:px-6 sm:py-15 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="SOLUTIONS"
            title="Technology that solves real business problems."
            description="From digital products to enterprise integrations and intelligent automation, we design solutions around measurable outcomes."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <SolutionCard
              icon={<Code2 />}
              title="Digital Products"
              description="Modern web applications and platforms designed for performance, maintainability and scale."
            />

            <SolutionCard
              icon={<Network />}
              title="Enterprise Integration"
              description="Connect applications, APIs, databases and enterprise platforms through scalable integration architecture."
            />

            <SolutionCard
              icon={<Cloud />}
              title="Cloud Platforms"
              description="Cloud-native infrastructure, DevOps and deployment strategies designed for reliable growth."
            />

            <SolutionCard
              icon={<Bot />}
              title="AI & Automation"
              description="AI-powered workflows, intelligent agents and automation that reduce manual effort and accelerate delivery."
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* AIDLC */}
      {/* ================================================================== */}

      <section
        id="aidlc"
        className="scroll-mt-20 border-y border-white/10 bg-white/[0.02] px-5 py-24 sm:px-6 sm:py-15 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            {/* LEFT */}

            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                <Sparkles size={14} />
                AIDLC
              </div>

              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                AI Development
                <br />
                <span className="text-white/40">
                  Lifecycle.
                </span>
              </h2>

              <p className="mt-7 max-w-2xl text-base leading-8 text-white/50 sm:text-lg">
                Transform requirements into
                production-ready software using
                AI agents across the complete
                development lifecycle.
              </p>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/35">
                Capture requirements from email,
                WhatsApp or messages. Let AI agents
                assist with implementation, testing,
                governance and CI/CD — while keeping
                human approval at critical production
                gates.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "contact"
                    )
                  }
                  className="group flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Discuss AIDLC

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <MessageCircle
                    size={17}
                  />
                  Talk on WhatsApp
                </button>
              </div>
            </div>

            {/* RIGHT — LIFECYCLE */}

            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-[#080c1a] p-5 shadow-2xl sm:p-7">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                      AI Engineering Pipeline
                    </div>

                    <div className="mt-2 text-lg font-semibold">
                      From requirement to release
                    </div>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Workflow size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <AIDLCStep
                    number="01"
                    icon={<Mail size={16} />}
                    title="Capture"
                    description="Email · WhatsApp · Messages"
                  />

                  <AIDLCStep
                    number="02"
                    icon={
                      <BrainCircuit size={16} />
                    }
                    title="Analyze"
                    description="Requirements · Impact · Planning"
                  />

                  <AIDLCStep
                    number="03"
                    icon={<Code2 size={16} />}
                    title="Develop"
                    description="New implementation · Enhancements"
                  />

                  <AIDLCStep
                    number="04"
                    icon={<CheckCircle2 size={16} />}
                    title="Test"
                    description="Unit · Integration · Regression"
                  />

                  <AIDLCStep
                    number="05"
                    icon={<ShieldCheck size={16} />}
                    title="Govern"
                    description="Quality · Security · Rules"
                  />

                  <AIDLCStep
                    number="06"
                    icon={<Rocket size={16} />}
                    title="Deploy"
                    description="CI/CD · Approval · Production"
                    last
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AIDLC CAPABILITIES */}

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AIDLCFeature
              icon={<Bot />}
              title="AI Agents"
              description="Agents assist across development and delivery workflows."
            />

            <AIDLCFeature
              icon={<Network />}
              title="Existing Systems"
              description="Enhance existing applications instead of starting from zero."
            />

            <AIDLCFeature
              icon={<ShieldCheck />}
              title="Governance"
              description="Apply quality, security and deployment rules automatically."
            />

            <AIDLCFeature
              icon={<Rocket />}
              title="CI/CD"
              description="Automate build, test and deployment pipelines with controlled releases."
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SERVICES */}
      {/* ================================================================== */}

      <section
        id="services"
        className="scroll-mt-20 px-5 py-24 sm:px-6 sm:py-15 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="SERVICES"
            title="Engineering capabilities built for scale."
            description="End-to-end technology services covering product engineering, integration, cloud, data, AI and reliability."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <ServiceCard
              icon={<Code2 />}
              number="01"
              title="Product Engineering"
              items={[
                "Full-stack development",
                "Web applications",
                "Enterprise platforms",
                "API development",
                "Modernization",
              ]}
            />

            <ServiceCard
              icon={<Network />}
              number="02"
              title="Integration Engineering"
              items={[
                "API-led integration",
                "MuleSoft",
                "Apigee",
                "Azure APIM",
                "System integration",
                "Event-driven architecture",
                "Enterprise connectivity",
              ]}
            />

            <ServiceCard
              icon={<Cloud />}
              number="03"
              title="Cloud & DevOps"
              items={[
                "AWS & Azure",
                "Docker",
                "Kubernetes",
                "CI/CD pipelines",
                "Cloud-native architecture",
              ]}
            />

            <ServiceCard
              icon={<Database />}
              number="04"
              title="Data & Platforms"
              items={[
                "MongoDB",
                "PostgreSQL",
                "MySQL",
                "MS SQL",
                "Data integration",
              ]}
            />

            <ServiceCard
              icon={<BrainCircuit />}
              number="05"
              title="AI & Intelligent Systems"
              items={[
                "LLM integrations",
                "RAG systems",
                "AI agents",
                "AI automation",
                "Intelligent workflows",
              ]}
            />

            <ServiceCard
              icon={<ShieldCheck />}
              number="06"
              title="Security & Reliability"
              items={[
                "Secure APIs",
                "Authentication",
                "Monitoring",
                "Production support",
                "Reliability engineering",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TECHNOLOGY */}
      {/* ================================================================== */}

      <section
        id="technology"
        className="scroll-mt-20 px-5 py-24 sm:px-6 sm:py-15 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="TECHNOLOGY"
            title="Built with technologies that scale."
            description="We choose technology based on the problem, not the trend."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <TechnologyGroup
              icon={<Code2 />}
              title="Frontend"
              technologies={[
                "React",
                "Next.js",
                "TypeScript",
                "Tailwind CSS",
                "Angular",
                "React Native",
              ]}
            />

            <TechnologyGroup
              icon={<Server />}
              title="Backend"
              technologies={[
                "Node.js",
                "Python",
                "Java",
                "PHP",
                "MuleSoft",
                "CodeIgniter",
              ]}
            />

            <TechnologyGroup
              icon={<Database />}
              title="Databases"
              technologies={[
                "MongoDB",
                "PostgreSQL",
                "MySQL",
                "MS SQL",
              ]}
            />

            <TechnologyGroup
              icon={<Cloud />}
              title="Cloud"
              technologies={[
                "AWS",
                "Azure",
                "Azure APIM",
                "Docker",
                "Kubernetes",
                "Jenkins",
              ]}
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TechnologyGroup
              icon={<BrainCircuit />}
              title="AI & Intelligent Systems"
              technologies={[
                "LLM",
                "RAG",
                "AI Agents",
                "Vector Databases",
                "AI Automation",
              ]}
            />

            <TechnologyGroup
              icon={<Layers3 />}
              title="Architecture"
              technologies={[
                "Microservices",
                "API-led",
                "Event-driven",
                "Serverless",
                "Cloud Native",
              ]}
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TechnologyGroup
              icon={<Network />}
              title="API Management & Integration"
              technologies={[
                "MuleSoft",
                "Apigee",
                "Azure APIM",
                "REST APIs",
                "SOAP APIs",
                "API Gateway",
                "OAuth 2.0",
                "JWT",
              ]}
            />

            <TechnologyGroup
              icon={<Code2 />}
              title="Frameworks & Libraries"
              technologies={[
                "React.js",
                "Next.js",
                "Angular",
                "React Native",
                "Express.js",
                "CodeIgniter",
                "Tailwind CSS",
                "Spring Boot",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* ABOUT */}
      {/* ================================================================== */}

      <section
        id="about"
        className="scroll-mt-20 border-y border-white/10 bg-white/[0.02] px-5 py-24 sm:px-6 sm:py-15 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
              WHY CODELAUNCH
            </div>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Engineering is more than writing code.
            </h2>

            <p className="mt-7 text-base leading-8 text-white/55 sm:text-lg">
              We combine software engineering,
              integration architecture, cloud
              technologies and emerging AI
              capabilities to build solutions
              that deliver measurable business
              value.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <WhyCard
                icon={<Code2 />}
                title="Engineering First"
                description="Strong engineering practices create maintainable and scalable systems."
              />

              <WhyCard
                icon={<Network />}
                title="Integration First"
                description="Connect systems instead of creating isolated applications."
              />

              <WhyCard
                icon={<ShieldCheck />}
                title="Secure by Design"
                description="Security and reliability built into every layer."
              />

              <WhyCard
                icon={<Sparkles />}
                title="Future Ready"
                description="Modern platforms ready for AI and automation."
              />
            </div>
          </div>

          {/* STATS */}

          <div className="rounded-3xl border border-white/10 bg-[#080c1a] p-5 sm:p-7">
            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
              <Stat
                value="01"
                label="Engineering"
              />

              <Stat
                value="02"
                label="Integration"
              />

              <Stat
                value="03"
                label="Cloud"
              />

              <Stat
                value="04"
                label="AI"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
                  <Globe2 size={20} />
                </div>

                <div>
                  <div className="font-semibold">
                    Digital Engineering
                  </div>

                  <div className="text-xs text-white/35">
                    From idea to production
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/40">
                We help organizations move from
                fragmented systems and manual
                processes toward connected,
                scalable and intelligent digital
                platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TEAM */}
      {/* ================================================================== */}

      <section
        id="team"
        className="scroll-mt-20 px-5 py-24 sm:px-6 sm:py-15 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="OUR TEAM"
            title="Engineers, architects and problem solvers."
            description="Codelaunch brings together engineering capabilities across software development, integration, cloud, data and intelligent automation."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <TeamCard
              icon={<Code2 />}
              title="Product Engineering"
              description="Full-stack engineers focused on building modern, reliable and maintainable digital products."
              skills={[
                "React",
                "Next.js",
                "Node.js",
                "TypeScript",
              ]}
            />

            <TeamCard
              icon={<Network />}
              title="Integration Engineering"
              description="Architects and engineers focused on connecting enterprise systems, APIs and platforms."
              skills={[
                "MuleSoft",
                "REST APIs",
                "Microservices",
                "Events",
              ]}
            />

            <TeamCard
              icon={<Cloud />}
              title="Cloud & DevOps"
              description="Cloud and DevOps capabilities for scalable infrastructure and automated delivery."
              skills={[
                "AWS",
                "Azure",
                "Docker",
                "Kubernetes",
              ]}
            />

            <TeamCard
              icon={<BrainCircuit />}
              title="AI & Intelligent Systems"
              description="AI capabilities focused on LLMs, agents, automation and intelligent enterprise workflows."
              skills={[
                "LLM",
                "RAG",
                "AI Agents",
                "Automation",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CERTIFICATE CTA */}
      {/* ================================================================== */}

       <section
        id="certification"
        className="scroll-mt-20 px-6 py-15 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-8 sm:p-12 lg:p-16">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-purple-600/10 blur-[100px]" />

            <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Award size={24} />
                </div>

                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                  PROFESSIONAL CERTIFICATION
                </div>

                <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                  Learn. Build. Get certified.
                </h2>

                <p className="mt-6 max-w-xl text-lg leading-8 text-white/50">
                  Codelaunch certification helps recognize successful learning
                  and course completion with verifiable digital certificates.
                </p>

                <div className="mt-8 space-y-4">
                  <CertificationPoint text="Digital certificate records" />
                  <CertificationPoint text="Unique certificate number" />
                  <CertificationPoint text="Public certificate verification" />
                  <CertificationPoint text="Secure verification workflow" />
                </div>

                <div className="mt-10">
                  <Link
                    href="/certificate/verify"
                    className="group inline-flex items-center gap-3 rounded-xl bg-white px-7 py-4 font-semibold text-black transition hover:bg-white/90"
                  >
                    Verify a Certificate

                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-3xl border border-white/10 bg-[#080c1a] p-7 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
                        <Award size={22} />
                      </div>

                      <div>
                        <div className="font-semibold">
                          Codelaunch Technologies
                        </div>

                        <div className="text-xs text-white/35">
                          Digital Certificate
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                      VERIFIED
                    </div>
                  </div>

                  <div className="py-8">
                    <div className="text-xs uppercase tracking-widest text-white/30">
                      Certificate of Achievement
                    </div>

                    <div className="mt-3 text-2xl font-semibold">
                      Professional Learning
                    </div>

                    <p className="mt-4 text-sm leading-6 text-white/40">
                      Certificates issued through the Codelaunch learning
                      platform can be verified publicly using the certificate
                      number.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="text-xs text-white/30">
                        Verification
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <CheckCircle2 size={15} />
                        Authentic
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="text-xs text-white/30">
                        Certificate
                      </div>
                      <div className="mt-2 text-sm">
                        Digitally Verified
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>        

      {/* <section
        id="certification"
        className="scroll-mt-20 border-y border-white/10 bg-white/[0.02] px-5 py-24 sm:px-6 sm:py-15 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
              <Award size={15} />
              Digital Certification
            </div>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Verify Codelaunch certificates.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
              Certificates issued through the
              Codelaunch learning platform can be
              publicly verified using the certificate
              number.
            </p>
          </div>

          <Link
            href="/certificate/verify"
            className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-7 py-4 font-semibold text-black transition hover:bg-white/90"
          >
            Verify Certificate

            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section> */}

      {/* ================================================================== */}
      {/* CONTACT / CTA */}
      {/* ================================================================== */}

      <section
        id="contact"
        className="scroll-mt-20 relative overflow-hidden px-5 py-15 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black">
            <Rocket size={26} />
          </div>

          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Ready to launch your next idea?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/50 sm:text-lg">
            Let's build a reliable, scalable and
            intelligent digital solution together.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openWhatsApp}
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 font-semibold text-black transition hover:bg-white/90"
            >
              <MessageCircle size={18} />
              Start on WhatsApp

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <a
              href={`mailto:${COMPANY_EMAIL}`}
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 px-8 py-4 font-medium text-white transition hover:bg-white/5"
            >
              <Mail size={18} />
              Email Us
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}

      <footer className="border-t border-white/10 bg-[#04060c] px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* BRAND */}

            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                  <Code2 size={20} />
                </div>

                <div>
                  <div className="font-semibold">
                    Codelaunch Technologies
                  </div>

                  <div className="text-xs text-white/35">
                    Engineering the digital future
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/35">
                Digital engineering, enterprise
                integration, cloud platforms, AI
                and automation for organizations
                building the future.
              </p>

              <a
                href={COMPANY_WEBSITE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
              >
                {COMPANY_WEBSITE.replace("https://", "")}
                <ExternalLink size={13} />
              </a>

              <div className="mt-6 flex items-center gap-3">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Codelaunch Technologies on LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/45 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="text-sm font-bold leading-none">in</span>
                </a>

                <button
                  type="button"
                  onClick={openWhatsApp}
                  aria-label="Contact Codelaunch on WhatsApp"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/45 transition hover:bg-white/10 hover:text-white"
                >
                  <MessageCircle
                    size={17}
                  />
                </button>

                <a
                  href={`mailto:${COMPANY_EMAIL}`}
                  aria-label="Email Codelaunch Technologies"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/45 transition hover:bg-white/10 hover:text-white"
                >
                  <Mail size={17} />
                </a>
              </div>
            </div>

            {/* COMPANY */}

            <div>
              <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/30">
                Company
              </div>

              <div className="space-y-3 text-sm text-white/45">
                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "about"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  About
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "team"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  Our Team
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "services"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  Services
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "contact"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  Contact
                </button>
              </div>
            </div>

            {/* SOLUTIONS */}

            <div>
              <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/30">
                Solutions
              </div>

              <div className="space-y-3 text-sm text-white/45">
                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "solutions"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  Digital Products
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "aidlc"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  AIDLC
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "technology"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  AI & Automation
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "technology"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  Cloud & DevOps
                </button>
              </div>
            </div>

            {/* RESOURCES */}

            <div>
              <div className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/30">
                Resources
              </div>

              <div className="space-y-3 text-sm text-white/45">
                <Link
                  href="/certificate/verify"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <Award size={15} />
                  Verify Certificate
                </Link>

                <button
                  type="button"
                  onClick={openLogin}
                  className="block transition hover:text-white"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={openSignup}
                  className="block transition hover:text-white"
                >
                  Get Started
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "technology"
                    )
                  }
                  className="block transition hover:text-white"
                >
                  Technology
                </button>
              </div>
            </div>
          </div>

          {/* CONTACT DETAILS */}

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-3">
              {/* EMAIL */}

              <a
                href={`mailto:${COMPANY_EMAIL}`}
                className="group flex min-w-0 items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <Mail size={17} />
                </div>

                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-white/25">
                    Email
                  </div>

                  <div className="mt-1 truncate text-sm text-white/55 transition group-hover:text-white">
                    {COMPANY_EMAIL}
                  </div>
                </div>
              </a>

              {/* WHATSAPP */}

              <button
                type="button"
                onClick={openWhatsApp}
                className="group flex min-w-0 items-start gap-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <MessageCircle
                    size={17}
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-white/25">
                    WhatsApp
                  </div>

                  <div className="mt-1 text-sm text-white/55 transition group-hover:text-white">
                    +91 {WHATSAPP_DISPLAY}
                  </div>
                </div>
              </button>

              {/* LINKEDIN */}

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <span className="text-sm font-bold leading-none">in</span>
                </div>

                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-white/25">
                    LinkedIn
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-sm text-white/55 transition group-hover:text-white">
                    Codelaunch Technologies
                    <ExternalLink
                      size={12}
                    />
                  </div>
                </div>
              </a>
            </div>

            {/* ADDRESS */}

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <MapPin size={17} />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-white/25">
                    Office
                  </div>

                  <div className="mt-1 text-sm leading-6 text-white/45">
                    {COMPANY_ADDRESS}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 border-t border-white/10 pt-5 md:grid-cols-2 lg:grid-cols-4">
              <a href={`tel:${COMPANY_PHONE}`} className="group flex min-w-0 items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <MessageCircle size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-white/25">Company</div>
                  <div className="mt-1 text-sm text-white/55 transition group-hover:text-white">+91 {COMPANY_PHONE}</div>
                </div>
              </a>

              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <MessageCircle size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-white/25">Enquiry</div>
                  <div className="mt-1 text-sm leading-6 text-white/55">
                    {ENQUIRY_NUMBERS.map((number, index) => (
                      <span key={number}>
                        <a href={`tel:${number}`} className="transition hover:text-white">+91 {number}</a>
                        {index < ENQUIRY_NUMBERS.length - 1 && <span className="text-white/20"> · </span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <a href={`tel:${HR_NUMBER}`} className="group flex min-w-0 items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <MessageCircle size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-white/25">HR</div>
                  <div className="mt-1 text-sm text-white/55 transition group-hover:text-white">+91 {HR_NUMBER}</div>
                </div>
              </a>

              <a href={COMPANY_WEBSITE} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <Globe2 size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-white/25">Website</div>
                  <div className="mt-1 text-sm text-white/55 transition group-hover:text-white">codelaunchtechnologies.com</div>
                </div>
              </a>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50">
                  <Mail size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-widest text-white/25">Email Addresses</div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/55">
                    {COMPANY_EMAILS.map((email) => (
                      <a key={email} href={`mailto:${email}`} className="transition hover:text-white">{email}</a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM */}

          <div className="mt-10 flex flex-col justify-between gap-5 border-t border-white/10 pt-7 text-xs text-white/30 sm:flex-row sm:items-center">
            <div>
              ©{" "}
              {new Date().getFullYear()}{" "}
              Codelaunch Technologies. All
              rights reserved.
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <span>Engineering</span>
              <span>Integration</span>
              <span>Cloud</span>
              <span>AI</span>
              <span>AIDLC</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================================== */}
      {/* AUTH MODAL */}
      {/* ================================================================== */}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() =>
          setAuthOpen(false)
        }
        onModeChange={
          setAuthMode
        }
      />
    </main>
  );
}

/* ========================================================================== */
/* SECTION HEADING */
/* ========================================================================== */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
        {eyebrow}
      </div>

      <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>

      <p className="mt-6 text-base leading-8 text-white/50 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

/* ========================================================================== */
/* TECH NODE */
/* ========================================================================== */

function TechNode({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  return (
    <div
      className={`absolute flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1020]/90 px-4 py-3 shadow-xl backdrop-blur ${className}`}
    >
      <div className="text-white/70">
        {icon}
      </div>

      <span className="text-sm text-white/70">
        {label}
      </span>
    </div>
  );
}

/* ========================================================================== */
/* STAT */
/* ========================================================================== */

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="px-5 py-8 text-center sm:px-6">
      <div className="text-3xl font-bold">
        {value}
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-widest text-white/35 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* SOLUTION CARD */
/* ========================================================================== */

function SolutionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
        {icon}
      </div>

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-white/45">
        {description}
      </p>

      <div className="mt-7 flex items-center gap-2 text-sm text-white/40 transition group-hover:text-white">
        Explore
        <ArrowRight size={15} />
      </div>
    </div>
  );
}

/* ========================================================================== */
/* AIDLC STEP */
/* ========================================================================== */

function AIDLCStep({
  number,
  icon,
  title,
  description,
  last = false,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div className="absolute bottom-[-12px] left-[17px] top-[42px] w-px bg-white/10" />
      )}

      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0b1020] text-white/60">
        {icon}
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/20">
              {number}
            </span>

            <span className="text-sm font-semibold">
              {title}
            </span>
          </div>

          <span className="text-[10px] text-white/30 sm:text-right">
            {description}
          </span>
        </div>
      </div>
    </div>
  );
}



/* ========================================================================== */
/* CERTIFICATION POINT */
/* ========================================================================== */

function CertificationPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/55">
      <CheckCircle2 size={17} className="shrink-0 text-white/70" />
      {text}
    </div>
  );
}

/* ========================================================================== */
/* AIDLC FEATURE */
/* ========================================================================== */

function AIDLCFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080c1a] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60">
        {icon}
      </div>

      <h3 className="mt-5 font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-6 text-white/35">
        {description}
      </p>
    </div>
  );
}

/* ========================================================================== */
/* SERVICE CARD */
/* ========================================================================== */

function ServiceCard({
  icon,
  number,
  title,
  items,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080c1a] p-7 transition hover:border-white/15">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
          {icon}
        </div>

        <span className="text-xs font-medium text-white/20">
          {number}
        </span>
      </div>

      <h3 className="mt-8 text-xl font-semibold">
        {title}
      </h3>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 text-sm text-white/45"
          >
            <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* TECHNOLOGY GROUP */
/* ========================================================================== */

function TechnologyGroup({
  icon,
  title,
  technologies,
}: {
  icon: React.ReactNode;
  title: string;
  technologies: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/60">
          {icon}
        </div>

        <h3 className="font-semibold">
          {title}
        </h3>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {technologies.map(
          (technology) => (
            <span
              key={technology}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50"
            >
              {technology}
            </span>
          )
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* WHY CARD */
/* ========================================================================== */

function WhyCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080c1a] p-6">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60">
        {icon}
      </div>

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-white/40">
        {description}
      </p>
    </div>
  );
}

/* ========================================================================== */
/* TEAM CARD */
/* ========================================================================== */

function TeamCard({
  icon,
  title,
  description,
  skills,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  skills: string[];
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-[#080c1a] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
        {icon}
      </div>

      <h3 className="mt-7 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-white/45">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}