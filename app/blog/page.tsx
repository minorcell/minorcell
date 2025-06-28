import LeftColumn from '@/app/components/layout/LeftColumn';

export default function BlogPage() {
  return (
    <div className="page-wrapper">
      <LeftColumn />
      <main className="right-column">
        <div className="right-column__content">
          <section className="content-section">
            <h1 className="page-title">Blog</h1>
            <p className="page-description">
              All my thoughts on programming, design, and other things, collected in one place.
            </p>
            {/* Blog posts will be listed here */}
          </section>
        </div>
      </main>
    </div>
  );
} 