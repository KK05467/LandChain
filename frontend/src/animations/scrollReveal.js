import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * Fades + lifts an element in when it enters the viewport.
 * Falls back to a plain scroll listener (no ScrollTrigger plugin
 * required, keeping the bundle lean).
 */
export function useScrollReveal(ref, { delay = 0, y = 32 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay,
            ease: "power3.out",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, delay, y]);
}

/**
 * Staggers children of a container in on mount (used for hero reveals).
 */
export function staggerIn(elements, opts = {}) {
  gsap.fromTo(
    elements,
    { opacity: 0, y: opts.y ?? 24 },
    {
      opacity: 1,
      y: 0,
      duration: opts.duration ?? 0.9,
      stagger: opts.stagger ?? 0.12,
      ease: "power3.out",
      delay: opts.delay ?? 0,
    }
  );
}
