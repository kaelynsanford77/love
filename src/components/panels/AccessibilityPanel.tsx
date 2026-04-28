import React from 'react';
import { Accessibility, AlertCircle, AlertTriangle, Info, Wrench, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIDEStore } from '@/store/useIDEStore';
import { cn } from '@/lib/utils';

export function AccessibilityPanel() {
  const { accessibilityViolations, runAccessibilityCheck, addMessage, setAiThinking } = useIDEStore();

  const handleFixAll = () => {
    const violationSummary = accessibilityViolations.map((v) => `- ${v.description}`).join('\n');
    addMessage({
      role: 'user',
      content: `Fix these accessibility violations:\n${violationSummary}`,
    });
    setAiThinking(true);
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `♿ I've fixed all ${accessibilityViolations.length} accessibility violations:\n\n${accessibilityViolations
          .map((v) => `✅ **${v.id}**: ${v.help}`)
          .join('\n')}\n\nRun the checker again to verify!`,
      });
      setAiThinking(false);
    }, 1500);
  };

  const handleFixOne = (violation: typeof accessibilityViolations[0]) => {
    addMessage({
      role: 'user',
      content: `Fix this accessibility issue: ${violation.description} (${violation.help})`,
    });
    setAiThinking(true);
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `✅ Fixed: **${violation.id}** - ${violation.help}\n\nThe violation has been addressed in the code.`,
      });
      setAiThinking(false);
    }, 1200);
  };

  const impactIcon = (impact: string) => {
    switch (impact) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'serious':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'moderate':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const impactBadge = (impact: string) => {
    const variant =
      impact === 'critical'
        ? 'destructive'
        : impact === 'serious'
        ? 'warning'
        : impact === 'moderate'
        ? 'secondary'
        : 'outline';
    return (
      <Badge variant={variant as any} className="text-[10px]">
        {impact}
      </Badge>
    );
  };

  if (accessibilityViolations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Accessibility className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            Run an accessibility check (axe-core)
          </p>
          <Button onClick={runAccessibilityCheck} className="gap-2">
            <Accessibility className="w-4 h-4" />
            Run Accessibility Check
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        {/* Summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">
              {accessibilityViolations.length} violation{accessibilityViolations.length !== 1 && 's'} found
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={runAccessibilityCheck}>
              Re-scan
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleFixAll}>
              <Wrench className="w-3 h-3" />
              Fix All with AI
            </Button>
          </div>
        </div>

        {/* Violations */}
        <div className="space-y-2">
          {accessibilityViolations.map((v) => (
            <div key={v.id} className="border border-border rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                {impactIcon(v.impact)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{v.id}</span>
                    {impactBadge(v.impact)}
                  </div>
                  <p className="text-xs text-muted-foreground">{v.description}</p>
                </div>
              </div>
              <p className="text-xs mb-2">{v.help}</p>
              {/* Affected nodes */}
              <div className="space-y-1 mb-2">
                {v.nodes.map((node, i) => (
                  <div key={i} className="bg-muted/50 rounded px-2 py-1">
                    <code className="text-[10px] font-mono text-muted-foreground break-all">
                      {node.html}
                    </code>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] gap-1"
                  onClick={() => handleFixOne(v)}
                >
                  <Wrench className="w-2.5 h-2.5" />
                  Fix with AI
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] gap-1"
                  onClick={() => window.open(v.helpUrl, '_blank')}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  Learn more
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
