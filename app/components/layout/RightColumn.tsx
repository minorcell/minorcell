import About from '@/app/components/sections/About';
import Blog from '@/app/components/sections/Blog';
import Experience from '@/app/components/sections/Experience';
import Projects from '@/app/components/sections/Projects';

const RightColumn = () => {
  return (
    <div className="pt-24 lg:w-3/5 lg:py-24">
      <main>
        <About />
        <Experience />
        <Projects />
        <Blog />
      </main>
    </div>
  );
};

export default RightColumn; 