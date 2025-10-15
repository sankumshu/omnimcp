'use client';

import { useState } from 'react';
import { X, Plus, CheckCircle, Circle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface MCP {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon?: string;
}

interface MCPSidebarProps {
  onClose: () => void;
}

export function MCPSidebar({ onClose }: MCPSidebarProps) {
  // TODO: Fetch from API
  const [mcps, setMCPs] = useState<MCP[]>([
    {
      id: 'ubereats',
      name: 'Uber Eats',
      description: 'Search restaurants, browse menus, order food',
      enabled: true,
      icon: '🍕',
    },
    {
      id: 'uber',
      name: 'Uber',
      description: 'Book rides, get price estimates, track rides',
      enabled: true,
      icon: '🚗',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Create issues, read repos, manage PRs',
      enabled: false,
      icon: '💻',
    },
  ]);

  const toggleMCP = (id: string) => {
    setMCPs((prev) =>
      prev.map((mcp) =>
        mcp.id === id ? { ...mcp, enabled: !mcp.enabled } : mcp
      )
    );
  };

  const enabledCount = mcps.filter((m) => m.enabled).length;

  return (
    <aside className="w-80 border-r bg-background flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Your Apps</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{enabledCount} enabled</Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* MCP List */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-3">
          {mcps.map((mcp) => (
            <Card
              key={mcp.id}
              className={`cursor-pointer transition-all ${
                mcp.enabled
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/20'
              }`}
              onClick={() => toggleMCP(mcp.id)}
            >
              <CardHeader className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {mcp.enabled ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm">{mcp.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {mcp.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Browse Marketplace */}
      <div className="px-4 py-4">
        <Button className="w-full" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Browse Marketplace
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Discover and install more apps
        </p>
      </div>
    </aside>
  );
}
