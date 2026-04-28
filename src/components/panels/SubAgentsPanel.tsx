import React from 'react';
import { Bot, CheckCircle, XCircle, AlertTriangle, Shield, Code, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useIDEStore } from '@/store/useIDEStore';
import { cn } from '@/lib/utils';

export function SubAgentsPanel() {
  const { subAgentResults, runSubAgents } = useIDEStore();

  const agentIcon = (agent: string) => {
    switch (agent) {
      case 'typecheck':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'lint':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'security':
        return <Shield className="w-4 h-4 text-green-400" />;
      case 'qa':
        return <Bug className="w-4 h-4 text-purple-400" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  if (subAgentResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            Sub-agents run automatically after each AI turn
          </p>
          <Button onClick={runSubAgents} className="gap-2">
            <Bot className="w-4 h-4" />
            Run Sub-agents Now
          </Button>
        </div>
      </div>
    );
  }

  const allPassed = subAgentResults.every((r) => r.status === 'pass');

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Sub-agent Results</span>
          </div>
          <div className="flex items-center gap-2">
            {allPassed ? (
              <Badge variant="success" className="text-xs">All Passed ✓</Badge>
            ) : (
              <Badge variant="warning" className="text-xs">Issues Found</Badge>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={runSubAgents}>
              Re-run
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {subAgentResults.map((result) => (
            <div key={result.agent} className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                {agentIcon(result.agent)}
                <span className="text-sm font-medium capitalize flex-1">{result.agent}</span>
                {statusIcon(result.status)}
                <Badge
                  variant={
                    result.status === 'pass'
                      ? 'success'
                      : result.status === 'fail'
                      ? 'destructive'
                      : 'warning'
                  }
                  className="text-[10px]"
                >
                  {result.status}
                </Badge>
              </div>
              {result.issues.length > 0 && (
                <div className="space-y-1 mt-2">
                  {result.issues.map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-muted/50 rounded px-2 py-1 text-xs"
                    >
                      <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <span>{issue.message}</span>
                        {issue.file && (
                          <span className="text-muted-foreground ml-1">
                            ({issue.file}:{issue.line})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.issues.length === 0 && (
                <p className="text-xs text-muted-foreground">No issues found</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
