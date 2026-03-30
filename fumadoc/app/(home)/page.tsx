"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Cards } from "fumadocs-ui/components/card";
import { motion } from "framer-motion";
import { 
  Library, 
  Network, 
  Globe,
  ArrowRight,
  Database,
  Search,
  BookOpen,
  Scale,
  ShieldCheck,
  History,
  FlaskConical,
  Puzzle,
  Lightbulb,
  FileText,
  Zap,
  FileCode,
  Users,
  Sparkles,
  MousePointer2
} from "lucide-react";

const steps = [
  { 
    step: "01",
    img: "/6.png", 
    title: "XML Source Ingestion", 
    desc: "Import complex XML documents. Our parser analyzes element distribution and attributes, providing a visual preview of the source tree structure."
  },
  { 
    step: "02",
    img: "/5.png", 
    title: "Visual Workflow Design", 
    desc: "Map XML elements to graph nodes using our interactive canvas. Define logic, transformers, and conditional filters to control data flow."
  },
  { 
    step: "03",
    img: "/3.png", 
    title: "Schema Modeling", 
    desc: "Construct the target graph schema visually. Define relationships, properties, and constraints that reflect scholarly research questions."
  },
  { 
    step: "04",
    img: "/2.png", 
    title: "Knowledge Discovery", 
    desc: "The final graph is generated. Explore interconnections, perform network analysis, and export data in RDF or property graph formats."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 70,
      damping: 20,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 10,
      delay: 0.5,
    },
  },
};

