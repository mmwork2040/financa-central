import { useEffect, useRef, useCallback } from "react";

export function useScrollReveal(threshold = 0.08) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingRef = useRef<Set<Element>>(new Set());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px 80px 0px" }
    );

    pendingRef.current.forEach((el) => observerRef.current?.observe(el));
    pendingRef.current.clear();

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold]);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    if (observerRef.current) {
      observerRef.current.observe(node);
    } else {
      pendingRef.current.add(node);
    }
  }, []);

  return ref;
}
