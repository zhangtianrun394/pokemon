<template>
  <view style="padding:16px;color:#fff;background:#1D3557;min-height:100vh;">
    <view style="margin-bottom:12px;font-size:18px;font-weight:bold;">配置自检</view>
    <view style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px;margin-bottom:12px;">
      <view>Supabase URL: {{ displayUrl }}</view>
      <view>Anon Key 前 12 位: {{ anonKeyHead }}</view>
    </view>

    <button @click="probe" style="margin-bottom:12px;">运行 REST 探针（pokemons）</button>
    <view style="display:flex;gap:8px;margin-bottom:12px;">
      <button @click="probeTableBtn('pokemons')">测 pokemons</button>
      <button @click="probeTableBtn('forms')">测 forms</button>
      <button @click="probeTableBtn('images')">测 images</button>
    </view>

    <view v-if="probing" style="color:#ccc">探针运行中...</view>
    <view v-else-if="probeOk" style="color:#9EE493">探针成功：HTTP {{ probeStatus }}</view>
    <view v-else-if="probeErr" style="color:#FFD166">探针失败：{{ probeErr }}</view>

    <view style="margin-top:16px;font-size:12px;color:#ddd;">提示：如果 URL/Key 为空或探针失败，请检查 .env、static/app-config.json、网络与 RLS 策略。</view>
  </view>
</template>

<script>
import { probeTable, setSupabaseConfig } from '../../src/lib/pokeData.js'

export default {
  data() {
    return {
      displayUrl: '',
      anonKeyHead: '',
      probing: false,
      probeOk: false,
      probeErr: '',
      probeStatus: '',
      lastProbe: ''
    }
  },
  onLoad() {
    // 使用和生产一致的配置解析
    this.initDisplay()
  },
  methods: {
    async initDisplay() {
      try {
        // 触发内部加载配置（不抛错）
        const url = (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) ? __SUPABASE_URL__ : (import.meta?.env?.VITE_SUPABASE_URL || '')
        this.displayUrl = url || '（空）'
        const key = (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) ? __SUPABASE_ANON_KEY__ : (import.meta?.env?.VITE_SUPABASE_ANON_KEY || '')
        this.anonKeyHead = key ? key.slice(0, 12) : '（空）'
        // 再尝试从静态 JSON 兜底
        if (!url || !key) {
          try {
            const res = await new Promise((resolve) => {
              uni.request({ url: '/static/app-config.json', method: 'GET', success: resolve, fail: resolve })
            })
            const cfg = res && res.data ? res.data : null
            if ((!url) && cfg?.supabaseUrl) this.displayUrl = cfg.supabaseUrl
            if ((!key) && cfg?.supabaseAnonKey) this.anonKeyHead = cfg.supabaseAnonKey.slice(0, 12)
          } catch (e) {}
        }
      } catch (e) {
        this.displayUrl = '（读取失败）'
        this.anonKeyHead = '（读取失败）'
      }
    },
    async probe() { // 默认测 pokemons
      this.lastProbe = 'pokemons'
      // 将当前页面解析到的 URL/Key 推送给数据层，避免 ensureEnvLoaded 失败
      try {
        const resCfg = await new Promise((resolve) => {
          uni.request({ url: '/static/app-config.json', method: 'GET', success: resolve, fail: resolve })
        })
        const appCfg = resCfg && resCfg.data ? resCfg.data : {}
        const baseRaw = (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) ? __SUPABASE_URL__ : (import.meta?.env?.VITE_SUPABASE_URL || appCfg.supabaseUrl)
        const keyRaw = (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) ? __SUPABASE_ANON_KEY__ : (import.meta?.env?.VITE_SUPABASE_ANON_KEY || appCfg.supabaseAnonKey)
        if (baseRaw && keyRaw) setSupabaseConfig(String(baseRaw), String(keyRaw))
      } catch (e) {}

      this.probing = true
      this.probeOk = false
      this.probeErr = ''
      this.probeStatus = ''
      try {
        // 用真实 fetch 调用一次 /pokemons（仅取 1 条）
        // 运行时读取静态配置，避免动态 import 触发代码分割
        const resCfg = await new Promise((resolve) => {
          uni.request({ url: '/static/app-config.json', method: 'GET', success: resolve, fail: resolve })
        })
        const appCfg = resCfg && resCfg.data ? resCfg.data : {}
        const baseRaw = (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) ? __SUPABASE_URL__ : (import.meta?.env?.VITE_SUPABASE_URL || appCfg.supabaseUrl)
        const keyRaw = (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) ? __SUPABASE_ANON_KEY__ : (import.meta?.env?.VITE_SUPABASE_ANON_KEY || appCfg.supabaseAnonKey)
        const base = (baseRaw || '').replace(/\/$/, '')
        const url = `${base}/rest/v1/pokemons?select=*&limit=1`
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'GET',
            header: { apikey: keyRaw, Authorization: `Bearer ${keyRaw}` },
            success: resolve,
            fail: reject
          })
        })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.probeOk = true
          this.probeStatus = String(res.statusCode) + (this.lastProbe ? (' [' + this.lastProbe + ']') : '')
        } else {
          this.probeErr = `HTTP ${res.statusCode}: ${JSON.stringify(res.data)}${this.lastProbe ? (' [' + this.lastProbe + ']') : ''}`
        }
      } catch (e) {
        this.probeErr = String(e && e.message ? e.message : e)
      } finally {
        this.probing = false
      }
    },
    async probeTableBtn(name) {
      // 同步当前解析到的 URL/Key 给数据层，保证探针读取一致
      try {
        const resCfg = await new Promise((resolve) => {
          uni.request({ url: '/static/app-config.json', method: 'GET', success: resolve, fail: resolve })
        })
        const appCfg = resCfg && resCfg.data ? resCfg.data : {}
        const baseRaw = (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) ? __SUPABASE_URL__ : (import.meta?.env?.VITE_SUPABASE_URL || appCfg.supabaseUrl)
        const keyRaw = (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) ? __SUPABASE_ANON_KEY__ : (import.meta?.env?.VITE_SUPABASE_ANON_KEY || appCfg.supabaseAnonKey)
        if (baseRaw && keyRaw) setSupabaseConfig(String(baseRaw), String(keyRaw))
      } catch (e) {}

      try {
        this.probing = true
        this.lastProbe = name
        this.probeOk = false
        this.probeErr = ''
        this.probeStatus = ''
        const res = await probeTable(name)
        if (res.ok) {
          this.probeOk = true
          this.probeStatus = (res.status ? String(res.status) : '200') + ' [' + name + ']'
        } else {
          this.probeErr = (res.status ? ('HTTP ' + res.status + ': ') : '') + (res.error || 'unknown') + ' [' + name + ']'
        }
      } finally {
        this.probing = false
      }
    }
  }
}
</script>

<style scoped>
button {
  background: #FF6B6B;
  color: #fff;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
}
</style>
