const lazyImages = document.querySelectorAll('img[data-src]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.classList.remove('lazy');
      observer.unobserve(img);
    }
  });
}, { rootMargin: '200px 0px', threshold: 0.01 });

lazyImages.forEach(img => observer.observe(img));

<img src="photo.jpg" loading="lazy" decoding="async" alt="" />

<picture>
  <source srcset="hero-800w.avif 800w, hero-1200w.avif 1200w"
          sizes="(max-width: 600px) 100vw, 50vw"
          type="image/avif">
  <source srcset="hero-800w.webp 800w, hero-1200w.webp 1200w"
          sizes="(max-width: 600px) 100vw, 50vw"
          type="image/webp">
  <img src="hero-fallback.jpg" alt="Hero image"
       loading="lazy" decoding="async" width="1200" height="600">
</picture>

<link rel="preload" as="image" href="hero.webp"
      imagesrcset="hero-800w.webp 800w, hero-1200w.webp 1200w"
      imagesizes="(max-width: 600px) 100vw, 50vw"
      fetchpriority="high">

<img src="hero.jpg" fetchpriority="high" />
<img src="decorative.png" fetchpriority="low" loading="lazy" />
