# 🕒 工时统计助手 - 轮盘版 (Work Hours Assistant)

[![Version](https://img.shields.io/badge/Version-V44.2-blue.svg?style=flat-square)](https://raw.githubusercontent.com/junchengdu57-dev/DJtools/main/CsgoWebTool.user.js)
[![Platform](https://img.shields.io/badge/Platform-Tampermonkey-orange.svg?style=flat-square)](https://www.tampermonkey.net/)
[![Theme](https://img.shields.io/badge/Theme-Dark%20Mode-black.svg?style=flat-square)](#)

**工时统计助手** 是一款专为提升工作效率设计的 Tampermonkey 脚本。它通过创新的**交互式圆环轮盘**界面，集成了工时填报、薪资查询、考勤统计及 Jira 联动等核心功能，彻底告别繁琐的多系统切换。

---

## ✨ 核心特性

### 🎨 卓越的交互体验

- **圆形轮盘 UI**：8 等分扇区菜单，支持悬停高亮与中心 Hub 快速返回。
- **自定义布局**：支持菜单项**拖拽排序**，打造个人专属高效工作流。
- **视觉风格**：沉浸式深色主题，辅以二级轮盘动画，兼具美观与实用。
- **视图持久化**：(V44.2 新增) 关闭脚本后重新打开，自动保留上次填写的表单内容与二级视图状态。

### 🛠️ 强大的功能矩阵

- **一键填报**：自动抓取 Jira/Ex 摘要，支持“参考昨日”快速复制记录。
- **多系统集成**：统一管理萨瑞系统、Mobiwire、工时系统 (TS) 账号。
- **深度统计**：按季度/月度分析积分评分，支持跨年份薪资/考勤数据一键汇总导出。
- **自动化流**：自动登录校验、会话失效引导重连。

---

## 🚀 快速开始

### 1. 前置要求

确保您的浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 插件。

### 2. 安装脚本

点击下方链接，在 Tampermonkey 弹出页面点击“安装”：
👉 [安装最新版 CsgoWebTool.user.js](https://raw.githubusercontent.com/junchengdu57-dev/DJtools/main/CsgoWebTool.user.js)

### 3. 基础操作

| 动作            | 快捷键/方式        |
| :-------------- | :----------------- |
| **开启 / 关闭** | `Alt + S`          |
| **快速退出**    | 点击遮罩层空白区域 |
| **返回主菜单**  | 点击中心圆盘 (Hub) |

---

## 📦 模块详解

### 📊 数据统计与查询

*   **工作量统计**：提供 Q1-Q4/本月快捷选项，精准解析数据结构，展示积分分布与评分等级。
*   **薪资查询 (Mobiwire)**：
    *   **同年查询**：指定年份 + 起止月份。
    *   **跨年查询 (V44.2)**：支持起止年月范围选择，自动循环采集并导出汇总 CSV。
*   **考勤统计**：逐月汇总加班与考勤明细，生成可视化统计表。

### 📝 工时填报系统

*   **Jira 联动**：自动同步任务摘要，登录失效时智能跳转引导。
*   **TS 系统集成**：涵盖开发、预研、Common 三大类，自动加载产品形态、阶段及检查人。
*   **历史记录**：本地缓存最近 200 条提交记录，支持单项删除与一键回填。

### ⚙️ 账号配置

*   在“账号设置”中统一配置 **萨瑞、Mobiwire、TS** 账号。
*   数据存储于脚本管理器本地，保障隐私安全，不进行任何服务器上传。

---

## 🛠️ 技术规格

### 权限说明

脚本使用以下关键权限以实现功能：

- `GM_xmlhttpRequest`: 跨域请求 Jira/TS/Mobiwire 接口。
- `GM_getValue / GM_setValue`: 本地持久化配置与填报历史。
- `GM_openInTab`: 用于引导用户完成系统登录。

### 网络域名白名单

脚本会与以下环境通信：

- **萨瑞系统**: `work.cqdev.top` / `172.16.1.77`
- **Jira 系统**: `jira.transsion.com` / `jira-ex.transsion.com`
- **Mobiwire**: `www.mobiwire.com.cn`
- **工时系统**: `122.227.250.174` (TS 接口)

---

## 📝 更新日志

### **V44.2** (当前版本)

- **[新增]** 薪资查询支持“跨年份”功能，自动逐月抓取并命名 CSV (格式：`Mobiwire薪资_YYYYMM-YYYYMM.csv`)。
- **[优化]** 强化 TS 系统登录逻辑，账号变更后强制重新登录生效。
- **[修复]** 修复了关闭脚本后再次打开，右侧已填表单消失的问题。

### **历史版本亮点**

- 支持轮盘扇区拖拽排序。
- 集成工时系统 CSV 批量导出功能。
- 修复评分系统在复杂数据结构下的解析错误。

---

## 🤝 鸣谢与反馈

*   **作者**: DJ
*   **反馈**: 如遇 Bug 或功能建议，请在群内 @作者 或提交 GitHub Issue。

---

*Powered by DJ Tools - 让每一秒工时都有迹可循*
