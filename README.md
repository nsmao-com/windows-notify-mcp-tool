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
| soundFile | string | 否 | 自定义音频文件路径 (mp3, wav)，指定后将播放此音频而非默认声音 |
| wait | boolean | 否 | 是否等待用户交互 (默认 false) |

#### notify_with_actions

发送带操作按钮的通知:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 通知标题 |
| message | string | 是 | 通知内容 |
| actions | string[] | 否 | 操作按钮标签数组 |

## 示例

### 基本通知

```json
{
  "title": "任务完成",
  "message": "您的构建已完成"
}
```

### 带自定义音频的通知

```json
{
  "title": "下载完成",
  "message": "文件已保存",
  "soundFile": "D:/sounds/ding.mp3"
}
```

### 带图标的通知

```json
{
  "title": "提醒",
  "message": "会议将在5分钟后开始",
  "icon": "D:/icons/reminder.png",
  "sound": true
}
```

### 带操作按钮的通知

```json
{
  "title": "新消息",
  "message": "您有一条新消息",
  "actions": ["查看", "忽略"]
}
```
