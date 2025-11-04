<template>
  <view class="container">
    <view class="header">
      <text class="h1">宝可梦百科</text>
      <text class="header-subtitle">探索宝可梦在不同世代游戏中的介绍</text>
    </view>

    <view class="content-wrapper">
      <view class="generations-nav">
        <text class="nav-title">选择世代</text>
        <scroll-view class="generation-list" scroll-x>
          <view
            v-for="gen in generations"
            :key="gen.id"
            class="generation-item"
            :class="[gen.color, { active: gen.id === activeGenId }]"
            @click="selectGen(gen.id)"
          >{{ gen.nameShort }}</view>
        </scroll-view>
      </view>

      <view class="content-area">
        <view v-if="activeGen" class="generation-title" :class="activeGen.color + '-title'">
          {{ activeGen.name }}
        </view>

        <view class="games-container">
          <view v-for="(game, idx) in activeGenGames" :key="idx" class="game-card" :class="activeGen.color + '-theme'">
            <view class="game-title">{{ game.version }}</view>
            <view class="game-description">{{ game.text }}</view>
          </view>
          <view v-if="loading" class="loading"><view class="loading-spinner"></view></view>
          <view v-if="!loading && activeGenGames.length === 0" class="empty">暂无该世代数据</view>
        </view>
      </view>
    </view>

    <view class="footer">
      <text>数据来源: 数据库 flavor_text | 本页面仅用于演示目的</text>
    </view>

    <view class="back-to-top" :class="{ visible: showBackTop }" @click="backToTop">↑</view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: true,
      showBackTop: false,
      activeGenId: null,
      generations: [],
      groupedByGen: {},
      supabaseUrl: '',
      supabaseKey: ''
    }
  },
  computed: {
    activeGen() {
      return this.generations.find(g => g.id === this.activeGenId) || null
    },
    activeGenGames() {
      if (!this.activeGen) return []
      return this.groupedByGen[this.activeGen.id] || []
    }
  },
  onLoad(query) {
    const index = query && (query.index || query.pokemon_index)
    if (!index) {
      console.warn('[wiki] 缺少 index 参数')
      this.loading = false
      return
    }
    this.bootstrapEnv()
    this.fetchFlavorText(Number(index))
    // 监听滚动
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll, { passive: true })
    }
  },
  onUnload() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    // 注入环境变量（H5/APP 通用）
    bootstrapEnv() {
      try {
        const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
        this.supabaseUrl = env && env.VITE_SUPABASE_URL ? String(env.VITE_SUPABASE_URL) : ''
        this.supabaseKey = env && env.VITE_SUPABASE_ANON_KEY ? String(env.VITE_SUPABASE_ANON_KEY) : ''
      } catch (e) {}
      if ((!this.supabaseUrl || !this.supabaseKey) && typeof uni !== 'undefined') {
        // 兜底从 static/app-config.json 读取
        try {
          uni.request({
            url: '/static/app-config.json',
            method: 'GET',
            success: (res) => {
              const cfg = res && res.data ? res.data : null
              if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) {
                this.supabaseUrl = String(cfg.supabaseUrl)
                this.supabaseKey = String(cfg.supabaseAnonKey).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
              }
            }
          })
        } catch (e) {}
      }
    },
    async fetchFlavorText(pokemonId) {
      // 固定使用表 flavor_texts 且使用原样 pokemon_id，不再左补零/不再多表尝试
      this.loading = true
      try {
        const base = (this.supabaseUrl || '').replace(/\/$/, '')
        if (!base || !this.supabaseKey) throw new Error('缺少 Supabase 配置')
        const headers = { 'apikey': this.supabaseKey, 'Authorization': `Bearer ${this.supabaseKey}`, 'Accept': 'application/json' }

        const key = String(pokemonId)
        const url = `${base}/rest/v1/flavor_texts?select=generation,version,text,pokemon_id&pokemon_id=eq.${encodeURIComponent(key)}&order=generation.asc,version.asc`
        console.log('[wiki:fetchFlavorText] url=', url)
        const res = await new Promise((resolve, reject) => {
          uni.request({ url, method: 'GET', header: headers, timeout: 12000, success: resolve, fail: reject })
        })
        console.log('[wiki:req] status=', res.statusCode, ' len=', Array.isArray(res.data)? res.data.length : -1, ' sample=', Array.isArray(res.data) && res.data.length ? res.data[0] : null)
        if (res.statusCode < 200 || res.statusCode >= 300) throw new Error('HTTP ' + res.statusCode)
        const rows = Array.isArray(res.data) ? res.data : []

        // 分组并生成世代导航（容错：支持 '第一世代' 等中文字符串或数字；缺失则归 1）
        const toGenId = (val) => {
          if (val == null || val === '') return 1
          if (typeof val === 'number' && Number.isFinite(val)) return val
          const s = String(val)
          const m = s.match(/\d+/)
          if (m) {
            const n = Number(m[0])
            if (Number.isFinite(n) && n > 0) return n
          }
          const zhMap = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9 }
          for (const k in zhMap) { if (s.includes(k)) return zhMap[k] }
          return 1
        }
        const groups = {}
        rows.forEach(r => {
          const g = toGenId(r.generation)
          const version = r.version ?? r.version_name ?? r.game ?? ''
          const text = r.text ?? r.flavor_text ?? r.description ?? ''
          if (!groups[g]) groups[g] = []
          groups[g].push({ version, text })
        })
        const gens = Object.keys(groups).map(k => Number(k)).filter(n=>Number.isFinite(n)).sort((a,b)=>a-b)
        console.log('[wiki:fetchFlavorText] gens=', gens, ' groupSizes=', gens.map(g=>groups[g].length))
        const mapped = gens.map(g => ({ id: g, name: this.genName(g), nameShort: `第${g}世代`, color: this.genColor(g) }))
        this.generations = mapped
        this.groupedByGen = groups
        this.activeGenId = gens[0] || null
      } catch (e) {
        console.warn('[wiki] 获取 flavor_text 失败:', e)
        this.generations = []
        this.groupedByGen = {}
        this.activeGenId = null
      } finally {
        this.loading = false
      }
    },
    genName(g) {
      const map = {
        1: '第一世代 (1996-1999)',
        2: '第二世代 (1999-2002)',
        3: '第三世代 (2002-2006)',
        4: '第四世代 (2006-2010)',
        5: '第五世代 (2010-2013)',
        6: '第六世代 (2013-2016)',
        7: '第七世代 (2016-2019)',
        8: '第八世代 (2019-2023)',
        9: '第九世代 (2022-至今)'
      }
      return map[g] || `第${g}世代`
    },
    genColor(g) {
      const map = { 1: 'gen1', 2: 'gen2', 3: 'gen3', 4: 'gen4', 5: 'gen5', 6: 'gen6', 7: 'gen7', 8: 'gen8', 9: 'gen9' }
      return map[g] || 'gen1'
    },
    selectGen(id) { this.activeGenId = id },
    handleScroll() {
      if (typeof window === 'undefined') return
      this.showBackTop = window.pageYOffset > 300
    },
    backToTop() {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>

<style scoped>
.container { width: 100%; margin: 0 auto; padding: 0; max-width: 100%; color: #fff; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; }
.header { text-align: center; padding: 20px 15px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: #fff; position: sticky; top: 0; z-index: 100; }
.h1 { font-size: 36rpx; font-weight: 700; display: block; margin-bottom: 8px; }
.header-subtitle { font-size: 24rpx; opacity: 0.9; }
.content-wrapper { display: flex; flex-direction: column; }
.generations-nav { background: rgba(30, 30, 46, 0.95); padding: 15px 10px; position: sticky; top: 80px; z-index: 99; }
.nav-title { display: block; margin-bottom: 10px; text-align: center; font-size: 28rpx; }
.generation-list { white-space: nowrap; }
.generation-item { display: inline-flex; padding: 12px 16px; margin-right: 8px; border-radius: 25px; border: 2px solid transparent; font-weight: 600; min-height: 44px; align-items: center; justify-content: center; }
.generation-item.active { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.4); }
.content-area { padding: 20px 15px; }
.generation-title { margin-bottom: 20px; padding-bottom: 10px; border-bottom-width: 2px; border-bottom-style: solid; font-size: 32rpx; }
.games-container { display: grid; grid-template-columns: 1fr; grid-row-gap: 20px; }
.game-card { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; border-left: 5px solid; }
.game-title { font-weight: bold; margin-bottom: 12px; font-size: 30rpx; }
.game-description { font-size: 28rpx; color: rgba(255,255,255,0.9); }
.footer { text-align: center; padding: 20px; color: rgba(255,255,255,0.7); font-size: 24rpx; background: rgba(20,20,35,0.9); }
.loading { text-align: center; padding: 20px; }
.loading-spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.back-to-top { position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background: #e74c3c; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 99; opacity: 0; transition: opacity 0.3s; }
.back-to-top.visible { opacity: 1; }
/* 颜色主题 */
.gen1 { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; }
.gen2 { background: linear-gradient(135deg, #f1c40f, #f39c12); color: #2c3e50; }
.gen3 { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; }
.gen4 { background: linear-gradient(135deg, #9b59b6, #8e44ad); color: #fff; }
.gen5 { background: linear-gradient(135deg, #34495e, #2c3e50); color: #fff; }
.gen6 { background: linear-gradient(135deg, #1abc9c, #16a085); color: #fff; }
.gen7 { background: linear-gradient(135deg, #e67e22, #d35400); color: #fff; }
.gen8 { background: linear-gradient(135deg, #c0392b, #a93226); color: #fff; }
.gen9 { background: linear-gradient(135deg, #8e44ad, #6c3483); color: #fff; }
.gen1-title { color: #e74c3c; border-bottom-color: #e74c3c; }
.gen2-title { color: #f1c40f; border-bottom-color: #f1c40f; }
.gen3-title { color: #3498db; border-bottom-color: #3498db; }
.gen4-title { color: #9b59b6; border-bottom-color: #9b59b6; }
.gen5-title { color: #2c3e50; border-bottom-color: #2c3e50; }
.gen6-title { color: #16a085; border-bottom-color: #16a085; }
.gen7-title { color: #e67e22; border-bottom-color: #e67e22; }
.gen8-title { color: #a93226; border-bottom-color: #a93226; }
.gen9-title { color: #6c3483; border-bottom-color: #6c3483; }
.empty { text-align: center; color: rgba(255,255,255,0.7); padding: 20px; }
</style>
