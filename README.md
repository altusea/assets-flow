# Hello Assets - 个人资产追踪应用

一个基于 Tauri + Vue 3 + TypeScript 构建的个人资产记录与管理应用，帮助用户按周记录资产变动并分析趋势。

## 功能特点

- 📊 **资产记录**: 按周记录各个账户的余额情况
- 🏦 **多账户管理**: 支持银行卡、现金、电子支付、股票等多种账户类型
- 📈 **趋势分析**: 提供周度、月度、季度的资产变动分析
- 💰 **资产分布**: 可视化展示不同账户的资金占比
- 📝 **备注功能**: 支持为每周记录收入和支出备注
- 📋 **详细表格**: 提供历史记录的详细表格视图
- 📱 **桌面应用**: 基于 Tauri 的轻量级桌面应用

## 技术架构

- **前端**: Vue 3 + TypeScript + Vite
- **桌面端**: Tauri (Rust 后端)
- **数据存储**: 本地 localStorage
- **UI**: 响应式设计，支持多主题

## 数据模型

- **Account**: 账户信息（银行卡、现金、股票等）
- **WeeklyRecord**: 周资产记录快照
- **WeeklySummary**: 周资产汇总
- **WeeklyNote**: 周备注信息

**重要说明**: 应用使用周六作为每周的记录日期，确保数据的一致性和准确性。

## 开发环境

### 推荐的 IDE 配置

+ [VS Code](https://code.visualstudio.com/)
+ [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
+ [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
+ [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run dev

# 运行桌面应用开发模式
npm run tauri dev

# 构建生产版本
npm run build

# 构建桌面应用
npm run tauri build

# 类型检查
npx vue-tsc --noEmit
```

### 项目结构

```
src/
├── components/          # Vue 组件
│   ├── Dashboard.vue      # 仪表盘总览
│   ├── WeeklyRecordManager.vue  # 周记录管理
│   ├── DetailedRecordsTable.vue  # 详细记录表格
│   └── AccountManager.vue     # 账户管理
├── storage.ts           # 数据存储服务
├── types.ts            # TypeScript 类型定义
└── App.vue             # 主应用组件
```

## 使用说明

1. **添加账户**: 首先在"账户管理"中添加你的银行账户、现金账户等
2. **记录余额**: 每周六记录各账户的当前余额
3. **查看分析**: 在"仪表盘"查看总资产、分布图表和变动趋势
4. **历史记录**: 在"详细记录"查看完整的历史数据和备注

## 端口配置

开发服务器默认运行在端口 3000（而非 Tauri 默认的 1420），以避免权限问题。

## 许可证

MIT License
