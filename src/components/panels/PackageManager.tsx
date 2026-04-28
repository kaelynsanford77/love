import React, { useState } from 'react';
import { Search, Package, Download, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIDEStore } from '@/store/useIDEStore';

export function PackageManager() {
  const {
    installedPackages,
    packageSearchResults,
    searchPackages,
    installPackage,
    uninstallPackage,
  } = useIDEStore();

  const [query, setQuery] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    searchPackages(q);
  };

  const handleInstall = (name: string) => {
    setInstalling(name);
    setTimeout(() => {
      installPackage(name);
      setInstalling(null);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search npm packages..."
            className="pl-9 h-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Search results */}
        {query && packageSearchResults.length > 0 && (
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-2 mb-1">Search Results</p>
            {packageSearchResults.map((pkg) => {
              const isInstalled = installedPackages.some((p) => p.name === pkg.name);
              return (
                <div
                  key={pkg.name}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-accent/50 rounded"
                >
                  <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{pkg.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        v{pkg.version}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{pkg.description}</p>
                  </div>
                  {isInstalled ? (
                    <Badge variant="success" className="text-[10px] shrink-0">
                      <Check className="w-2.5 h-2.5 mr-0.5" /> Installed
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => handleInstall(pkg.name)}
                      disabled={installing === pkg.name}
                    >
                      {installing === pkg.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-1" /> Install
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Installed packages */}
        <div className="p-2">
          <p className="text-xs text-muted-foreground px-2 mb-1">
            Installed ({installedPackages.length})
          </p>
          {installedPackages.map((pkg) => (
            <div
              key={pkg.name}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 rounded group"
            >
              <Package className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm flex-1 truncate">{pkg.name}</span>
              <span className="text-xs text-muted-foreground">{pkg.version}</span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => uninstallPackage(pkg.name)}
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
