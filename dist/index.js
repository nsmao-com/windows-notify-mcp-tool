#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import notifier from 'node-notifier';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
// 从环境变量获取默认音频文件
const DEFAULT_SOUND = process.env.DEFAULT_SOUND || '';
// 播放自定义音频文件（支持 mp3, wav 等格式）
function playSound(soundFile) {
    const resolvedPath = path.resolve(soundFile);
    // 创建临时 PowerShell 脚本来播放音频
    const tempScript = path.join(process.env.TEMP || '/tmp', `play-sound-${Date.now()}.ps1`);
    const psContent = `
Add-Type -AssemblyName presentationCore
$mediaPlayer = New-Object System.Windows.Media.MediaPlayer
$mediaPlayer.Open('${resolvedPath.replace(/\\/g, '\\\\')}')
$mediaPlayer.Play()
Start-Sleep -Seconds 3
$mediaPlayer.Close()
Remove-Item -Path '${tempScript.replace(/\\/g, '\\\\')}' -Force
`;
    fs.writeFileSync(tempScript, psContent);
    exec(`powershell -ExecutionPolicy Bypass -File "${tempScript}"`, (err) => {
        if (err) {
            console.error('Failed to play sound:', err.message);
        }
    });
}
// 创建 MCP 服务器
const server = new Server({
    name: 'windows-notify-mcp',
    version: '1.0.0'
}, {
    capabilities: {
        tools: { listChanged: true }
    }
});
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
                        soundFile: {
                            type: 'string',
                            description: 'Optional path to a custom sound file (mp3, wav). If provided, this will be played instead of the default sound.',
                            default: ''
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
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'notify') {
        const { title, message, icon, sound = true, soundFile, wait = false } = args;
        return new Promise((resolve) => {
            const notificationOptions = {
                title,
                message,
                sound: (soundFile || DEFAULT_SOUND) ? false : sound, // 如果有自定义音频，禁用默认声音
                wait
            };
            if (icon) {
                notificationOptions.icon = path.resolve(icon);
            }
            // 播放自定义音频（优先使用参数传入的，其次使用环境变量配置的）
            const audioToPlay = soundFile || DEFAULT_SOUND;
            if (audioToPlay && sound) {
                playSound(audioToPlay);
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
                }
                else {
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
        const { title, message, actions = [] } = args;
        return new Promise((resolve) => {
            const notificationOptions = {
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
                }
                else {
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
