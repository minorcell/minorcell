'use client';

import { motion } from 'framer-motion';

interface ExperienceItemProps {
  period: string;
  role: string;
  company: string;
  companyUrl: string;
  description: string;
  technologies?: string[];
}

const ExperienceItem = ({ period, role, company, companyUrl, description, technologies }: ExperienceItemProps) => (
  <motion.li
    className="group relative grid pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50 my-8"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-background-light/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"></div>
    <header
      className="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-text-secondary sm:col-span-2"
      aria-label={period}
    >
      {period}
    </header>
    <div className="z-10 sm:col-span-6">
      <h3 className="font-medium leading-snug text-text-primary">
        <div>
          <a
            className="inline-flex items-baseline font-medium leading-tight text-text-primary hover:text-accent focus-visible:text-accent group/link text-base"
            href={companyUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${role} at ${company}`}
          >
            <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
            <span>
              {role} · <span className="inline-block">{company} <span className="inline-block">↗</span></span>
            </span>
          </a>
        </div>
      </h3>
      <p className="mt-2 text-sm leading-normal text-text-secondary">{description}</p>
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
  </motion.li>
);

const Experience = () => {
  const experiences = [
    {
      period: '2023 - 至今',
      role: '高级全栈开发者',
      company: '科技公司',
      companyUrl: '#',
      description: '领导可扩展Web应用的开发，使用React、Node.js和云技术。与跨功能团队合作，交付高质量产品。',
      technologies: ['React', 'Node.js', 'TypeScript', 'AWS'],
    },
    {
      period: '2021 - 2023',
      role: '全栈开发者',
      company: '初创解决方案公司',
      companyUrl: '#',
      description: '开发和维护多个客户项目，专注于现代JavaScript框架和响应式设计原则。',
      technologies: ['Vue.js', 'Express', 'MongoDB', 'Docker'],
    },
    {
      period: '2019 - 2021',
      role: '前端开发者',
      company: '数字机构',
      companyUrl: '#',
      description: '为各种客户网站和应用创建引人入胜的用户界面并实现互动功能。',
      technologies: ['React', 'SCSS', 'Webpack', 'Jest'],
    },
  ];

  return (
    <section id="experience" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24" aria-label="工作经历">
      <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-background/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary lg:sr-only">
          经历
        </h2>
      </div>
      <ul className="group/list">
        {experiences.map((exp, index) => (
          <ExperienceItem key={index} {...exp} />
        ))}
      </ul>
    </section>
  );
};

export default Experience; 