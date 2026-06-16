// pages/index/index.js

// ==================== 配置 ====================

// 2026年3月水贝金价参考数据
const PRICE_CONFIG = {
  gold9999: { base: 682, volatility: 15 },
  gold999: { base: 680, volatility: 15 },
  goldBar: { base: 675, volatility: 12 },
  silver: { base: 8.2, volatility: 0.3 },
  platinum: { base: 260, volatility: 10 },
  palladium: { base: 230, volatility: 12 }
}

// 数据源
const DATA_URL = 'https://h5.asj9999.com/'

// ==================== 工具函数 ====================

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 生成历史数据
function genHistory(days, base, volatility) {
  const data = []
  const today = new Date()
  let price = base

  for (let i = days; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)

    price += (Math.random() - 0.48) * volatility
    price = Math.max(price, base * 0.85)
    price = Math.min(price, base * 1.15)

    data.push({
      date: formatDate(d),
      price: parseFloat(price.toFixed(2))
    })
  }
  return data
}

// 生成实时数据（24小时）
function genRealtimeData(base, volatility) {
  const data = []
  const now = new Date()
  const totalMins = now.getHours() * 60 + now.getMinutes()
  const points = Math.floor(totalMins / 5) + 1
  let price = base

  for (let i = 0; i < points; i++) {
    const mins = i * 5
    const h = String(Math.floor(mins / 60)).padStart(2, '0')
    const m = String(mins % 60).padStart(2, '0')

    price += (Math.random() - 0.5) * volatility * 0.1
    price = Math.max(price, base * 0.98)
    price = Math.min(price, base * 1.02)

    data.push({
      time: `${h}:${m}`,
      price: parseFloat(price.toFixed(2))
    })
  }
  return data
}

// 解析HTML价格
function parseHtmlPrices(html) {
  const prices = {}

  const spotRx = /<li[^>]*class="flex_product"[^>]*>(黄金|白银|铂金|钯金)<\/li>[\s\S]*?<li[^>]*class="[^"]*font"[^>]*>([^<]+)<\/li>[\s\S]*?<li[^>]*class="[^"]*font"[^>]*>([^<]+)<\/li>[\s\S]*?<uni-view[^>]*class="[^"]*font"[^>]*>([^<]+)<\/uni-view>[\s\S]*?<uni-view[^>]*class="[^"]*font"[^>]*>([^<]+)<\/uni-view>/g

  const nameMap = {
    '黄金': 'gold9999',
    '白银': 'silver',
    '铂金': 'platinum',
    '钯金': 'palladium'
  }

  let m
  while ((m = spotRx.exec(html)) !== null) {
    const key = nameMap[m[1].trim()]
    if (key && m[2].trim() !== '--') {
      prices[key] = {
        buy: parseFloat(m[2]),
        sell: parseFloat(m[3]) || parseFloat(m[2]) + 2,
        high: parseFloat(m[4]) || parseFloat(m[2]),
        low: parseFloat(m[5]) || parseFloat(m[2])
      }
    }
  }

  return prices
}

// ==================== 页面 ====================

