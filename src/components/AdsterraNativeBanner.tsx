
import { useEffect, useRef } from "react";

export function AdsterraNativeBanner() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://bauval.org/21/5bbaef84e44d3e46b1a765f73f920228";
    host.appendChild(script);

    const container = document.createElement("div");
    container.id = "container-5bbbaef84e44d3e46b1a765f73f920228";
    host.appendChild(container);

    return () => {
      script.remove();
      container.remove();
    };
  }, []);

  return (
    <aside
      ref={hostRef}
      aria-label="Advertisement"
      className="w-full min-w-0 overflow-hidden"
    />
  );
}
