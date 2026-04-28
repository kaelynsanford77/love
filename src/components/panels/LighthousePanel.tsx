import React from 'react';
import { Zap, AlertTriangle, TrendingUp, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIDEStore } from '@/store/useIDEStore';
import { cn } from '@/lib/utils';

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 90 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const bgColor =
    score >= 90 ? 'bg-green-400/10' : score >= 50 ? 'bg-yellow-400/10' : 'bg-red-400/10';

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2',
          color,
          bgColor,
          score >= 90 ? 'border-green-400' : score >= 50 ? 'border-yellow-400' : 'border-red-400'
        )}
      >
        {score}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function LighthousePanel() {
  const { lighthouseScore, runLighthouseAudit } = useIDEStore();
  const { addMessage, setAiThinking } = useIDEStore();

  const handleFixWithAI = (diagnostic: string) => {
    addMessage({ role: 'user', content: `Fix this performance issue: ${diagnostic}` });
    setAiThinking(true);
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `I've addressed the performance issue: **${diagnostic}**\n\n- Optimized the relevant code\n- Reduced bundle size\n- Improved loading performance\n\nRun the audit again to verify the improvements!`,
      });
      setAiThinking(false);
    }, 1500);
  };

  if (!lighthouseScore) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">Run a performance audit</p>
          <Button onClick={runLighthouseAudit} className="gap-2">
            <Zap className="w-4 h-4" />
            Run Lighthouse Audit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Scores */}
        <div className="flex justify-center gap-6 mb-6">
          <ScoreCircle score={lighthouseScore.performance} label="Performance" />
          <ScoreCircle score={lighthouseScore.accessibility} label="Accessibility" />
          <ScoreCircle score={lighthouseScore.bestPractices} label="Best Practices" />
          <ScoreCircle score={lighthouseScore.seo} label="SEO" />
        </div>

        {/* Diagnostics */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Diagnostics
          </h3>
          {lighthouseScore.diagnostics.map((diag, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg"
            >
              <TrendingUp className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="text-sm flex-1">{diag}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs shrink-0 gap-1"
                onClick={() => handleFixWithAI(diag)}
              >
                <Wrench className="w-3 h-3" />
                Fix with AI
              </Button>
            </div>
          ))}
        </div>

        {/* Re-run button */}
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={runLighthouseAudit} className="gap-2">
            <Zap className="w-4 h-4" />
            Re-run Audit
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
