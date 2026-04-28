import React from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Share2, GitBranch, Upload, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ActionsRight() {
  const { projectId } = useStore();

  const handleCommit = async () => {
    const message = prompt('Commit message:', 'Update');
    if (!message) return;
    try {
      await api.post('/git/commit', { projectId, message });
      toast.success('Committed successfully');
    } catch {
      toast.error('Git commit failed');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handlePublish = () => {
    toast.info('Publishing… (configure deployment in settings)');
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleShare}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share link</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCommit}
            >
              <GitBranch className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Git commit</TooltipContent>
        </Tooltip>

        <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePublish}>
          <Upload className="h-3.5 w-3.5" />
          Publish
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.info('Settings coming soon')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (confirm('Reset project? This cannot be undone.'))
                  toast.warning('Reset not implemented');
              }}
              className="text-destructive"
            >
              Reset project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
