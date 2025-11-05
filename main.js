import App from './App'
import { setSupabaseConfig } from './src/lib/pokeData.js'

// 统一在应用启动时注入 Supabase 配置（支持 App 与 H5）
(function bootstrapSupabase() {
  try {
    // 优先使用构建期注入或 import.meta.env（H5）
    const url = (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) ? __SUPABASE_URL__ : (import.meta?.env?.VITE_SUPABASE_URL || '')
    const key = (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) ? __SUPABASE_ANON_KEY__ : (import.meta?.env?.VITE_SUPABASE_ANON_KEY || '')
    if (url && key) {
      setSupabaseConfig(String(url), String(key))
      return
    }
  } catch (e) {}
  // 运行时兜底：从 static/app-config.json 读取（App 端可用）
  try {
    uni.request({
      url: '/static/app-config.json',
      method: 'GET',
      success: (res) => {
        const cfg = res && res.data ? res.data : null
        if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) {
          const cleaned = String(cfg.supabaseAnonKey).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
          setSupabaseConfig(String(cfg.supabaseUrl), cleaned)
        }
      },
      fail: () => {
        // 再尝试无斜杠路径
        uni.request({
          url: 'static/app-config.json',
          method: 'GET',
          success: (res2) => {
            const cfg2 = res2 && res2.data ? res2.data : null
            if (cfg2 && cfg2.supabaseUrl && cfg2.supabaseAnonKey) {
              const cleaned2 = String(cfg2.supabaseAnonKey).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
              setSupabaseConfig(String(cfg2.supabaseUrl), cleaned2)
            }
          }
        })
      }
    })
  } catch (e) {}
})()

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import AIChatAssistant from './components/ai-chat-assistant.vue'

export function createApp() {
  const app = createSSRApp(App)
  
  // 全局注册AI聊天助手组件
  app.component('ai-chat-assistant', AIChatAssistant)
  
  return {
    app
  }
}
// #endif