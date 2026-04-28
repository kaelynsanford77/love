import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, ChevronDown, Plus, Search, Zap, Globe, Layers, Triangle, Wind } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const frameworkIcons: Record<string, React.ReactNode> = {
  next: <Triangle className="h-3 w-3" />,
  vite: <Zap className="h-3 w-3" />,
  nuxt: <Layers className="h-3 w-3" />,
  svelte: <Wind className="h-3 w-3" />,
  default: <Globe className="h-3 w-3" />,
};

interface ProjectInfo {
  id: string;
  name: string;
  framework?: string;
  status?: 'running' | 'stopped' | 'error';
}

export function ProjectSwitcher() {
  const { projectId, setProjectId, projects } = useStore();
  const [search, setSearch] = useState('');

  const projectList = (projects as unknown as ProjectInfo[]).filter(
    (p) => typeof p === 'object' && p !== null
  );
  const filtered = search
    ? projectList.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projectList;
  const current = projectList.find((p) => p.id === projectId);

  const switchProject = async (id: string) => {
    try {
      await api.post('/projects/switch', { id });
      setProjectId(id);
    } catch {
      setProjectId(id);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs max-w-[160px]">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{current?.name ?? projectId}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="py-1.5 px-2">
          <div className="flex items-center gap-1.5 bg-muted/40 rounded px-2 py-1">
            <Search className="h-3 w-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filtered.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => switchProject(p.id)}
            className="text-xs gap-2"
          >
            <span className="text-muted-foreground">
              {frameworkIcons[p.framework ?? 'default'] ?? frameworkIcons.default}
            </span>
            <span className="flex-1 truncate">{p.name}</span>
            {p.status && (
              <span className={`h-1.5 w-1.5 rounded-full ${
                p.status === 'running' ? 'bg-green-500' :
                p.status === 'error' ? 'bg-red-500' : 'bg-muted-foreground'
              }`} />
            )}
          </DropdownMenuItem>
        ))}
        {filtered.length === 0 && (
          <div className="text-xs text-muted-foreground px-2 py-3 text-center">No projects found</div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs gap-1.5 text-primary">
          <Plus className="h-3.5 w-3.5" />
          New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
