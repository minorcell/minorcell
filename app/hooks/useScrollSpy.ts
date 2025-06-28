'use client';

import { useState, useEffect } from 'react';

export const useScrollSpy = (
    selectors: string[],
    options?: IntersectionObserverInit
) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: `0% 0% -80% 0%`,
                ...options,
            }
        );

        selectors.forEach((selector) => {
            const element = document.querySelector(selector);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            selectors.forEach((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, [selectors, options]);

    return activeId;
}; 