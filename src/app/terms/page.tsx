import { promises as fs } from "fs";
import path from "path";
import { marked } from "marked";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — VoxSite",
  description:
    "The legal agreement between you and VoxSite. Subscription terms, cancellation, refunds, liability.",
};

// Statically rendered at build time.
export const dynamic = "force-static";

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), "public", "legal", "terms.md");
  const markdown = await fs.readFile(filePath, "utf-8");
  const html = marked.parse(markdown, { async: false }) as string;

  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8 text-sm">
          <a
            href="/"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to VoxSite
          </a>
        </nav>
        <article
          className="prose prose-slate max-w-none
                     prose-headings:font-semibold
                     prose-h1:text-3xl prose-h1:mb-2
                     prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
                     prose-h3:text-lg prose-h3:mt-6
                     prose-p:text-gray-700 prose-p:leading-relaxed
                     prose-li:text-gray-700
                     prose-table:text-sm
                     prose-a:text-blue-600 hover:prose-a:text-blue-800
                     prose-strong:text-gray-900
                     prose-hr:my-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}
