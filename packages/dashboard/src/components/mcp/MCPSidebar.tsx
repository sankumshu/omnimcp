'use client';

import { useState } from 'react';
import { X, Plus, CheckCircle, Circle } from 'lucide-react';

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
      id: '1',
      name: 'GitHub',
      description: 'Create issues, read repos, manage PRs',
      enabled: true,
    },
    {
      id: '2',
      name: 'Weather',
      description: 'Get weather information',
      enabled: true,
    },
    {
      id: '3',
      name: 'Slack',
      description: 'Send messages, read channels',
      enabled: false,
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
    <aside className="w-80 border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Your Apps</h2>
          <p className="text-sm text-gray-500">{enabledCount} enabled</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* MCP List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {mcps.map((mcp) => (
            <div
              key={mcp.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                mcp.enabled
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleMCP(mcp.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {mcp.enabled ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{mcp.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {mcp.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse Marketplace */}
      <div className="px-4 py-4 border-t">
        <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Browse Marketplace
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Discover and install more apps
        </p>
      </div>
    </aside>
  );
}