function LifecycleAccordion() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      {steps.map((item, i) => (
        <motion.div
          key={i}
          initial={false}
          onMouseEnter={() => setActiveIndex(i)}
          animate={{ 
            flex: activeIndex === i ? 4 : 1,
          }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className={`relative h-full overflow-hidden rounded-2xl border transition-colors duration-500 flex flex-col
            ${activeIndex === i 
              ? "bg-white/50 dark:bg-zinc-900/40 border-amber-500/30 dark:border-amber-500/20" 
              : "bg-white/10 dark:bg-zinc-900/10 border-zinc-200/50 dark:border-zinc-800/50 hover:bg-white/20 dark:hover:bg-zinc-900/20"
            }`}
        >
          <div className={`p-8 h-full flex flex-col ${activeIndex === i ? "" : "items-center justify-start pt-12"}`}>
            {/* Header Content */}
            <div className={`flex gap-6 ${activeIndex === i ? "items-start mb-12" : "flex-col items-center mb-0"}`}>
               <span className={`text-2xl font-serif italic transition-colors duration-500 whitespace-nowrap
                 ${activeIndex === i ? "text-amber-500" : "text-zinc-500/40"}`}>
                 {item.step}
               </span>
               <h4 className={`text-xl font-bold transition-all duration-500 whitespace-nowrap
                 ${activeIndex === i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"}`}>
                 {item.title}
               </h4>
               
               {/* Vertical Title for collapsed state */}
               {activeIndex !== i && (
                 <div className="absolute top-32 left-1/2 -translate-x-1/2 flex items-center justify-center">
                   <span className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px] [writing-mode:vertical-lr] rotate-180 whitespace-nowrap">
                     {item.title}
                   </span>
                 </div>
               )}
            </div>

            {/* Expanded Content */}
            <motion.div
              initial={false}
              animate={{ 
                opacity: activeIndex === i ? 1 : 0,
                y: activeIndex === i ? 0 : 20,
              }}
              transition={{ duration: 0.4, delay: activeIndex === i ? 0.2 : 0 }}
              className={`flex-1 flex flex-col min-h-0 ${activeIndex === i ? "block" : "hidden"}`}
            >
              <p className="text-zinc-600 dark:text-zinc-400 font-light leading-relaxed mb-8 max-w-lg">
                {item.desc}
              </p>
              
              <div className="flex-1 relative rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-950">
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-amber-100 dark:selection:bg-amber-900/40 text-zinc-900 dark:text-zinc-100">
      {/* 1. Creative Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Academic Grid Background */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 dark:opacity-[0.04] pointer-events-none" 
          style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 dark:bg-amber-400/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-400/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 -z-10"></div>

        <div className="container max-w-[1240px] mx-auto px-6 relative">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-5xl mx-auto"
          >
            {/* Institution Badge */}
            <motion.div 
              variants={badgeVariants}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-12 group cursor-default"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                Digital Humanities Infrastructure
              </span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6 leading-[0.95]"
            >
              Plexus
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-2xl text-zinc-500 dark:text-zinc-400 font-serif italic mb-16"
            >
              Visual Graph Modeling & Automated Schema Design
            </motion.p>
            
            {/* Creative Selection Grid */}
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
            >
              {[
                {
                  title: "Plexus Platform",
                  desc: "The professional research environment for project-level XML ingestion and visualization.",
                  href: "/docs/app/user-guides/getting-started",
                  icon: <Library className="w-6 h-6" />,
                  color: "amber"
                },
                {
                  title: "Plexus Builder",
                  desc: "Standalone SDK for custom visual workflow construction and schema modeling.",
                  href: "/docs/builder",
                  icon: <FileCode className="w-6 h-6" />,
                  color: "blue"
                }
              ].map((opt, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Link href={opt.href} className="group block">
                    <div className="relative p-8 text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl transition-all hover:scale-[1.02] hover:border-zinc-300 dark:hover:border-zinc-700 h-full flex flex-col justify-between overflow-hidden">
                      <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl bg-${opt.color}-500/10 flex items-center justify-center text-${opt.color}-600 dark:text-${opt.color}-400 mb-6 border border-${opt.color}-500/20`}>
                          {opt.icon}
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{opt.title}</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">{opt.desc}</p>
                      </div>
                      <div className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors relative z-10">
                        View Documentation <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                      
                      {/* Interactive Hover Glow */}
                      <div className={`absolute bottom-0 right-0 w-32 h-32 bg-${opt.color}-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity -z-10`} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Hero Insights Bar */}
            <motion.div 
              variants={containerVariants}
              className="mt-7 pt-5 border-t border-zinc-100 dark:border-zinc-900/50 w-full max-w-4xl grid grid-cols-2 md:grid-cols-5 gap-8"
            >
              {[
                { label: "Auditable Source", icon: <Globe className="w-4 h-4" /> },
                { label: "Semantic Standards", icon: <Network className="w-4 h-4" /> },
                { label: "Peer Collaboration", icon: <Users className="w-4 h-4" /> },
                { label: "Intelligent Ingest", icon: <Sparkles className="w-4 h-4" /> },
                { label: "Visual Modeling", icon: <MousePointer2 className="w-4 h-4" /> }
              ].map((insight, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  className="flex flex-col items-center md:items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                    {insight.icon}
                  </div>
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">{insight.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. Refactored Research Methodology Section with Images */}
      <section className="py-32 relative overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="container max-w-[1240px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mb-24"
          >
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-6 py-2 px-3 bg-white dark:bg-zinc-900 rounded inline-block border border-zinc-100 dark:border-zinc-800">
              Workflow Lifecycle
            </h2>
            <h3 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-8 leading-[1.1]">
              Automated Graph Generation
            </h3>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 font-serif italic">
              From raw XML archives to validated researcher-centric knowledge graphs.
            </p>
          </motion.div>

          <div className="hidden lg:flex flex-row gap-4 h-[600px] max-w-[1240px] mx-auto overflow-hidden">
             <LifecycleAccordion />
          </div>

          {/* Fallback for mobile */}
          <div className="flex lg:hidden flex-col gap-4">
            {steps.map((item, i) => (
              <div key={i} className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                <span className="text-xl font-serif italic text-amber-500 mb-4 block">{item.step}</span>
                <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                <p className="text-zinc-500 text-sm mb-6">{item.desc}</p>
                <img src={item.img} alt={item.title} className="rounded-lg shadow-sm" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Final Lean CTA */}
      <section className="py-32 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900/50">
        <div className="container max-w-[1240px] mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Build?</h2>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 font-light mb-12">
              Join the academic community in redefining archival discovery through graph modeling.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/docs/app/user-guides/getting-started"
                className="inline-flex h-14 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-50 px-10 text-sm font-bold text-white dark:text-zinc-900 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                Start Platform Guide
              </Link>
              <Link
                href="https://github.com"
                className="inline-flex h-14 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 px-10 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                View on GitHub
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-zinc-100 dark:border-zinc-900/50">
        <div className="container max-w-[1240px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-zinc-400 dark:text-zinc-600 text-[13px]">
          <div className="flex items-center gap-4">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">Plexus</span>
            <span>&copy; 2024</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800" />
            <span>Independent Research Platform</span>
          </div>
          <div className="flex gap-10 font-medium">
            <Link href="#" className="hover:text-amber-500 transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-amber-500 transition-colors">TIB Service</Link>
            <Link href="#" className="hover:text-amber-500 transition-colors">Open Source</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
