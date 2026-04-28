import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Wifi, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface QRPairingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QRPairingModal({ open, onClose }: QRPairingModalProps) {
  const [pairingUrl, setPairingUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [localIp, setLocalIp] = useState('localhost');

  useEffect(() => {
    if (!open) return;
    // Use current host — when running on LAN, this gives the local IP
    const host = window.location.hostname;
    const port = window.location.port || '3000';
    const url = `http://${host}:${port}`;
    setPairingUrl(url);
    setLocalIp(host);
  }, [open]);

  async function copyUrl() {
    await navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL copied!');
  }

  function refresh() {
    const host = window.location.hostname;
    const port = window.location.port || '3000';
    setPairingUrl(`http://${host}:${port}`);
    toast.info('URL refreshed');
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Smartphone size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Mobile Access</h2>
              <p className="text-xs text-muted-foreground">Open on your phone</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-2xl shadow-lg">
            {pairingUrl ? (
              <QRCodeSVG value={pairingUrl} size={180} />
            ) : (
              <div className="w-[180px] h-[180px] bg-gray-100 rounded-lg animate-pulse" />
            )}
          </div>

          {/* Instructions */}
          <div className="w-full space-y-2">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 border border-border">
              <Wifi size={14} className="text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-0.5">Same Wi-Fi required</p>
                Make sure your phone and computer are on the same network.
              </div>
            </div>
          </div>

          {/* URL */}
          <div className="w-full">
            <label className="text-xs text-muted-foreground mb-1.5 block">Direct URL</label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted border border-border">
              <p className="flex-1 text-xs text-foreground font-mono truncate">{pairingUrl}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={refresh}
                  className="p-1.5 rounded hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  onClick={copyUrl}
                  className="p-1.5 rounded hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Scan with your phone camera or open the URL directly in Safari/Chrome
          </p>
        </div>
      </div>
    </div>
  );
}
