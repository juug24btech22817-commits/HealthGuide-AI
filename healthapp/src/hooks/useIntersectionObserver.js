import { useEffect } from 'react';

export const useIntersectionObserver = () => {
    useEffect(() => {
        const revealElements = document.querySelectorAll('.animate-on-scroll');
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => revealObserver.observe(el));

        return () => {
            revealElements.forEach(el => revealObserver.unobserve(el));
        };
    }, []);
};
