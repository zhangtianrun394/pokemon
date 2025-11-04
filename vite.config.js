import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 说明：
// - 使用 ES Module 输出以支持代码分割
// - 通过 loadEnv 注入 Supabase 常量，确保 App Service 环境也能拿到配置

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isApp = process.env.UNI_PLATFORM === 'app' || process.env.UNI_PLATFORM === 'app-plus'
  const supaUrl = env.VITE_SUPABASE_URL || ''
  const supaKey = env.VITE_SUPABASE_ANON_KEY || ''

  return {
    plugins: [uni()],
    define: {
      __SUPABASE_URL__: JSON.stringify(supaUrl),
      __SUPABASE_ANON_KEY__: JSON.stringify(supaKey)
    },
    build: {
      target: isApp ? 'es2019' : 'es2018',
      sourcemap: false,
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      }
    },
    base: './'
  }
})