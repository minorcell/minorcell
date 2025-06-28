'use client';
import { motion } from 'framer-motion';

const About = () => {
  const linkStyles = "font-medium text-text-primary hover:text-accent focus-visible:text-accent";

  return (
    <motion.section
      id="about"
      className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24"
      aria-label="关于我"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-background/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary lg:sr-only">
          关于
        </h2>
      </div>
      <div>
        <p className="mb-4">
          早在 2012 年，我决定尝试制作自定义 Tumblr 主题，并一头扎进了编码和网页开发的兔子洞。快进到今天，我曾有幸为一家<a href="#" className={linkStyles}>广告公司</a>、一家<a href="#" className={linkStyles}>初创公司</a>、一家<a href="#" className={linkStyles}>大公司</a>和一个<a href="#" className={linkStyles}>学生领导的设计工作室</a>构建软件。
        </p>
        <p className="mb-4">
          如今我的主要重点是在 Upstatement 为我们的客户构建产品和领导项目。在我的空闲时间，我还发布了一个<a href="#" className={linkStyles}>在线课程</a>，其中涵盖了使用 Spotify API 构建网络应用所需了解的一切。
        </p>
        <p>
          当我不在电脑前时，我通常在攀岩，和我的妻子和两只猫一起玩，或者在海拉鲁四处奔跑寻找克洛克种子。
        </p>
      </div>
    </motion.section>
  );
};

export default About; 