
import { useEffect, useRef } from "react";

const AD_SCRIPT_URL =
  "https://bauval.org/21/5bbaef84e44d3e46b1a765f73f920228";

const AD_CONTAINER_ID =
  "container-5bbbaef84e44d3e46b1a765f73f920228";

export function AdsterraNativeBanner() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const container = document.createElement("div");
    container.id = AD_CONTAINER_ID;
    container.style.width = "100%";
    host.appendChild(container);

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = AD_SCRIPT_URL;
    host.appendChild(script);

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
