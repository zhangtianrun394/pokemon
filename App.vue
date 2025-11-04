<script>
import { probeTable, debugSupabaseEnv } from './src/lib/pokeData.js'
export default {
  async onLaunch() {
    console.log('App Launch')
    try { debugSupabaseEnv('app-launch') } catch (e) {}
    try {
      const res1 = await probeTable('forms')
      console.log('[Probe] forms =>', res1)
    } catch (e) {
      console.warn('[Probe] forms error =>', e && e.message ? e.message : e)
    }
    try {
      const res2 = await probeTable('pokemons')
      console.log('[Probe] pokemons =>', res2)
    } catch (e) {
      console.warn('[Probe] pokemons error =>', e && e.message ? e.message : e)
    }
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 全局CSS变量与基础样式（H5生效） */
:root {
  --primary-red: #E63946;
  --primary-variant: #FF6B6B;
  --secondary-blue: #1D3557;
  --secondary-variant: #457B9D;
  --neutral-gray: #457B9D;
  --background-light: #F9F9F9;
  --card-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}
</style>
