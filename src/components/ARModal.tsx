import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ARModalProps {
  open: boolean;
  onClose: () => void;
  glb?: string;
  usdz?: string;
  productName: string;
  autoLaunch?: boolean;
}

const isMobileUA = () =>
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod/i.test(navigator.userAgent);

const ARModal = ({ open, onClose, glb, usdz, productName, autoLaunch }: ARModalProps) => {
  const [mobile, setMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    setMobile(isMobileUA());
  }, []);

  // Build a URL that, when opened on a phone, auto-launches AR
  const arUrl = (() => {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.href);
    u.searchParams.set("ar", "1");
    return u.toString();
  })();

  // Auto-launch AR on mobile when opened
  useEffect(() => {
    if (!open || !mobile) return;
    let cancelled = false;
    const tryLaunch = () => {
      if (cancelled) return;
      const mv: any = viewerRef.current;
      if (mv && typeof mv.activateAR === "function") {
        try {
          mv.activateAR();
        } catch {
          /* пользователь может запустить кнопкой */
        }
      }
    };
    // Ждём загрузки модели
    const t = window.setTimeout(tryLaunch, autoLaunch ? 600 : 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, mobile, autoLaunch, glb, usdz]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(arUrl);
      setCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const hasIOS = !!usdz;
  const hasGLB = !!glb;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Посмотреть в AR
          </DialogTitle>
          <DialogDescription>
            {mobile
              ? "Наведите камеру на пол или стол, чтобы разместить модель в вашем пространстве."
              : "Отсканируйте QR-код камерой телефона — модель откроется в дополненной реальности прямо в вашей комнате."}
          </DialogDescription>
        </DialogHeader>

        {mobile ? (
          <div className="flex flex-col items-center gap-4">
            {/* Скрытый model-viewer запускает AR через activateAR() */}
            {hasGLB || hasIOS ? (
              <>
                <model-viewer
                  ref={viewerRef}
                  src={glb || undefined}
                  ios-src={usdz || undefined}
                  alt={productName}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  ar-scale="fixed"
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  style={{ width: "100%", height: "320px", background: "transparent" }}
                />
                <Button
                  size="lg"
                  className="w-full gap-2 rounded-full"
                  onClick={() => {
                    const mv: any = viewerRef.current;
                    mv?.activateAR?.();
                  }}
                >
                  <Smartphone className="h-5 w-5" />
                  Запустить AR
                </Button>
                {isIOS() && !hasIOS && (
                  <p className="text-xs text-muted-foreground text-center">
                    Для iOS нужен файл .usdz — попросите добавить его к товару.
                  </p>
                )}
                {!isIOS() && !hasGLB && (
                  <p className="text-xs text-muted-foreground text-center">
                    Для Android нужен файл .glb — попросите добавить его к товару.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Нет 3D-модели для просмотра.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeCanvas value={arUrl} size={220} level="H" includeMargin={false} />
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Откройте камеру на iPhone или Android и наведите на QR-код.
              На телефоне модель автоматически откроется в AR-режиме.
            </p>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </Button>
            <div className="text-[11px] text-muted-foreground text-center space-y-0.5">
              <div>{hasGLB ? "✓" : "✕"} Android (.glb) · {hasIOS ? "✓" : "✕"} iOS (.usdz)</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ARModal;
