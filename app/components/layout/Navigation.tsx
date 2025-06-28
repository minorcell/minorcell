'use client';

interface NavigationProps {
  navItems: { [key: string]: string };
  activeId: string | null;
}

const Navigation = ({ navItems, activeId }: NavigationProps) => {
  return (
    <nav className="hidden lg:block" aria-label="In-page navigation">
      <ul className="mt-16 w-max">
        {Object.entries(navItems).map(([id, text]) => {
          const isActive = activeId === `#${id}`;
          return (
            <li key={id}>
              <a href={`#${id}`} className="group flex items-center py-3">
                <span
                  className={`nav-indicator mr-4 h-px w-8 bg-text-secondary transition-all group-hover:w-16 group-hover:bg-text-primary ${isActive ? 'w-16 bg-text-primary' : ''}`}
                ></span>
                <span
                  className={`nav-text text-xs font-bold uppercase tracking-widest text-text-secondary group-hover:text-text-primary ${isActive ? 'text-text-primary' : ''}`}
                >
                  {text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation; 