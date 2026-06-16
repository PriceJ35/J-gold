# 水贝黄金价格小程序

## 项目说明
这是一个微信小程序，用于实时查看水贝黄金价格，包含历史价格走势图表。

## 使用前准备

### 1. 下载 ECharts 库
由于 ECharts 库文件较大，需要手动下载：

1. 访问 ECharts 在线构建工具：https://echarts.apache.org/zh/builder.html
2. 选择需要的组件（至少包含：折线图、Tooltip、Grid）
3. 点击"下载"获取 `echarts.min.js`
4. 将下载的文件重命名为 `echarts.min.js`
5. 放到 `components/ec-canvas/` 目录下

或者直接从 GitHub 下载：
```
https://github.com/ecomfe/echarts-for-weixin/raw/master/ec-canvas/echarts.js
```

### 2. 配置 AppID
1. 打开 `project.config.json`
2. 将 `appid` 改为你自己的小程序 AppID
3. 如果只是测试，可以使用游客模式

## 功能特性
- ✅ 实时价格显示（足金999、999.9、金条、回收、国际、沪金）
- ✅ 历史价格折线图
- ✅ 时间范围切换（1周、1月、3月、6月、1年）
- ✅ 价格类型切换
- ✅ 手势缩放图表
- ✅ 自动刷新功能
- ✅ 统计信息（最高、最低、平均、涨跌幅）

## 项目结构
```
shuibei-gold-miniprogram/
├── app.js                 # 小程序入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── sitemap.json           # 站点地图
├── pages/
│   └── index/             # 首页
│       ├── index.js
│       ├── index.json
│       ├── index.wxml
│       └── index.wxss
└── components/
    └── ec-canvas/         # ECharts 图表组件
        ├── ec-canvas.js
        ├── ec-canvas.json
        ├── ec-canvas.wxml
        ├── ec-canvas.wxss
        └── echarts.min.js # ⚠️ 需要手动下载
```

## 开发说明
1. 使用微信开发者工具打开项目目录
2. 确保 `echarts.min.js` 已放置在正确位置
3. 点击"编译"预览小程序

## 数据说明
- 当前使用模拟数据（基于2026年3月市场参考价）
- 如需真实数据，可接入第三方 API

## 截图预览
小程序界面包含：
- 金色主题深色背景
- 6个价格卡片
- 交互式折线图
- 时间范围和价格类型选择器

---
⚠️ 数据仅供参考，以实际交易价格为准