Page({
  data: {
    metalTypes: [
      { label: '黄金', value: 'gold', icon: '🥇' },
      { label: '白银', value: 'silver', icon: '🥈' },
      { label: '铂金', value: 'platinum', icon: '💎' }
    ],
    currentMetal: 'gold',

    priceList: [],

    chartTypes: [
      { label: '实时图', value: 'realtime' },
      { label: '走势图', value: 'history' }
    ],
    currentChartType: 'realtime',

    timeRanges: [
      { label: '7天', value: '7D' },
      { label: '1月', value: '1M' },
      { label: '6月', value: '6M' },
      { label: '1年', value: '1Y' },
      { label: '5年', value: '5Y' }
    ],
    currentRange: '1M',

    stats: { high: '--', low: '--', avg: '--', change: '--' },
    updateTime: '--',
    status: '连接中...',
    loading: false,
    autoRefresh: true,
    dataSource: '艾尚珠宝'
  },

  // 实例数据
  historyData: null,
  realtimeData: null,
  currentPrices: null,
  selectedKey: 'gold9999',
  chartCanvas: null,
  chartCtx: null,
  chartW: 0,
  chartH: 0,
  refreshTimer: null,
  drawCounter: 0,

  onLoad() {
    this.initData()
    this.fetchData()
    this.startAutoRefresh()
  },

  onReady() {
    setTimeout(() => this.initChart(), 300)
  },

  onUnload() {
    this.stopAutoRefresh()
  },

  // ==================== 数据初始化 ====================

  initData() {
    // 历史数据
    this.historyData = {
      gold9999: genHistory(1825, PRICE_CONFIG.gold9999.base, PRICE_CONFIG.gold9999.volatility),
      gold999: genHistory(1825, PRICE_CONFIG.gold999.base, PRICE_CONFIG.gold999.volatility),
      goldBar: genHistory(1825, PRICE_CONFIG.goldBar.base, PRICE_CONFIG.goldBar.volatility),
      silver: genHistory(1825, PRICE_CONFIG.silver.base, PRICE_CONFIG.silver.volatility),
      platinum: genHistory(1825, PRICE_CONFIG.platinum.base, PRICE_CONFIG.platinum.volatility),
      palladium: genHistory(1825, PRICE_CONFIG.palladium.base, PRICE_CONFIG.palladium.volatility)
    }

    // 实时数据
    this.realtimeData = {
      gold9999: genRealtimeData(PRICE_CONFIG.gold9999.base, PRICE_CONFIG.gold9999.volatility),
      gold999: genRealtimeData(PRICE_CONFIG.gold999.base, PRICE_CONFIG.gold999.volatility),
      goldBar: genRealtimeData(PRICE_CONFIG.goldBar.base, PRICE_CONFIG.goldBar.volatility),
      silver: genRealtimeData(PRICE_CONFIG.silver.base, PRICE_CONFIG.silver.volatility),
      platinum: genRealtimeData(PRICE_CONFIG.platinum.base, PRICE_CONFIG.platinum.volatility),
      palladium: genRealtimeData(PRICE_CONFIG.palladium.base, PRICE_CONFIG.palladium.volatility)
    }

    // 当前价格
    this.currentPrices = {
      gold9999: { buy: PRICE_CONFIG.gold9999.base, sell: PRICE_CONFIG.gold9999.base + 2, high: PRICE_CONFIG.gold9999.base, low: PRICE_CONFIG.gold9999.base },
      gold999: { buy: PRICE_CONFIG.gold999.base, sell: PRICE_CONFIG.gold999.base + 2, high: PRICE_CONFIG.gold999.base, low: PRICE_CONFIG.gold999.base },
      goldBar: { buy: PRICE_CONFIG.goldBar.base, sell: PRICE_CONFIG.goldBar.base + 2, high: PRICE_CONFIG.goldBar.base, low: PRICE_CONFIG.goldBar.base },
      silver: { buy: PRICE_CONFIG.silver.base, sell: PRICE_CONFIG.silver.base + 0.1, high: PRICE_CONFIG.silver.base, low: PRICE_CONFIG.silver.base },
      platinum: { buy: PRICE_CONFIG.platinum.base, sell: PRICE_CONFIG.platinum.base + 5, high: PRICE_CONFIG.platinum.base, low: PRICE_CONFIG.platinum.base },
      palladium: { buy: PRICE_CONFIG.palladium.base, sell: PRICE_CONFIG.palladium.base + 5, high: PRICE_CONFIG.palladium.base, low: PRICE_CONFIG.palladium.base }
    }

    this.updatePriceList()
  },

  // ==================== 数据获取 ====================

  fetchData() {
    wx.request({
      url: DATA_URL,
      method: 'GET',
      timeout: 5000,
      success: res => {
        if (res.statusCode === 200 && res.data) {
          const prices = parseHtmlPrices(res.data)
          if (Object.keys(prices).length > 0) {
            this.applyPrices(prices)
            this.setData({ status: '✅ 实时', dataSource: '艾尚珠宝' })
          } else {
            this.simulatePrices()
            this.setData({ status: '⚠️ 模拟', dataSource: '模拟数据' })
          }
        } else {
          this.simulatePrices()
        }
      },
      fail: () => {
        this.simulatePrices()
        this.setData({ status: '⚠️ 网络错误', dataSource: '模拟数据' })
      }
    })
  },

  applyPrices(prices) {
    const now = new Date()
    const timeStr = formatTime(now)

    Object.keys(prices).forEach(key => {
      if (this.currentPrices[key]) {
        const p = prices[key]
        this.currentPrices[key] = {
          buy: p.buy,
          sell: p.sell,
          high: Math.max(this.currentPrices[key].high, p.buy),
          low: Math.min(this.currentPrices[key].low, p.buy)
        }

        // 添加到实时数据
        if (this.realtimeData[key]) {
          this.realtimeData[key].push({ time: timeStr, price: p.buy })
          if (this.realtimeData[key].length > 288) {
            this.realtimeData[key].shift()
          }
        }
      }
    })

    this.refreshUI(timeStr)
  },

  simulatePrices() {
    const now = new Date()
    const timeStr = formatTime(now)

    Object.keys(this.currentPrices).forEach(key => {
      const config = PRICE_CONFIG[key]
      if (!config) return

      const last = this.currentPrices[key].buy || config.base
      const change = (Math.random() - 0.5) * config.volatility * 0.05
      const newPrice = Math.max(last + change, config.base * 0.95)

      this.currentPrices[key] = {
        buy: newPrice,
        sell: newPrice + (key === 'silver' ? 0.1 : 2),
        high: Math.max(this.currentPrices[key].high, newPrice),
        low: Math.min(this.currentPrices[key].low, newPrice)
      }

      if (this.realtimeData[key]) {
        this.realtimeData[key].push({ time: timeStr, price: parseFloat(newPrice.toFixed(2)) })
        if (this.realtimeData[key].length > 288) {
          this.realtimeData[key].shift()
        }
      }
    })

    this.refreshUI(timeStr)
  },

  // ==================== UI更新 ====================

  refreshUI(timeStr) {
    this.updatePriceList()

    // 图表每30次刷新才重绘一次
    this.drawCounter++
    if (this.drawCounter >= 30) {
      this.drawChart()
      this.drawCounter = 0
    }

    this.setData({ updateTime: timeStr })
  },

  updatePriceList() {
    const metal = this.data.currentMetal

    const metalMap = {
      gold: [
        { key: 'gold9999', name: '黄金9999', icon: '💰' },
        { key: 'gold999', name: '黄 金', icon: '💰' },
        { key: 'goldBar', name: '金 条', icon: '💰' }
      ],
      silver: [
        { key: 'silver', name: '白 银', icon: '🥈' }
      ],
      platinum: [
        { key: 'platinum', name: '铂 金', icon: '💎' },
        { key: 'palladium', name: '钯 金', icon: '💎' }
      ]
    }

    const items = metalMap[metal] || []
    const list = items.map(item => {
      const p = this.currentPrices[item.key]
      if (!p) return null

      const decimals = metal === 'silver' ? 2 : 2

      return {
        key: item.key,
        name: item.name,
        icon: item.icon,
        buy: p.buy.toFixed(decimals),
        sell: p.sell.toFixed(decimals),
        high: p.high.toFixed(decimals),
        low: p.low.toFixed(decimals),
        selected: this.selectedKey === item.key
      }
    }).filter(Boolean)

    this.setData({ priceList: list })
  },

  // ==================== 图表 ====================

  initChart() {
    const query = wx.createSelectorQuery()
    query.select('#priceChart').fields({ node: true, size: true }).exec(res => {
      if (!res?.[0]) {
        setTimeout(() => this.initChart(), 200)
        return
      }

      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio

      this.chartCanvas = canvas
      this.chartCtx = ctx
      this.chartW = res[0].width
      this.chartH = res[0].height

      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)

      this.drawChart()
    })
  },

  drawChart() {
    const ctx = this.chartCtx
    if (!ctx) return

    const chartType = this.data.currentChartType
    const range = this.data.currentRange
    const key = this.selectedKey

    if (!key || !this.historyData?.[key]) return

    // 获取数据
    let data = []
    if (chartType === 'realtime') {
      data = this.realtimeData[key] || []
    } else {
      let days = 30
      switch (range) {
        case '7D': days = 7; break
        case '1M': days = 30; break
        case '6M': days = 180; break
        case '1Y': days = 365; break
        case '5Y': days = 1825; break
      }
      const history = this.historyData[key] || []
      data = history.slice(-days)
    }

    if (data.length < 2) return

    this.renderChart(data, chartType === 'realtime')
    this.updateStats(data)
  },

  renderChart(data, isRealtime) {
    const ctx = this.chartCtx
    const w = this.chartW
    const h = this.chartH

    if (!ctx || !w || !h) return

    const prices = data.map(d => d.price)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const priceRange = maxP - minP || 1

    const pad = { top: 25, right: 15, bottom: 35, left: 55 }
    const cw = w - pad.left - pad.right
    const ch = h - pad.top - pad.bottom

    // 清空画布
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, w, h)

    // 绘制网格线和Y轴标签
    ctx.strokeStyle = 'rgba(255,215,0,0.1)'
    ctx.lineWidth = 1
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'

    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(w - pad.right, y)
      ctx.stroke()

      const price = maxP - (priceRange / 4) * i
      ctx.fillStyle = '#666'
      const decimals = price > 100 ? 0 : 2
      ctx.fillText(price.toFixed(decimals), pad.left - 5, y + 3)
    }

    // 计算点坐标
    const points = data.map((d, i) => ({
      x: pad.left + (cw / (data.length - 1)) * i,
      y: pad.top + ch - ((d.price - minP) / priceRange) * ch
    }))

    // 绘制渐变填充
    const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom)
    grad.addColorStop(0, 'rgba(255,215,0,0.25)')
    grad.addColorStop(1, 'rgba(255,215,0,0)')

    ctx.beginPath()
    ctx.moveTo(points[0].x, h - pad.bottom)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, h - pad.bottom)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // 绘制折线
    ctx.beginPath()
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 2
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.stroke()

    // X轴标签
    ctx.fillStyle = '#666'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'

    const labelCount = 6
    const interval = Math.max(1, Math.floor(data.length / labelCount))

    data.forEach((d, i) => {
      if (i % interval === 0 || i === data.length - 1) {
        const x = pad.left + (cw / (data.length - 1)) * i
        let label = ''

        if (isRealtime) {
          label = (d.time || '').substring(0, 5)
        } else {
          const date = d.date || ''
          if (data.length > 365) {
            label = date.length >= 7 ? date.substring(2, 7).replace('-', '/') : date
          } else {
            label = date.length >= 5 ? date.substring(5) : date
          }
        }
        ctx.fillText(label, x, h - pad.bottom + 15)
      }
    })

    // 最后一个点
    const last = points[points.length - 1]
    ctx.beginPath()
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#ffd700'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()
  },

  updateStats(data) {
    if (!data || data.length < 2) return

    const prices = data.map(d => d.price)
    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const change = ((prices[prices.length - 1] - prices[0]) / prices[0] * 100)

    this.setData({
      stats: {
        high: high.toFixed(2),
        low: low.toFixed(2),
        avg: avg.toFixed(2),
        change: change.toFixed(2)
      }
    })
  },

  // ==================== 事件处理 ====================

  onMetalChange(e) {
    const metal = e.currentTarget.dataset.metal
    this.setData({ currentMetal: metal })

    // 选择该金属的第一个品种
    const metalMap = {
      gold: 'gold9999',
      silver: 'silver',
      platinum: 'platinum'
    }
    this.selectedKey = metalMap[metal] || 'gold9999'
    this.drawCounter = 0
    this.updatePriceList()
    this.drawChart()
  },

  onChartTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentChartType: type })
    this.drawCounter = 0
    this.drawChart()
  },

  onRangeChange(e) {
    const range = e.currentTarget.dataset.range
    this.setData({ currentRange: range })
    this.drawCounter = 0
    this.drawChart()
  },

  onPriceSelect(e) {
    const key = e.currentTarget.dataset.key
    this.selectedKey = key
    this.drawCounter = 0
    this.updatePriceList()
    this.drawChart()
  },

  // ==================== 刷新控制 ====================

  startAutoRefresh() {
    this.refreshTimer = setInterval(() => this.fetchData(), 1000)
    this.setData({ autoRefresh: true, status: '🔄 每秒刷新' })
  },

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    this.setData({ autoRefresh: false, status: '已暂停' })
  },

  refreshPrice() {
    this.setData({ loading: true })
    this.fetchData()
    setTimeout(() => this.setData({ loading: false }), 500)
  },

  toggleAutoRefresh() {
    if (this.data.autoRefresh) {
      this.stopAutoRefresh()
    } else {
      this.startAutoRefresh()
    }
  }
})
