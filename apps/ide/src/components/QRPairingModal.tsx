import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface QRPairingModalProps {
  open: boolean;
  onClose: () => void;
}

export function QRPairingModal({ open, onClose }: QRPairingModalProps) {
  const [lanUrl] = useState(() => {
    const port = window.location.port || '3000';
    return `http://[YOUR_LAN_IP]:${port}`;
  });

  const copyUrl = () => {
    navigator.clipboard.writeText(lanUrl).then(() => toast.success('URL copied!'));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Pair with Mobile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Open this URL on your phone to access the IDE from your local network.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex-1 text-sm font-mono break-all">{lanUrl}</div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyUrl}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Replace [YOUR_LAN_IP] with your computer's local IP address (e.g. 192.168.1.100).
            Find it with <code className="font-mono">ipconfig</code> (Windows) or <code className="font-mono">ifconfig</code> (Mac/Linux).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
