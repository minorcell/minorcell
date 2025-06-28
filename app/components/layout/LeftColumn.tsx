'use client';

import { Github, Linkedin, Twitter } from 'lucide-react';
import Navigation from './Navigation';
import { useScrollSpy } from '@/app/hooks/useScrollSpy';

const LeftColumn = () => {
  const sectionIds = {
    about: '关于',
    experience: '经历',
    projects: '项目',
    blog: '博客'
  };
  const activeId = useScrollSpy(Object.keys(sectionIds).map(id => `#${id}`));

  const socialLinks = [
    { name: 'GitHub', url: 'https://github.com', icon: Github },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: Linkedin },
    { name: 'Twitter', url: 'https://twitter.com', icon: Twitter },
  ];

  return (
    <div className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-2/5 lg:flex-col lg:justify-between lg:py-24">
      <div>
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            mCell
          </h1>
          <h2 className="mt-3 text-lg font-medium tracking-tight text-text-primary sm:text-xl">
            全栈工程师
          </h2>
          <p className="mt-4 max-w-xs leading-normal text-text-secondary">
            我为网络构建易于访问、像素完美的数字体验。
          </p>
        </header>

        <Navigation navItems={sectionIds} activeId={activeId} />
      </div>

      <footer className="mt-8">
        <ul className="flex items-center">
          {socialLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <li key={link.name} className="mr-5 text-xs">
                <a
                  href={link.url}
                  className="block text-text-secondary hover:text-text-primary"
                  aria-label={link.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconComponent className="h-6 w-6" />
                </a>
              </li>
            );
          })}
        </ul>
      </footer>
    </div>
  );
};

export default LeftColumn; 