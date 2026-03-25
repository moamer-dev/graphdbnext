import { source } from '@/lib/source';
import { notFound } from 'next/navigation';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{page.data.title}</h1>
        <div className="prose prose-lg">
          <MDX />
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}
