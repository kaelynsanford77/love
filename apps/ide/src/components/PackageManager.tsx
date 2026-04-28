import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';

interface NpmPackage {
  name: string;
  description: string;
  version: string;
  downloads?: number;
}

interface PackageManagerProps {
  open: boolean;
  onClose: () => void;
}

export function PackageManager({ open, onClose }: PackageManagerProps) {
  const { projectId } = useStore();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NpmPackage[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionPkg, setActionPkg] = useState<string | null>(null);

  const { data: installedPkgs = [], refetch: refetchInstalled } = useQuery({
    queryKey: ['installed-packages', projectId],
    queryFn: async () => {
      const res = await api.get<{ dependencies: Record<string, string>; devDependencies: Record<string, string> }>(
        `/fs/read?projectId=${projectId}&path=package.json`
      ).catch(() => ({ dependencies: {}, devDependencies: {} }));
      const deps = { ...res.dependencies, ...res.devDependencies };
      return Object.entries(deps).map(([name, version]) => ({ name, version }));
    },
    enabled: open,
  });

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`);
      const data = await res.json() as { objects: { package: { name: string; description: string; version: string } }[] };
      setSearchResults(data.objects.map((o) => o.package));
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const install = async (name: string) => {
    // Validate package name to prevent command injection
    if (!/^[@a-zA-Z0-9._/-]+$/.test(name)) {
      toast.error('Invalid package name');
      return;
    }
    setActionPkg(name);
    try {
      await api.post('/exec', { projectId, command: `bun add ${name}` });
      toast.success(`Installed ${name}`);
      refetchInstalled();
    } catch {
      toast.error(`Failed to install ${name}`);
    } finally {
      setActionPkg(null);
    }
  };

  const remove = async (name: string) => {
    // Validate package name to prevent command injection
    if (!/^[@a-zA-Z0-9._/-]+$/.test(name)) {
      toast.error('Invalid package name');
      return;
    }
    setActionPkg(name);
    try {
      await api.post('/exec', { projectId, command: `bun remove ${name}` });
      toast.success(`Removed ${name}`);
      refetchInstalled();
    } catch {
      toast.error(`Failed to remove ${name}`);
    } finally {
      setActionPkg(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Package Manager
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="search">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="installed" className="flex-1">Installed ({installedPkgs.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-3 mt-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && search()}
                  placeholder="Search npm packages…"
                  className="pl-8"
                />
              </div>
              <Button onClick={search} disabled={searching}>
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
              </Button>
            </div>
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {searchResults.map((pkg) => (
                  <div key={pkg.name} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{pkg.name}</span>
                        <Badge variant="secondary" className="text-xs">{pkg.version}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pkg.description}</p>
                    </div>
                    <Button size="sm" className="h-7 text-xs shrink-0" onClick={() => install(pkg.name)} disabled={actionPkg === pkg.name}>
                      {actionPkg === pkg.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
                {searchResults.length === 0 && query && !searching && (
                  <p className="text-xs text-muted-foreground text-center py-8">No results — try a different search</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="installed" className="mt-3">
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {installedPkgs.map((pkg) => (
                  <div key={pkg.name} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <span className="font-medium text-sm flex-1">{pkg.name}</span>
                    <Badge variant="secondary" className="text-xs">{pkg.version}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(pkg.name)} disabled={actionPkg === pkg.name}>
                      {actionPkg === pkg.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
