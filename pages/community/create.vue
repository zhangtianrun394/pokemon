<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="back-text">←</text>
      </view>
      <text class="title">发布帖子</text>
      <view class="publish-btn" @click="publishPost">
        <text class="publish-text">发布</text>
      </view>
    </view>

    <!-- 帖子编辑区域 -->
    <scroll-view class="edit-section" scroll-y>
      <!-- 标题输入框 -->
      <view class="input-group">
        <text class="input-label">标题</text>
        <input class="title-input" v-model="postTitle" placeholder="请输入你的标题" maxlength="50" @input="updateCounts" />
        <text class="char-count">{{ postTitle.length }}/50</text>
      </view>

      <!-- 正文输入框 -->
      <view class="input-group">
        <text class="input-label">正文</text>
        <textarea class="content-textarea" v-model="postContent" placeholder="请输入你的正文" maxlength="10000" @input="updateCounts" />
        <text class="char-count">{{ postContent.length }}/10000</text>
      </view>

      <!-- 媒体上传区域 -->
      <view class="media-section">
        <text class="section-title">添加图片或视频</text>
        <view class="media-buttons">
          <view class="media-btn" @click="pickImage">
            <text class="media-icon">📷</text>
            <text class="media-text">添加图片</text>
          </view>
          <view class="media-btn" @click="pickVideo">
            <text class="media-icon">🎥</text>
            <text class="media-text">添加视频</text>
          </view>
        </view>

        <!-- 预览区域 -->
        <view v-if="selectedImage" class="preview-section">
          <text class="preview-title">图片预览</text>
          <image class="preview-image" :src="selectedImage" mode="aspectFit" />
          <view class="preview-actions">
            <text class="action-btn" @click="removeImage">删除图片</text>
          </view>
        </view>

        <view v-if="selectedVideo" class="preview-section">
          <text class="preview-title">视频预览</text>
          <video class="preview-video" :src="selectedVideo" controls></video>
          <view class="preview-actions">
            <text class="action-btn" @click="removeVideo">删除视频</text>
          </view>
        </view>
      </view>

      <!-- 标签输入框 -->
      <view class="input-group">
        <text class="input-label">标签</text>
        <input class="tag-input" v-model="postTags" placeholder="请输入标签（多个标签用逗号分隔）" maxlength="100" @input="updateCounts" />
        <text class="char-count">{{ postTags.length }}/100</text>
      </view>
    </scroll-view>

    <!-- 提示框 -->
    <view v-if="toastMsg" class="toast">{{ toastMsg }}</view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading">
      <view class="loading-content">
        <view class="spinner"></view>
        <text>发布中...</text>
      </view>
    </view>
  </view>
</template>

