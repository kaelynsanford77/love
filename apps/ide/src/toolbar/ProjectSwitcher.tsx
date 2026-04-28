import React from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function ProjectSwitcher() {
  const { projectId, setProjectId, setProjects } = useStore();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const res = await api.get<{ projects: string[] }>('/fs/projects');
        const list = res.projects ?? [];
        setProjects(list);
        return list;
      } catch {
        return [];
      }
    },
    refetchInterval: 10_000,
  });

  const handleCreate = async () => {
    const name = prompt('New project name:');
    if (!name?.trim()) return;
    try {
      await api.post('/fs/projects', { name: name.trim() });
      setProjectId(name.trim());
      toast.success(`Project "${name}" created`);
    } catch {
      toast.error('Failed to create project');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 font-medium text-foreground/80 hover:text-foreground">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="max-w-[120px] truncate">{projectId}</span>
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-60" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.length === 0 && (
          <DropdownMenuItem disabled className="text-muted-foreground italic">
            No projects yet
          </DropdownMenuItem>
        )}
        {projects.map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() => setProjectId(p)}
            className={p === projectId ? 'bg-accent' : ''}
          >
            <FolderOpen className="mr-2 h-4 w-4 opacity-60" />
            {p}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
