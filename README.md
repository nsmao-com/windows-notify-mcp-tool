# Windows Notify MCP

一个用于发送 Windows 桌面通知的 MCP (Model Context Protocol) 服务器。

## 功能

- `notify` - 发送基本的 Windows 桌面通知
- `notify_with_actions` - 发送带有操作按钮的通知

## 安装

```bash
pnpm install
pnpm build
```

## 使用方法

### Claude Desktop 配置

在 Claude Desktop 的配置文件中添加:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "windows-notify": {
      "command": "node",
      "args": ["D:/2024Dev/2026/MCP/windows_notify_mcp/dist/index.js"]
    }
  }
}
```

### 工具说明

#### notify

发送基本通知:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 通知标题 |
| message | string | 是 | 通知内容 |
| icon | string | 否 | 图标文件路径 (png, jpg, ico) |
| sound | boolean | 否 | 是否播放声音 (默认 true) |
| wait | boolean | 否 | 是否等待用户交互 (默认 false) |

#### notify_with_actions

发送带操作按钮的通知:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 通知标题 |
| message | string | 是 | 通知内容 |
| actions | string[] | 否 | 操作按钮标签数组 |

## 示例

```
发送一个通知，标题是"任务完成"，内容是"您的构建已完成"
```