<script>
import { createClient } from '@supabase/supabase-js'
import { createBlogPost } from '../../src/lib/pokeData.js'
export default {
  data() {
    return {
      postTitle: '',
      postContent: '',
      postTags: '',
      selectedImage: '',
      selectedVideo: '',
      toastMsg: '',
      loading: false,
      supabaseUrl: '',
      supabaseKey: '',
      supabase: null,
    }
  },
  onLoad() {
    // 读取登录时缓存的 client，避免 H5/App service 不同上下文取不到 session
    try {
      const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
      this.supabaseUrl = env && env.VITE_SUPABASE_URL ? String(env.VITE_SUPABASE_URL) : ''
      this.supabaseKey = env && env.VITE_SUPABASE_ANON_KEY ? String(env.VITE_SUPABASE_ANON_KEY) : ''
      if (this.supabaseUrl && this.supabaseKey) {
        this.supabase = createClient(this.supabaseUrl.replace(/\/$/, ''), this.supabaseKey)
      }
    } catch (e) {}
  },
  methods: {
    goBack() {
      uni.showModal({
        title: '提示',
        content: '确定要放弃编辑吗？未保存的内容将会丢失。',
        success: (res) => { if (res.confirm) uni.navigateBack() }
      })
    },
    updateCounts() {},
    pickImage() {
      const that = this
      uni.chooseImage({
        count: 1,
        success(res) {
          const path = (res.tempFilePaths && res.tempFilePaths[0]) || ''
          that.selectedImage = path
          if (that.selectedVideo) that.removeVideo()
        }
      })
    },
    pickVideo() {
      const that = this
      uni.chooseVideo({
        success(res) {
          const path = res.tempFilePath || ''
          that.selectedVideo = path
          if (that.selectedImage) that.removeImage()
        }
      })
    },
    removeImage() {
      this.selectedImage = ''
    },
    removeVideo() {
      this.selectedVideo = ''
    },
    showToast(message, duration = 2000) {
      this.toastMsg = message
      setTimeout(() => { this.toastMsg = '' }, duration)
    },
    async publishPost() {
      const title = (this.postTitle || '').trim()
      const content = (this.postContent || '').trim()
      if (!title) { this.showToast('请输入标题'); return }
      if (!content) { this.showToast('请输入正文内容'); return }
      // 读取登录态
      let accessToken = ''
      let uid = ''
      try {
        const sess = uni.getStorageSync('auth_session')
        if (sess && sess.access_token && sess.user && sess.user.id) {
          accessToken = sess.access_token
          uid = sess.user.id
          console.log('[Auth] use session from storage', { uid, atLen: accessToken ? accessToken.length : 0 })
        } else if (this.supabase) {
          const { data: s } = await this.supabase.auth.getSession()
          if (s && s.session) {
            accessToken = s.session.access_token
            uid = s.session.user.id
            console.log('[Auth] use session from supabase.getSession()', { uid, atLen: accessToken ? accessToken.length : 0 })
            try { uni.setStorageSync('auth_session', { access_token: accessToken, refresh_token: s.session.refresh_token, expires_at: s.session.expires_at, user: { id: uid, email: s.session.user.email, user_metadata: s.session.user.user_metadata } }) } catch(_){}
          }
        }
      } catch (e) {}
      if (!accessToken || !uid) { this.showToast('请先登录'); return }
      this.loading = true
      try {
        const row = await createBlogPost({ uid, title, content, accessToken })
        // 回写本地 newPost，便于首页社区页即时显示
        const displayName = (uni.getStorageSync('user') || {}).name || '我'
        const timeStr = (() => { try { const d = new Date(row && row.created_at ? row.created_at : Date.now()); if (!d || isNaN(d)) return '刚刚'; const pad=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}` } catch(e){ return '刚刚' } })()
        const newPost = {
          id: row.blog_id || Date.now(),
          avatar: 'https://ai-public.mastergo.com/ai/img_res/a80f1e0b5ba3d38b3dccce7abc7d0323.jpg',
          username: displayName,
          time: timeStr,
          content,
          image: this.selectedImage,
          video: this.selectedVideo,
          likes: 0,
          liked: false,
          comments: 0,
          favorites: 0,
          favorited: false,
          commentList: []
        }
        try { uni.setStorageSync('newPost', newPost) } catch(e) {}
        this.showToast('发布成功', 1200)
        setTimeout(() => { uni.navigateBack() }, 800)
      } catch (err) {
        console.error('发布失败', err)
        this.showToast('发布失败：' + (err.message || err), 2000)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.container { display:flex; flex-direction:column; height:100vh; max-width:600px; margin:0 auto; background:#fff; }
.header { display:flex; justify-content:space-between; align-items:center; padding:10px 15px; background: linear-gradient(to bottom, #1E3A8A, #FF3B30); color:#fff; }
.back-btn { width:40px; height:30px; display:flex; align-items:center; justify-content:center; }
.back-text { font-size:18px; font-weight:bold; }
.title { font-size:18px; font-weight:bold; flex:1; text-align:center; }
.publish-btn { width:60px; height:30px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.2); border-radius: 15px; }
.publish-text { font-size:14px; font-weight:bold; }
.edit-section { flex:1; padding:15px; background:#fff; }
.input-group { margin-bottom:20px; position:relative; }
.input-label { font-size:14px; font-weight:bold; color:#333; display:block; margin-bottom:10px; }
.title-input, .tag-input { width:100%; height:40px; border:1px solid #ddd; border-radius:5px; padding:0 10px; font-size:14px; background:#f9f9f9; }
.content-textarea { width:100%; min-height:150px; border:1px solid #ddd; border-radius:5px; padding:10px; font-size:14px; background:#f9f9f9; line-height:1.5; }
.char-count { position:absolute; right:10px; bottom:10px; font-size:12px; color:#999; }
.media-section { margin-top:20px; }
.section-title { font-size:14px; font-weight:bold; color:#333; display:block; margin-bottom:10px; }
.media-buttons { display:flex; gap:10px; margin-bottom:15px; }
.media-btn { flex:1; height:60px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:2px dashed #ddd; border-radius:5px; background:#f9f9f9; }
.media-icon { font-size:20px; margin-bottom:5px; }
.media-text { font-size:12px; color:#666; }
.preview-section { margin-top:15px; padding:10px; border:1px solid #eee; border-radius:5px; background:#f9f9f9; }
.preview-title { font-size:13px; font-weight:bold; color:#333; display:block; margin-bottom:8px; }
.preview-image, .preview-video { width:100%; height:150px; border-radius:5px; object-fit:contain; background:#eee; }
.preview-actions { margin-top:8px; display:flex; justify-content:center; }
.action-btn { color:#FF3B30; font-size:13px; padding:5px 10px; border:1px solid #FF3B30; border-radius:10px; }
.toast { position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background: rgba(0,0,0,0.7); color:#fff; padding:10px 20px; border-radius:5px; z-index:1000; }
.loading { position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1001; }
.loading-content { background:#fff; padding:20px; border-radius:5px; display:flex; align-items:center; gap:10px; }
.spinner { width:20px; height:20px; border:2px solid #f3f3f3; border-top:2px solid #FF3B30; border-radius:50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
