import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            GraphDBNext
          </h1>
          <p className="text-xl leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl">
            A modern graph database management platform for developers, data scientists, and database administrators. 
            Build, visualize, and analyze graph databases with powerful tools and AI-powered insights.
          </p>
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <Link
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-8 text-white transition-colors hover:bg-blue-700"
              href="/docs"
            >
              Get Started
            </Link>
            <Link
              className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-8 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
              href="/docs/installation"
            >
              Installation Guide
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-16">
          <div className="flex flex-col gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">Database Management</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Connect to and manage multiple graph databases with ease.</p>
          </div>
          <div className="flex flex-col gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">Visual Query Builder</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Build complex queries using an intuitive drag-and-drop interface.</p>
          </div>
          <div className="flex flex-col gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">AI-Powered Insights</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Get intelligent recommendations and analysis powered by AI.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
