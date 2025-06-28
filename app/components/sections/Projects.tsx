'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import Image from 'next/image';

interface ProjectItemProps {
  title: string;
  description: string;
  technologies: string[];
  image: string;
  liveUrl?: string;
  githubUrl?: string;
}

const ProjectItem = ({ title, description, technologies, image, liveUrl, githubUrl }: ProjectItemProps) => (
  <motion.li
    className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50 my-8"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-background-light/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"></div>
    <div className="z-10 sm:order-2 sm:col-span-6">
      <h3 className="font-medium leading-snug text-text-primary">
        <div>
          <a
            className="inline-flex items-baseline font-medium leading-tight text-text-primary hover:text-accent focus-visible:text-accent group/link text-base"
            href={liveUrl || githubUrl || '#'}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`View the ${title} project`}
          >
            <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
            <span className="inline-block">{title} <span className="inline-block">↗</span></span>
          </a>
        </div>
      </h3>
      <p className="mt-2 text-sm leading-normal text-text-secondary">{description}</p>
      <div className="mt-2 flex items-center space-x-4">
        {githubUrl && (
          <a href={githubUrl} className="text-text-secondary hover:text-accent" aria-label="GitHub link" target="_blank" rel="noopener noreferrer">
            <Github size={20} />
          </a>
        )}
        {liveUrl && (
          <a href={liveUrl} className="text-text-secondary hover:text-accent" aria-label="External link" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={20} />
          </a>
        )}
      </div>
      {technologies && (
        <ul className="mt-2 flex flex-wrap" aria-label="Technologies used">
          {technologies.map((tech) => (
            <li key={tech} className="mr-1.5 mt-2">
              <div className="flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium leading-5 text-accent ">
                {tech}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    <Image src={image} alt={title} width={200} height={48} className="rounded border-2 border-slate-200/10 transition group-hover:border-slate-200/30 sm:order-1 sm:col-span-2 sm:translate-y-1" />
  </motion.li>
);

const Projects = () => {
  const projects = [
    {
      title: '嘀哩嘀哩平台',
      description: '一个功能全面的内容管理平台，具有实时功能和现代UI设计。',
      technologies: ['React', 'Node.js', 'MongoDB', 'Socket.io'],
      image: '/work/dilidili.webp',
      liveUrl: '#',
      githubUrl: '#',
    },
    {
      title: 'Hubio仪表板',
      description: '具有数据可视化和报告功能的分析仪表板，用于商业智能。',
      technologies: ['Vue.js', 'TypeScript', 'D3.js', 'Express'],
      image: '/work/hubio.webp',
      liveUrl: '#',
      githubUrl: '#',
    },
    {
      title: 'Vuedir',
      description: '基于Vue3和TypeScript的指令库，目前已经停止维护了。',
      technologies: ['Vue3', 'TypeScript', 'Rollup', 'Monorepo'],
      image: '/work/vuedir.webp',
      liveUrl: '#',
      githubUrl: '#',
    },
  ];

  return (
    <section id="projects" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24" aria-label="个人项目">
      <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-background/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary lg:sr-only">
          项目
        </h2>
      </div>
      <div>
        <ul className="group/list">
          {projects.map((project, index) => (
            <ProjectItem key={index} {...project} />
          ))}
        </ul>
        <div className="mt-12">
          <a
            className="inline-flex items-center font-medium leading-tight text-text-primary group"
            aria-label="查看完整的项目存档"
            href="/archive"
          >
            <span>
              查看完整的项目存档 <span className="inline-block">↗</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Projects; 