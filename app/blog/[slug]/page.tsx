import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  const files = await fs.readdir(path.join(process.cwd(), 'content/blog'));
  return files.map(filename => ({
    slug: filename.replace(/\.mdx?$/, ''),
  }));
}

async function getPost(slug: string) {
  try {
    const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`);
    const source = await fs.readFile(filePath, 'utf-8');
    const { content, data } = matter(source);
    return { content, frontMatter: data };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function Post({ params }: any) {
  const { slug } = params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }
  const { content, frontMatter } = post;

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-12 font-sans md:px-12 md:py-20 lg:px-24 lg:py-24">
      <Link href="/" className="group mb-8 inline-flex items-center font-semibold leading-tight text-text-primary">
        <span className="inline-block">←</span>
        <span className="ml-4">返回主页</span>
      </Link>
      <article className="prose prose-invert lg:prose-xl">
        <h1>{frontMatter.title as string}</h1>
        <MDXRemote source={content} />
      </article>
    </div>
  );
} 