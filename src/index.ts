#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';
import notifier from 'node-notifier';
import path from 'path';

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'windows-notify-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: { listChanged: true }
    }
  }
);

// 定义工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'notify',
        description: 'Send a Windows desktop notification with title and message',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the notification'
            },
            message: {
              type: 'string',
              description: 'The main content/body of the notification'
            },
            icon: {
              type: 'string',
              description: 'Optional path to an icon file (png, jpg, ico)',
              default: ''
            },
            sound: {
              type: 'boolean',
              description: 'Whether to play a sound with the notification',
              default: true
            },
            wait: {
              type: 'boolean',
              description: 'Wait for user interaction before returning',
              default: false
            }
          },
          required: ['title', 'message']
        }
      },
      {
        name: 'notify_with_actions',
        description: 'Send a Windows notification with clickable action buttons',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the notification'
            },
            message: {
              type: 'string',
              description: 'The main content/body of the notification'
            },
            actions: {
              type: 'array',
              description: 'Array of action button labels',
              items: {
                type: 'string'
              }
            }
          },
          required: ['title', 'message']
        }
      }
    ]
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  if (name === 'notify') {
    const { title, message, icon, sound = true, wait = false } = args as {
      title: string;
      message: string;
      icon?: string;
      sound?: boolean;
      wait?: boolean;
    };

    return new Promise((resolve) => {
      const notificationOptions: notifier.Notification = {
        title,
        message,
        sound,
        wait
      };

      if (icon) {
        notificationOptions.icon = path.resolve(icon);
      }

      notifier.notify(notificationOptions, (err, response) => {
        if (err) {
          resolve({
            content: [{
              type: 'text',
              text: `Failed to send notification: ${err.message}`
            }],
            isError: true
          });
        } else {
          resolve({
            content: [{
              type: 'text',
              text: `Notification sent successfully!\nTitle: ${title}\nMessage: ${message}`
            }]
          });
        }
      });
    });
  }

  if (name === 'notify_with_actions') {
    const { title, message, actions = [] } = args as {
      title: string;
      message: string;
      actions?: string[];
    };

    return new Promise((resolve) => {
      const notificationOptions: notifier.Notification = {
        title,
        message,
        sound: true,
        wait: true,
        actions
      };

      notifier.notify(notificationOptions, (err, response, metadata) => {
        if (err) {
          resolve({
            content: [{
              type: 'text',
              text: `Failed to send notification: ${err.message}`
            }],
            isError: true
          });
        } else {
          resolve({
            content: [{
              type: 'text',
              text: `Notification with actions sent successfully!\nTitle: ${title}\nMessage: ${message}\nActions: ${actions.join(', ')}\nUser response: ${response || 'dismissed'}`
            }]
          });
        }
      });
    });
  }

  throw new Error(`Unknown tool: ${name}`);
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Windows Notify MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
