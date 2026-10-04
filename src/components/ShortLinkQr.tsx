import { Download, QrCode } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Renders a QR code for a short URL with a PNG download. Generated client-side. */
export function ShortLinkQr({ url, slug }: { url: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    let cancelled = false;
    void import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        errorCorrectionLevel: "M",
      }).catch(() => toast.error("Could not generate the QR code."));
    });
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  const download = async () => {
    try {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `qr-${slug}.png`;
      a.click();
    } catch {
      toast.error("Could not download the QR code.");
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`QR code for /s/${slug}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <QrCode className="size-4" />
      </Button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[252px] rounded-xl border border-hairline bg-background p-3 shadow-lg">
          <canvas ref={canvasRef} className="mx-auto block rounded-md" />
          <p className="mt-2 truncate text-center font-mono text-[11px] text-muted-foreground">
            {url}
          </p>
          <Button variant="subtle" size="sm" className="mt-2 w-full" onClick={download}>
            <Download className="size-3.5" /> Download PNG
          </Button>
        </div>
      )}
    </div>
  );
}
