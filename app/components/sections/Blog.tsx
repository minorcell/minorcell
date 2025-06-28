'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface BlogItemProps {
  year: string;
  title: string;
  url: string;
  image: string;
}

const BlogItem = ({ year, title, url, image }: BlogItemProps) => (
  <motion.li
    className="group relative grid grid-cols-8 gap-4"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    <div className="col-span-2">
      <Image src={image} alt={title} width={200} height={100} className="rounded border-2 border-slate-200/10 transition group-hover:border-slate-200/30" />
    </div>
    <div className="col-span-6">
      <p className="text-sm font-semibold text-slate-400">{year}</p>
      <Link
        href={url}
        className="text-lg font-medium leading-tight text-text-primary hover:text-accent focus-visible:text-accent"
      >
        {title} <span className="inline-block">↗</span>
      </Link>
    </div>
  </motion.li>
);

const Blog = () => {
  const blogPosts = [
    {
      year: '2024',
      title: '5个常见的可访问性陷阱及如何避免',
      url: '/blog/accessibility-pitfalls',
      image: '/work/vuedir.webp',
    },
    {
      year: '2022',
      title: '将Algolia搜索与WordPress多站点集成',
      url: '/blog/integrating-algolia-with-wordpress-multi-site',
      image: '/work/dilidili.webp',
    },
    {
      year: '2021',
      title: '从零开始构建无头移动应用CMS',
      url: '/blog/building-a-headless-mobile-app-cms-from-scratch',
      image: '/work/hubio.webp',
    },
  ];

  return (
    <section id="blog" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24" aria-label="博客文章">
      <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-background/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary lg:sr-only">
          博客
        </h2>
      </div>
      <ul className="group/list space-y-8">
        {blogPosts.map((post, index) => (
          <BlogItem key={index} {...post} />
        ))}
      </ul>
    </section>
  );
};

export default Blog; 