<template>
	<view class="login-container">
		<!-- 状态栏 -->
		<view class="status-bar">
			<view class="icons">
				<view class="icon"></view>
				<view class="icon"></view>
			</view>
		</view>

		<!-- 顶部导航栏 -->
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-text">←</text>
			</view>
			<text class="title">登录注册</text>
			<view style="width: 24rpx;"></view>
		</view>

		<!-- 背景层 -->
		<view class="background-layer">
			<image 
				class="background-image" 
				src="/static/xiaozhi.png" 
				mode="aspectFill"
				lazy-load="false"
				:show-menu-by-longpress="false"
				@load="onImageLoad"
				@error="onImageError"
			/>
			<view class="overlay"></view>
			<!-- 加载指示器 -->
			<view v-if="!imageLoaded" class="loading-indicator">
				<text class="loading-text">加载中...</text>
			</view>
		</view>

		<!-- 内容层 -->
		<view class="content-layer">
			<!-- 页面标题 -->
			<view class="page-title">
				<text class="main-title">宝可梦训练家</text>
				<text class="sub-title">开启你的宝可梦冒险之旅</text>
			</view>

			<!-- 切换标签栏 -->
			<view class="tabs">
				<view 
					class="tab" 
					:class="{ active: isLogin }"
					@click="switchToLogin"
				>
					<text class="tab-text">登录</text>
				</view>
				<view 
					class="tab" 
					:class="{ active: !isLogin }"
					@click="switchToRegister"
				>
					<text class="tab-text">注册</text>
				</view>
			</view>

			<!-- 表单区域 -->
			<view class="form-container">
				<!-- 登录表单 -->
				<view v-if="isLogin" class="login-form">
					<view class="input-group">
						<view class="input-icon">👤</view>
						<input
							class="input-field"
							placeholder="请输入用户名或邮箱"
							v-model="loginForm.usernameOrEmail"
						/>
					</view>
					<view class="input-group">
						<view class="input-icon">🔒</view>
						<input
							class="input-field"
							:type="showPassword ? 'text' : 'password'"
							placeholder="请输入密码"
							v-model="loginForm.password"
						/>
						<view class="eye-icon" @click="togglePasswordVisibility">
							<text>{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text>
						</view>
					</view>
					<button class="submit-btn" @click="handleLogin">登录</button>
					<view class="footer-links">
						<text class="link" @click="forgotPassword">忘记密码？</text>
					</view>
				</view>

				<!-- 注册表单 -->
				<view v-else class="register-form">
					<view class="input-group">
						<view class="input-icon">👤</view>
						<input
							class="input-field"
							placeholder="请输入用户名"
							v-model="registerForm.username"
						/>
					</view>
					<view class="input-group">
						<view class="input-icon">📧</view>
						<input
							class="input-field"
							placeholder="请输入邮箱"
							v-model="registerForm.email"
						/>
					</view>
					<view class="input-group">
						<view class="input-icon">🔒</view>
						<input
							class="input-field"
							:type="showPassword ? 'text' : 'password'"
							placeholder="请输入密码"
							v-model="registerForm.password"
						/>
						<view class="eye-icon" @click="togglePasswordVisibility">
							<text>{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text>
						</view>
					</view>
					<view class="input-group">
						<view class="input-icon">🔒</view>
						<input
							class="input-field"
							:type="showConfirmPassword ? 'text' : 'password'"
							placeholder="请确认密码"
							v-model="registerForm.confirmPassword"
						/>
						<view class="eye-icon" @click="toggleConfirmPasswordVisibility">
							<text>{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</text>
						</view>
					</view>
					<button class="submit-btn" @click="handleRegister">注册</button>
					<view class="footer-links">
						<text class="link switch-link" @click="switchToLogin">切换到登录</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { createClient } from '@supabase/supabase-js'
	export default {
		data() {
			return {
				isLogin: true,
				showPassword: false,
				showConfirmPassword: false,
				imageLoaded: false,
				supabaseUrl: '',
				supabaseKey: '',
				loginForm: {
					usernameOrEmail: '',
					password: ''
				},
				registerForm: {
					username: '',
					email: '',
					password: '',
					confirmPassword: ''
				}
			}
		},
		onLoad() {
			this.bootstrapEnv()
			try {
				const u = uni.getStorageSync('user')
				if (u && u.name) { uni.reLaunch({ url: '/pages/index/index?page=profile' }) }
			} catch (e) {}
		},
		methods: {
			bootstrapEnv() {
				try {
					const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
					this.supabaseUrl = env && env.VITE_SUPABASE_URL ? String(env.VITE_SUPABASE_URL) : ''
					this.supabaseKey = env && env.VITE_SUPABASE_ANON_KEY ? String(env.VITE_SUPABASE_ANON_KEY) : ''
				} catch (e) {}
				if ((!this.supabaseUrl || !this.supabaseKey) && typeof uni !== 'undefined') {
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
			goBack() {
				// 使用uni-app的导航返回首页
				uni.switchTab({
					url: '/pages/index/index'
				});
			},
			switchToLogin() {
				this.isLogin = true
			},
			switchToRegister() {
				this.isLogin = false
			},
			togglePasswordVisibility() {
				this.showPassword = !this.showPassword
			},
			toggleConfirmPasswordVisibility() {
				this.showConfirmPassword = !this.showConfirmPassword
			},
			handleLogin: async function() {
				const { usernameOrEmail, password } = this.loginForm
				const name = (usernameOrEmail || '').trim()
				if (!name || !password) { uni.showToast({ title: '请输入用户名和密码', icon: 'none' }); return }
				try {
					await new Promise((resolve)=>{ this.bootstrapEnv(); setTimeout(resolve, 0) })
					const base = (this.supabaseUrl || '').replace(/\/$/, '')
					const key = this.supabaseKey
					if (!base || !key) { uni.showToast({ title: '后端配置缺失', icon: 'none' }); return }
					const url = `${base}/rest/v1/Users?select=\"UID\",name&name=eq.${encodeURIComponent(name)}&password=eq.${encodeURIComponent(password)}&limit=1`
					const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' }
					const res = await new Promise((resolve, reject) => {
						uni.request({ url, method: 'GET', header: headers, timeout: 12000, success: resolve, fail: reject })
					})
					if (res.statusCode >= 200 && res.statusCode < 300) {
						const rows = Array.isArray(res.data) ? res.data : []
						if (rows.length === 1) {
							try { uni.setStorageSync('user', { uid: rows[0].UID, name: rows[0].name }) } catch(_){}
							uni.showToast({ title: '登录成功', icon: 'none' })
							setTimeout(()=>{ uni.reLaunch({ url: '/pages/index/index?page=profile' }) }, 300)
						} else {
							uni.showToast({ title: '用户名或密码错误', icon: 'none' })
						}
					} else {
						uni.showToast({ title: '登录失败: HTTP ' + res.statusCode, icon: 'none' })
					}
				} catch (e) {
					uni.showToast({ title: '网络异常: ' + (e.errMsg || e.message || e), icon: 'none' })
				}
			},
			handleRegister: async function() {
				const { username, email, password, confirmPassword } = this.registerForm
				if (!username || !email || !password || !confirmPassword) { uni.showToast({ title: '请填写完整信息', icon: 'none' }); return }
				if (!email.includes('@')) { uni.showToast({ title: '请输入有效邮箱', icon: 'none' }); return }
				if (password !== confirmPassword) { uni.showToast({ title: '两次密码不一致', icon: 'none' }); return }
				try {
					await new Promise((resolve)=>{ this.bootstrapEnv(); setTimeout(resolve, 0) })
					const base = (this.supabaseUrl || '').replace(/\/$/, '')
					const key = this.supabaseKey
					if (!base || !key) { uni.showToast({ title: '后端配置缺失', icon: 'none' }); return }
					const supabase = createClient(base, key)
					const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: username } } })
					if (error) { uni.showToast({ title: '注册失败: ' + error.message, icon: 'none' }); return }
					if (data?.user) {
						uni.showToast({ title: '注册成功，请查收邮箱确认链接', icon: 'none' })
						setTimeout(()=>{ uni.switchTab({ url: '/pages/index/index' }) }, 800)
					} else {
						uni.showToast({ title: '注册成功', icon: 'none' })
						setTimeout(()=>{ uni.switchTab({ url: '/pages/index/index' }) }, 800)
					}
				} catch (e) {
					uni.showToast({ title: '网络异常: ' + (e.errMsg || e.message || e), icon: 'none' })
				}
			}
			forgotPassword() {
				uni.showToast({
					title: '忘记密码功能开发中...',
					icon: 'none'
				})
			},
			onImageLoad() {
				this.imageLoaded = true;
				console.log('背景图片加载完成');
			},
			onImageError(e) {
				console.error('背景图片加载失败:', e);
				uni.showToast({
					title: '背景图片加载失败',
					icon: 'none'
				});
			}
		}
	}
</script>

<style>
	.login-container {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	/* 状态栏 */
	.status-bar {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: 10rpx 30rpx;
		background-color: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10rpx);
		height: 40rpx;
		position: relative;
		z-index: 10;
	}

	.icons {
		display: flex;
		gap: 10rpx;
	}

	.icon {
		width: 40rpx;
		height: 20rpx;
		background-color: rgba(255, 255, 255, 0.7);
		border-radius: 4rpx;
	}

	/* 顶部导航栏 */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background: linear-gradient(to bottom, #1E3A8A, #FF3B30);
		color: #ffffff;
		position: relative;
		z-index: 10;
	}

	.back-btn {
		width: 80rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-text {
		font-size: 36rpx;
		font-weight: bold;
		color: #ffffff;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		flex: 1;
		text-align: center;
	}

	/* 背景层样式 */
	.background-layer {
		position: fixed;
		top: 160rpx; /* 从导航栏下方开始显示，避免被导航栏遮挡 */
		left: 0;
		width: 100%;
		height: calc(100% - 160rpx); /* 减去导航栏高度 */
		z-index: 1;
	}

	.background-image {
		width: 100%;
		height: 100%;
		object-fit: contain; /* 改为contain确保完整显示图片 */
		background-color: #FFCB05; /* 添加背景色填充空白区域 */
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #FFCB05;
		opacity: 0.2;
		z-index: 2;
	}

	/* 加载指示器样式 */
	.loading-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.7);
		border-radius: 20rpx;
		padding: 30rpx 50rpx;
		z-index: 4;
	}

	.loading-text {
		color: white;
		font-size: 28rpx;
		font-weight: 500;
	}

	/* 内容层样式 */
	.content-layer {
		position: relative;
		z-index: 3;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80rpx 40rpx 40rpx;
		background: transparent;
	}

	/* 页面标题样式 */
	.page-title {
		text-align: center;
		margin-bottom: 80rpx;
		margin-top: 60rpx;
	}

	.main-title {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		background: linear-gradient(to bottom, #1E3A8A, #FF3B30);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 0 2rpx 4rpx rgba(255, 255, 255, 0.8);
		margin-bottom: 16rpx;
	}

	.sub-title {
		display: block;
		font-size: 28rpx;
		color: #333333;
		text-shadow: 0 1rpx 2rpx rgba(255, 255, 255, 0.8);
	}

	/* 切换标签栏样式 */
	.tabs {
		display: flex;
		justify-content: space-around;
		margin-bottom: 60rpx;
		width: 100%;
		max-width: 600rpx;
		background: linear-gradient(to bottom, #FF3B30, #FF6B6B);
		border-radius: 24rpx;
		padding: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(5rpx);
		border: 1rpx solid rgba(255, 255, 255, 0.3);
	}

	.tab {
		padding: 20rpx 40rpx;
		font-size: 32rpx;
		color: #FFFFFF;
		cursor: pointer;
		border-bottom: 4rpx solid transparent;
		transition: all 0.3s;
		border-radius: 16rpx;
		font-weight: 600;
	}

	.tab.active {
		background: rgba(255, 255, 255, 0.2);
		font-weight: bold;
		border-bottom: 4rpx solid #FF3B30;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	}

	.tab-text {
		color: inherit;
	}

	.tab.active .tab-text {
		background: linear-gradient(to bottom, #FF3B30, #FF6B6B);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* 表单容器样式 */
	.form-container {
		width: 100%;
		max-width: 600rpx;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 24rpx;
		padding: 40rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(5rpx);
		border: 1rpx solid rgba(255, 255, 255, 0.5);
	}

	.input-group {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
		border: 2rpx solid rgba(0, 0, 0, 0.3);
		border-radius: 16rpx;
		padding: 20rpx;
		transition: all 0.3s;
		background: rgba(255, 255, 255, 0.6);
	}

	.input-group:focus-within {
		border-color: #FFCB05;
		box-shadow: 0 0 0 2rpx rgba(255, 203, 5, 0.4);
		background: rgba(255, 255, 255, 0.8);
	}

	.input-icon {
		margin-right: 20rpx;
		font-size: 32rpx;
		color: #333333;
	}

	.eye-icon {
		margin-left: auto;
		cursor: pointer;
		font-size: 32rpx;
		color: #666666;
		padding: 4rpx;
		border-radius: 8rpx;
		transition: background-color 0.3s;
	}

	.eye-icon:active {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.input-field {
		flex: 1;
		font-size: 28rpx;
		border: none;
		outline: none;
		background: transparent;
		color: #000000;
		font-weight: 500;
	}

	.input-field::placeholder {
		color: #666666;
	}

	.submit-btn {
		background: linear-gradient(to bottom, #FF3B30, #FF6B6B);
		color: white;
		border: none;
		border-radius: 16rpx;
		padding: 18rpx 40rpx;
		font-size: 28rpx;
		font-weight: bold;
		width: 80%;
		margin: 20rpx auto 0;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		display: block;
	}

	.submit-btn:active {
		transform: translateY(2rpx);
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.3);
		background: linear-gradient(to bottom, #FF6B6B, #FF3B30);
	}

	.footer-links {
		display: flex;
		justify-content: center;
		margin-top: 30rpx;
	}

	.link {
		color: #007AFF;
		font-size: 28rpx;
		cursor: pointer;
		text-decoration: underline;
		transition: color 0.3s;
		font-weight: 500;
	}

	.link:active {
		color: #0056CC;
	}

	.switch-link {
		color: #666666;
		font-weight: 500;
	}
</style>