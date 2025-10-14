# @omnimcp/sdk

Official SDK for building and deploying MCP servers to the OmniMCP platform.

## Installation

```bash
npm install @omnimcp/sdk
```

## Quick Start

```typescript
import { OmniMCP, z } from '@omnimcp/sdk';

const mcp = new OmniMCP({
  apiKey: process.env.OMNIMCP_API_KEY!,
  name: 'my-awesome-tool',
  description: 'My awesome MCP server',
});

mcp.tool({
  name: 'calculate',
  description: 'Perform a calculation',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  handler: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return a / b;
    }
  },
});

// Deploy to OmniMCP platform
await mcp.deploy();
```

## License

MIT
