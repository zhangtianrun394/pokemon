<template>
	<view class="container">
		<!-- 加载界面 -->
		<view class="loading" :class="{ hide: !isLoading }">
			<view class="loading-ball"></view>
		</view>
		
		<!-- 背景图案 -->
		<view class="background-pattern" id="pattern-container"></view>
		
		<!-- 状态栏 -->
		<view class="status-bar">
			<view class="icons">
				<view class="icon"></view>
				<view class="icon"></view>
			</view>
		</view>
		
		<!-- 头部（仅图鉴页显示） -->
		<view class="header" v-if="activePage !== 'community'">
			<text class="title">宝可梦图鉴</text>
			<view class="header-buttons">
				<view class="pokeball-icon" @click="toggleMenu"></view>
				<view class="debug-fab" @click="goConfig">调试</view>
			</view>
		</view>
		
		<!-- 搜索栏（仅图鉴与招式与特性页显示） -->
		<view class="search-bar" v-if="activePage === 'pokedex' || activePage === 'moves'">
			<view class="search-container">
				<input type="text" :placeholder="activePage === 'moves' ? '搜索招式与特性' : '搜索宝可梦'" v-model="searchTerm" @input="handleSearch" />
				<view class="clear-search" :class="{ visible: searchTerm.length > 0 }" @click="clearSearch"></view>
				<view class="voice-search" @click="startVoiceSearch"></view>
			</view>
		</view>
		
		<!-- 排序选项（仅图鉴页显示） -->
		<view class="sort-options" v-if="activePage !== 'community'">
			<text>属性</text>
			<button class="sort-button" @click="toggleSort">{{ sortAscending ? '↓↑排序' : '↑↓排序' }}</button>
		</view>
		
		<!-- 宝可梦网格 -->
		<view v-if="activePage === 'pokedex'" class="pokemon-grid">
			<view 
				v-for="(pokemon, index) in filteredPokemon" 
				:key="pokemon.forms_id"
				class="pokemon-card"
				:style="{ animationDelay: index * 50 + 'ms' }"
				@click="selectPokemon(pokemon)"
			>
				<view class="pokemon-image">
					<image v-if="pokemon.imageName" :src="getLocalImageSrc(pokemon.imageName)" mode="aspectFit" style="width:100%;height:100%;" lazy-load="true" />
					<text v-else>{{ getTypeEmoji(pokemon.types[0]) }}</text>
				</view>
				<text class="pokemon-number">No.{{ pokemon.id.toString().padStart(3, '0') }}</text>
				<text class="pokemon-name">{{ pokemon.name }}</text>
				<!-- 不再展示英文名 -->
				<view class="pokemon-types">
					<view 
						v-for="(typeZh, idx) in (pokemon.typesZh || [])" 
						:key="typeZh + '_' + idx"
						:class="['type', 'type-' + (pokemon.types[idx] || '')]"
					>{{ typeZh }}</view>
				</view>
			</view>
		</view>

		<!-- 社区页面（嵌入首页，保留底部导航） -->
		<view v-else-if="activePage === 'community'" class="community-page">

			<!-- 顶部导航栏 -->
			<view class="community-header">
				<view class="community-back-btn" @click="goBack">
					<text class="community-back-text">←</text>
				</view>
				<text class="community-title">宝可梦社区</text>
				<view style="width:12px;"></view>
			</view>

			<!-- 搜索框 -->
			<view class="community-search-box">
				<view class="community-search-icon"></view>
				<input class="community-search-input" type="text" placeholder="搜索话题..." v-model="communitySearch" />
			</view>

			<!-- 帖子列表 -->
			<scroll-view class="community-post-list" scroll-y>
				<view v-for="(post, index) in filteredCommunityPosts" :key="post.id" class="community-post-card">
					<!-- 用户信息 -->
					<view class="community-user-info">
						<image class="community-avatar" :src="post.avatar" :alt="post.username" mode="cover" />
						<view class="community-user-detail">
							<text class="community-username">{{ post.username }}</text>
							<text class="community-post-time">{{ post.time }}</text>
						</view>
					</view>
					<!-- 帖子内容 -->
					<view class="community-post-content">
						<text class="community-post-text">{{ post.content }}</text>
						<image v-if="post.image" class="community-post-image" :src="post.image" mode="cover" />
						<video v-if="post.video" class="community-post-video" :src="post.video" controls></video>
					</view>
					<!-- 互动按钮 -->
					<view class="community-action-buttons">
						<view class="community-action-btn" @click="toggleLike(index)">
							<text class="community-action-icon" :style="{ color: post.liked ? '#FF5252' : '#999' }">❤</text>
							<text class="community-action-count">{{ post.likes }}</text>
						</view>
						<view class="community-action-btn" @click="showComment(index)">
							<text class="community-action-icon">💬</text>
							<text class="community-action-count">{{ post.comments }}</text>
						</view>
						<view class="community-action-btn" @click="toggleFavorite(index)">
							<text class="community-action-icon" :style="{ color: post.favorited ? '#FFC107' : '#999' }">★</text>
							<text class="community-action-count">{{ post.favorites }}</text>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 可移动发帖按钮 -->
			<view class="community-floating-post-btn"
				:style="{ transform: `translate(${communityBtn.x}px, ${communityBtn.y}px)` }"
				@touchstart="startDrag"
				@touchmove.stop.prevent="onDrag"
				@touchend="endDrag"
				@click="createPost"
			>
				<image class="community-post-icon" src="/static/quick-ball.png" mode="aspectFill" />
			</view>

			<!-- 评论模态框 -->
			<view class="community-comment-modal" v-if="showCommentModal">
				<view class="community-comment-container">
					<view class="community-comment-header">
						<text class="community-comment-title">评论</text>
						<text class="community-close-comment" @click="closeCommentModal">×</text>
					</view>
					<scroll-view class="community-comment-list" scroll-y>
						<view v-for="(c, i) in currentComments" :key="i" class="community-comment-item">
							<view>
								<text class="community-comment-user">{{ c.username }}</text>
								<text class="community-comment-time">{{ c.time }}</text>
							</view>
							<view class="community-comment-content">{{ c.content }}</view>
						</view>
					</scroll-view>
					<view class="community-comment-input-area">
						<input class="community-comment-input" v-model="commentInput" placeholder="写下你的评论..." />
						<button class="community-send-comment" @click="sendComment">发送</button>
					</view>
				</view>
			</view>

			<!-- 发帖模态框 -->
			<view class="community-post-modal" v-if="showPostModal">
				<view class="community-post-container">
					<view class="community-post-header">
						<text class="community-post-title">发布新帖子</text>
						<text class="community-close-post" @click="closePostModal">×</text>
					</view>
					<view class="community-post-input-area">
						<textarea class="community-post-textarea" v-model="postTextarea" placeholder="分享你的宝可梦故事..."></textarea>
					</view>
					<view class="community-post-actions">
						<button class="community-cancel-post" @click="closePostModal">取消</button>
						<button class="community-submit-post" @click="submitPost">发布</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 我的 - 用户详情视图（嵌入首页，保留底部导航） -->
		<view v-else-if="activePage === 'profile'" class="profile-container">
			<view class="user-card">
				<view class="avatar">
					<image src="/static/xiaozhi.png" mode="aspectFit" />
				</view>
				<text class="username">{{ displayName }}</text>
				<view class="welcome-message">欢迎回来，宝可梦训练师！</view>
				<view class="logout-button" @click="logout">退出登录</view>
			</view>
			<view class="menu">
				<view class="menu-item" @click="openFavorites">
					<view class="menu-icon">⭐</view>
					<view class="menu-title">我的收藏</view>
					<view class="menu-desc">查看您特别喜欢的宝可梦</view>
				</view>
				<view class="menu-item" @click="openTeam">
					<view class="menu-icon">👥</view>
					<view class="menu-title">我的队伍</view>
					<view class="menu-desc">管理您的宝可梦战斗队伍</view>
				</view>
			</view>
		</view>
		
		<!-- 底部导航 -->
		<view class="bottom-nav">
			<view 
				v-for="nav in navItems" 
				:key="nav.page"
				:class="['nav-button', { active: activePage === nav.page }]"
				@click="switchPage(nav.page)"
			>
				<view class="pokeball"></view>
				<text>{{ nav.label }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { fetchAllForHomeJunction, setSupabaseConfig } from '../../src/lib/pokeData.js'
	export default {
		data() {
			return {
				isLoading: true,
				searchTerm: '',
				sortAscending: true,
				activePage: 'pokedex',
				pokemonData: [],
				navItems: [
					{ page: 'pokedex', label: '图鉴' },
					{ page: 'community', label: '社区' },
					{ page: 'moves', label: '招式与特性' },
					{ page: 'profile', label: '我的' }
				],
				displayName: '训练师',
				// 社区状态
				communitySearch: '',
				communityPosts: [
					{
						id: 1,
						avatar: 'https://ai-public.mastergo.com/ai/img_res/a80f1e0b5ba3d38b3dccce7abc7d0323.jpg',
						username: '小智',
						time: '2小时前',
						content: '今天终于收服了皮卡丘！太开心了！',
						image: 'https://ai-public.mastergo.com/ai/img_res/c4105702bb313ebec27e968031c6d893.jpg',
						video: '',
						likes: 42,
						liked: false,
						comments: 8,
						favorites: 5,
						favorited: false,
						commentList: [
							{ username: '小霞', content: '恭喜恭喜！皮卡丘很可爱呢！', time: '1小时前' },
							{ username: '小刚', content: '训练家之路开始了，加油！', time: '45分钟前' },
							{ username: '火箭队', content: '既然你诚心诚意地发问了，我们就大发慈悲地告诉你！', time: '30分钟前' }
						]
					},
					{
						id: 2,
						avatar: 'https://ai-public.mastergo.com/ai/img_res/b588a136138a2352b71cd8ed9de76b44.jpg',
						username: '小霞',
						time: '5小时前',
						content: '分享我的水系宝可梦队伍，大家觉得怎么样？',
						image: 'https://ai-public.mastergo.com/ai/img_res/ada19814eaea4d830cfd461c0cf34bfd.jpg',
						video: '',
						likes: 36,
						liked: true,
						comments: 12,
						favorites: 7,
						favorited: true,
						commentList: [
							{ username: '小智', content: '水系宝可梦很强大！', time: '4小时前' },
							{ username: '小刚', content: '队伍搭配很合理！', time: '3小时前' }
						]
					},
					{
						id: 3,
						avatar: 'https://ai-public.mastergo.com/ai/img_res/a7b871a3280c087cd6f9ea3857f8606a.jpg',
						username: '小刚',
						time: '昨天',
						content: '岩石系宝可梦培养心得分享视频',
						image: '',
						video: 'https://ai-public.mastergo.com/ai/img_res/b08e7758a877a52aa6bb4b0ce3cbe060.jpg',
						likes: 28,
						liked: false,
						comments: 5,
						favorites: 3,
						favorited: false,
						commentList: [
							{ username: '小智', content: '学到了很多，谢谢分享！', time: '昨天' },
							{ username: '小霞', content: '视频讲解很详细！', time: '昨天' }
						]
					}
				],
				currentPostIndex: 0,
				currentComments: [],
				showCommentModal: false,
				commentInput: '',
				showPostModal: false,
				postTextarea: '',
				dragging: false,
				dragStart: { x: 0, y: 0 },
				btnStart: { x: 0, y: 0 },
				communityBtn: { x: 12, y: 300 }
			}
		},
		computed: {
			filteredPokemon() {
				let filtered = this.pokemonData.filter(pokemon => {
					const name = pokemon.name.toLowerCase();
					const nameEn = pokemon.nameEn.toLowerCase();
					const search = this.searchTerm.toLowerCase();
					return name.includes(search) || nameEn.includes(search);
				});
				
				return filtered.sort((a, b) => {
					return this.sortAscending ? a.id - b.id : b.id - a.id;
				});
			},
			filteredCommunityPosts() {
				const q = (this.communitySearch || '').toLowerCase();
				if (!q) return this.communityPosts;
				return this.communityPosts.filter(p => (p.username || '').toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q));
			}
		},
		async onLoad(options) {
			try {
				// 若从登录成功返回，支持指定默认页签
				if (options && options.page) { this.activePage = String(options.page) }
				// 先强制初始化数据层环境（安卓端有时 ensureEnvLoaded 首次失败）
				const resCfg = await new Promise((resolve) => {
					uni.request({ url: '/static/app-config.json', method: 'GET', success: resolve, fail: resolve })
				})
				const appCfg = resCfg && resCfg.data ? resCfg.data : {}
				const baseRaw = (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) ? __SUPABASE_URL__ : (import.meta?.env?.VITE_SUPABASE_URL || appCfg.supabaseUrl)
				const keyRaw = (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) ? __SUPABASE_ANON_KEY__ : (import.meta?.env?.VITE_SUPABASE_ANON_KEY || appCfg.supabaseAnonKey)
				if (baseRaw && keyRaw) {
					setSupabaseConfig(String(baseRaw), String(keyRaw))
				}
				// 登录态初始化
				try {
					const u = uni.getStorageSync('user')
					if (u && u.name) { this.displayName = u.name }
					else if (this.activePage === 'profile') { uni.navigateTo({ url: '/pages/login/index' }) }
				} catch(e) {}
				await this.fetchPokemons();
			} catch (e) {
				// fetchPokemons 内部已有弹窗，这里兜底
				console.error('首屏加载失败', e)
				uni.showModal({
					title: '首屏加载失败',
					content: (e && e.message) ? String(e.message).slice(0, 120) : '未知错误',
					confirmText: '去自检',
					cancelText: '取消',
					success: (res) => { if (res.confirm) uni.navigateTo({ url: '/pages/debug/config' }) }
				})
			} finally {
				this.isLoading = false;
				this.generateBackgroundPattern();
			}
		},
		onShow() {
			try {
				const np = uni.getStorageSync('newPost')
				if (np) {
					this.communityPosts.unshift(np)
					uni.removeStorageSync('newPost')
				}
			} catch(e) {}
		},
		methods: {
			// 社区数据与交互
			goBack() { this.activePage = 'pokedex' },
			createPost() { uni.navigateTo({ url: '/pages/community/create' }) },
			closePostModal() { this.showPostModal = false },
			submitPost() {
				const content = (this.postTextarea || '').trim()
				if (!content) return
				const newPost = {
					id: this.communityPosts.length + 1,
					avatar: 'https://ai-public.mastergo.com/ai/img_res/a80f1e0b5ba3d38b3dccce7abc7d0323.jpg',
					username: this.displayName || '我',
					time: '刚刚',
					content,
					image: '',
					video: '',
					likes: 0, liked: false, comments: 0, favorites: 0, favorited: false,
					commentList: []
				}
				this.communityPosts.unshift(newPost)
				this.showPostModal = false
			},
			showComment(index) {
				this.currentPostIndex = index
				this.currentComments = [...(this.communityPosts[index]?.commentList || [])]
				this.commentInput = ''
				this.showCommentModal = true
			},
			closeCommentModal() { this.showCommentModal = false; this.commentInput = '' },
			sendComment() {
				const content = (this.commentInput || '').trim()
				if (!content) return
				const post = this.communityPosts[this.currentPostIndex]
				if (!post) return
				post.commentList.unshift({ username: this.displayName || '我', content, time: '刚刚' })
				post.comments++
				this.currentComments = [...post.commentList]
				this.commentInput = ''
			},
			toggleLike(index) {
				const p = this.communityPosts[index]; if (!p) return;
				p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
			},
			toggleFavorite(index) {
				const p = this.communityPosts[index]; if (!p) return;
				p.favorited = !p.favorited; p.favorites += p.favorited ? 1 : -1;
			},
			startDrag(e) {
				this.dragging = true
				const t = e.touches && e.touches[0] ? e.touches[0] : { clientX: 0, clientY: 0 }
				this.dragStart.x = t.clientX; this.dragStart.y = t.clientY;
				this.btnStart.x = this.communityBtn.x; this.btnStart.y = this.communityBtn.y;
			},
			onDrag(e) {
				if (!this.dragging) return
				const t = e.touches && e.touches[0] ? e.touches[0] : { clientX: 0, clientY: 0 }
				const dx = t.clientX - this.dragStart.x; const dy = t.clientY - this.dragStart.y;
				const w = uni.getSystemInfoSync().windowWidth; const h = uni.getSystemInfoSync().windowHeight;
				const size = 60;
				this.communityBtn.x = Math.max(0, Math.min(w - size, this.btnStart.x + dx))
				this.communityBtn.y = Math.max(0, Math.min(h - size - 90, this.btnStart.y + dy))
			},
			endDrag() { this.dragging = false },

			// 原有首页数据逻辑
			async fetchPokemons() {
				try {
					// 使用 forms + forms_types + types 聚合后的数据，仅展示中文名与中文属性
				const resp = await fetchAllForHomeJunction()
		console.log('诊断信息 - formsCount:', resp?.formsCount, 'maxFormId:', resp?.maxFormId)
		if (resp?.maxFormId) {
			uni.showToast({ 
				title: `加载${resp.formsCount}条，最大ID:${resp.maxFormId}`, 
				icon: 'none', 
				duration: 3000 
			})
		}
				const allArr = (resp && resp.data) ? resp.data.map(item => ({
					id: item.id,
					forms_id: item.forms_id, // 使用 forms_id
					name: item.nameZh,
					nameEn: '',
					types: item.typesEn,
					typesZh: item.typesZh,
					imageName: item.imageName
				})) : []
				this.pokemonData = []
				const chunkSize = 80
				let i = 0
				const appendChunk = () => {
					if (i === 0 && allArr.length) { this.isLoading = false }
					const slice = allArr.slice(i, i + chunkSize)
					if (slice.length) this.pokemonData = this.pokemonData.concat(slice)
					i += chunkSize
					if (i < allArr.length) { setTimeout(appendChunk, 0) }
				}
				appendChunk()
					if (this.pokemonData.length === 0) {
						uni.showToast({ title: '未加载到数据（0 条）', icon: 'none', duration: 2500 })
					}
				} catch (err) {
					console.error('加载宝可梦失败', err)
					const msg = (err && err.message) ? String(err.message).slice(0, 120) : ''
					uni.showModal({
						title: '数据加载失败',
						content: (msg ? ('错误信息：' + msg + '\n\n') : '') + '是否前往“配置自检”页面进行排查？',
						confirmText: '前往',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({ url: '/pages/debug/config' })
							}
						}
					})
					return
				} finally {
					this.isLoading = false
				}
			},
			normalizeType(t) {
				if (!t) return ''
				const s = String(t).trim().toLowerCase()
				// 支持中文/英文/缩写等映射
				const map = {
					'fire': 'fire', '火': 'fire',
					'water': 'water', '水': 'water',
					'grass': 'grass', '草': 'grass',
					'electric': 'electric', '电': 'electric', '雷': 'electric',
					'poison': 'poison', '毒': 'poison',
					'normal': 'normal', '一般': 'normal',
					'psychic': 'psychic', '超能力': 'psychic',
					'flying': 'flying', '飞行': 'flying',
					'ghost': 'ghost', '幽灵': 'ghost',
					'dragon': 'dragon', '龙': 'dragon'
				}
				return map[s] || s
			},
			getLocalImageSrc(name) {
				// 统一到 /static/assets/pokemons_image/official 目录
				if (!name) return ''
				const s = String(name)
				// 若后端已返回完整路径或网络地址，直接用
				if (s.startsWith('http://') || s.startsWith('https://')) return s
				if (s.startsWith('/static/')) return s
				// 默认拼接到新版目录
				return `/static/assets/pokemons_image/official/${s}`
			},
			getTypeEmoji(type) {
				switch ((type || '').toLowerCase()) {
					case 'fire': return '🔥'
					case 'water': return '💧'
					case 'grass': return '🌱'
					case 'electric': return '⚡'
					case 'ghost': return '👻'
					case 'dragon': return '🐲'
					case 'normal': return '🐾'
					default: return '✨'
				}
			},
			getTypeName(type) {
				const typeMap = {
					'fire': '火',
					'water': '水',
					'grass': '草',
					'electric': '电',
					'poison': '毒',
					'normal': '一般',
					'psychic': '超能力',
					'flying': '飞行',
					'ghost': '幽灵',
					'dragon': '龙'
				};
				return typeMap[type] || type;
			},
			toggleMenu() {
				uni.showToast({
					title: '菜单功能开发中',
					icon: 'none'
				});
			},
			goConfig() {
				uni.navigateTo({ url: '/pages/debug/config' })
			},

			startVoiceSearch() {
				uni.showToast({
					title: '语音搜索开发中',
					icon: 'none'
				});
			},
			handleSearch() {
				// 搜索功能由computed属性自动处理
			},
			clearSearch() {
				this.searchTerm = '';
			},
			toggleSort() {
				this.sortAscending = !this.sortAscending;
			},
			selectPokemon(pokemon) {
				uni.navigateTo({
					url: `/pages/detail/detail?forms_id=${pokemon.forms_id}`
				});
			},
			switchPage(page) {
				if (page === 'profile') {
					try {
						const u = uni.getStorageSync('user')
						if (u && u.name) {
							this.displayName = u.name
							this.activePage = 'profile'
							return
						}
					} catch (e) {}
					uni.navigateTo({ url: '/pages/login/index' })
					return
				} else if (page === 'moves') {
					// 跳转到招式与特性页面
					uni.navigateTo({ url: '/pages/moves/moves' })
					return
				}
				this.activePage = page;
			},
			logout() {
				try { uni.removeStorageSync('user') } catch(e) {}
				this.displayName = '训练师'
				this.activePage = 'pokedex'
				uni.showToast({ title: '已退出登录', icon: 'none' })
			},
			openFavorites() {
				uni.showToast({ title: '我的收藏开发中', icon: 'none' })
			},
			openTeam() {
				uni.showToast({ title: '我的队伍开发中', icon: 'none' })
			},
			generateBackgroundPattern() {
				// 仅在 H5 生效，原生端忽略
				try {
					if (typeof document === 'undefined') return
					const el = document.getElementById('pattern-container')
					if (!el) return
					el.innerHTML = ''
					el.style.backgroundImage = 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.3) 0, transparent 40%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.25) 0, transparent 35%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.2) 0, transparent 45%)'
					el.style.backgroundSize = 'cover'
				} catch (e) {}
			}
		}
	}
</script>

<style scoped>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
	}
	
	.container {
		--primary-red: #E63946;
		--primary-variant: #FF6B6B;
		--secondary-blue: #1D3557;
		--secondary-variant: #457B9D;
		--neutral-gray: #457B9D;
		--background-light: #F9F9F9;
		--card-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
		--transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
	}
	
	.container {
		background: linear-gradient(to bottom, var(--secondary-blue), var(--secondary-variant));
		color: #333;
		padding: 0;
		margin: 0 auto;
		min-height: 100vh;
		position: relative;
		padding-bottom: 90px;
		overflow-x: hidden;
	}
	
	.status-bar {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		padding: 10px 15px;
		background-color: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
	}
	
	.icons {
		display: flex;
		gap: 5px;
	}
	
	.icon {
		width: 20px;
		height: 10px;
		background-color: rgba(255, 255, 255, 0.7);
		border-radius: 2px;
	}
	
	.header {
		text-align: center;
		padding: 12px 16px 16px;
		position: relative;
		background: linear-gradient(to bottom, var(--secondary-blue), var(--primary-red));
		border-radius: 0 0 20px 20px;
		margin-bottom: 12px;
		animation: slideIn 0.6s ease-out;
	}
	
	@keyframes slideIn {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.title {
		font-size: 22px;
		color: white;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		letter-spacing: 1px;
		font-weight: 700;
	}
	
	.debug-fab {
		position: absolute;
		right: 56px;
		top: 8px;
		background: #FF6B6B;
		color: #fff;
		padding: 6px 10px;
		border-radius: 12px;
		font-size: 12px;
		box-shadow: 0 2px 6px rgba(0,0,0,0.2);
	}
	.pokeball-icon {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 2px solid white;
		background: linear-gradient(to bottom, var(--primary-red) 0%, var(--primary-red) 45%, white 45%, white 55%, white 55%, white 100%);
		cursor: pointer;
		overflow: hidden;
		transition: var(--transition);
		animation: rotate 8s linear infinite paused;
	}
	
	.pokeball-icon:active {
		animation-play-state: running;
		transform: translateY(-50%) scale(1.1);
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
	}
	
	@keyframes rotate {
		0% { transform: translateY(-50%) rotate(0deg); }
		100% { transform: translateY(-50%) rotate(360deg); }
	}
	
	.pokeball-icon::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid white;
		background-color: white;
		z-index: 1;
	}
	
	.pokeball-icon::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background-color: var(--primary-red);
		z-index: 2;
	}
	
	.search-bar {
		padding: 0 15px 15px;
		position: relative;
	}
	
	.search-container {
		position: relative;
		display: flex;
		align-items: center;
	}
	
	input[type="text"] {
		width: 100%;
		padding: 14px 50px 14px 16px;
		border: none;
		border-radius: 16px;
		background: linear-gradient(135deg, var(--primary-red), var(--primary-variant));
		box-shadow: var(--card-shadow);
		font-size: 16px;
		color: white;
		outline: 2px solid transparent;
		height: 48px;
		transition: var(--transition);
	}
	
	input[type="text"]:focus {
		outline: 2px solid var(--primary-red);
		box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.3);
	}
	
	input[type="text"]::placeholder {
		color: rgba(255, 255, 255, 0.85);
	}
	
	.voice-search {
		position: absolute;
		right: 8px;
		width: 36px;
		height: 36px;
		background-color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: 2px solid var(--secondary-blue);
		transition: var(--transition);
	}
	
	.voice-search:active {
		transform: scale(1.1);
		background-color: var(--primary-variant);
	}
	
	.voice-search::before {
		content: "🎤";
		font-size: 16px;
	}
	
	.clear-search {
		position: absolute;
		right: 50px;
		width: 28px;
		height: 28px;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0;
		transform: scale(0);
		transition: var(--transition);
	}
	
	.clear-search.visible {
		opacity: 1;
		transform: scale(1);
	}
	
	.clear-search::before {
		content: "✕";
		font-size: 14px;
		color: white;
	}
	
	.sort-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 15px 15px;
		color: white;
	}
	
	.sort-button {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		padding: 8px 15px 8px 40px;
		border-radius: 16px;
		font-size: 14px;
		color: white;
		cursor: pointer;
		backdrop-filter: blur(5px);
		position: relative;
		transition: var(--transition);
	}
	
	.sort-button::before {
		content: '';
		position: absolute;
		left: 15px;
		top: 50%;
		transform: translateY(-50%);
		width: 20px;
		height: 20px;
		background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z'/%3E%3C/svg%3E") no-repeat center;
		background-size: contain;
	}
	
	.sort-button:active {
		background: rgba(255, 255, 255, 0.3);
	}
	
	/* 宝可梦网格 */
	/* 关键修改：两列布局 */
	.pokemon-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		padding: 0 15px 15px;
	}
	
	/* 优化卡片高度和内部间距 */
	.pokemon-card {
		background-color: #F9F9F9;
		border-radius: 16px;
		padding: 14px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
		text-align: center;
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		position: relative;
		overflow: hidden;
		height: 220px; /* 增加卡片高度，容纳更大正方形图片 */
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.pokemon-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 6px;
		background: #E63946;
		border-radius: 16px 16px 0 0;
	}
	
	.pokemon-card:active {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
	}
	
	/* 正方形图片容器 */
	
	.pokemon-number {
		font-size: 11px;
		color: #457B9D;
		margin-bottom: 4px; /* 减少间距 */
		font-weight: bold;
		letter-spacing: 0.5px;
	}
	
	.pokemon-name {
		font-size: 15px;
		font-weight: bold;
		margin-bottom: 4px; /* 更靠近属性 */
		color: #1D3557;
	}
	
	.pokemon-types {
		display: flex;
		justify-content: center;
		gap: 4px; /* 减少属性标签间距 */

		margin-top: auto; /* 将属性推到卡片底部 */
	}
	
	.type {
		padding: 3px 8px;
		border-radius: 10px;
		font-size: 10px;
		color: white;
		font-weight: bold;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		min-width: 35px;
	}
	
	@keyframes floatIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.pokemon-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 8px;
		background: var(--primary-red);
		border-radius: 8px 8px 0 0;
	}
	
	.pokemon-card:active {
		transform: translateY(-5px);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
	}
	
	.pokemon-image {
		width: 92px;
		height: 92px;
		border-radius: 10px;
		/* 背景使用更亮的渐变，避免偏灰 */
		background: linear-gradient(135deg, rgba(255,255,255,0.97), rgba(255,255,255,0.8));
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		margin: 8px auto 8px; /* 稍微靠近名称 */
		font-size: 36px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
		position: relative;
	}
	
	.pokemon-image::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.1) 100%);
		border-radius: 8px;
	}
	
	.pokemon-number {
		font-size: 12px;
		color: var(--neutral-gray);
		margin-bottom: 6px;
		font-weight: bold;
		letter-spacing: 0.5px;
	}
	
	.pokemon-name {
		font-size: 16px;
		font-weight: bold;
		margin-bottom: 4px;
		color: var(--secondary-blue);
	}
	
	.pokemon-name-en {
		font-size: 12px;
		color: var(--neutral-gray);
		margin-bottom: 10px;
		font-style: italic;
	}
	
	.pokemon-types {
		display: flex;
		justify-content: center;
		gap: 6px;
	}
	
	.type {
		padding: 5px 10px;
		border-radius: 12px;
		font-size: 11px;
		color: white;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		min-width: 50px;
	}
	
	.type-fire {
		background: #F08030;
	}
	
	.type-water {
		background: #6890F0;
	}
	
	.type-grass {
		background: #78C850;
	}
	
	.type-electric {
		background: #F8D030;
		color: #333;
	}
	
	.type-poison {
		background: #A040A0;
	}
	
	.type-normal {
		background: #A8A878;
	}
	
	.type-psychic {
		background: #F85888;
	}
	
	.type-flying {
		background: #A890F0;
	}
	
	.type-ghost {
		background: #705898;
	}

	/* 新属性颜色 */
	.type-ground {
		background: #DDBB55;
	}

	.type-fairy {
		background: #FF99CC;
	}

	.type-rock {
		background: #BBAA66;
	}

	/* 虫属性 (Bug) */
	.type-bug {
		background: #A8B820; /* 昆虫黄绿色 */
		color: white;
	}

	/* 冰属性 (Ice) */
	.type-ice {
		background: #98D8D8; /* 冰蓝色，象征冰雪 */
		color: white;
	}

	/* 龙属性 (Dragon) */
	.type-dragon {
		background: #7038F8; /* 龙紫色，象征神秘力量 */
		color: white;
	}

	/* 恶属性 (Dark) */
	.type-dark {
		background: #705848;
		color: white;
	}

	/* 钢属性 (Steel) */
	.type-steel {
		background: #B8B8D0;
		color: white;
	}

	/* 格斗属性 (Fighting) */
	.type-fighting {
		background: #C03028;
		color: white;
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		background-color: white;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		padding: 12px 0;
		justify-content: space-around;
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}
	
	.nav-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		width: 70px;
		position: relative;
		transition: var(--transition);
	}
	
	.nav-button.active {
		transform: translateY(-8px);
	}
	
	.pokeball {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid var(--secondary-blue);
		position: relative;
		background: linear-gradient(to bottom, var(--primary-red) 0%, var(--primary-red) 45%, var(--secondary-blue) 45%, var(--secondary-blue) 55%, white 55%, white 100%);
		margin-bottom: 4px;
		transition: var(--transition);
	}
	
	.nav-button.active .pokeball {
		transform: scale(1.15);
		box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.3);
	}
	
	.pokeball::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid var(--secondary-blue);
		background-color: white;
		z-index: 1;
	}
	
	.pokeball::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background-color: var(--secondary-blue);
		z-index: 2;
	}
	
	.nav-button text {
		font-size: 12px;
		color: var(--neutral-gray);
		transition: var(--transition);
	}
	
	.nav-button.active span {
		color: var(--primary-red);
		font-weight: bold;
		font-size: 13px;
	}
	
	.background-pattern {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: -1;
		opacity: 0.05;
	}
	
	.loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(29, 53, 87, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		opacity: 1;
		transition: opacity 0.5s ease;
	}
	
	.loading.hide {
		opacity: 0;
		pointer-events: none;
	}
	
	.loading-ball {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 4px solid rgba(255, 255, 255, 0.2);
		border-top: 4px solid var(--primary-red);
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

/* 社区样式 */
.community-page { display:flex; flex-direction:column; min-height: calc(100vh - 90px); background:#f5f5f5; }
.community-status-bar { display:flex; justify-content:flex-end; align-items:center; padding:5px 15px; background-color: rgba(255,255,255,0.1); height:20px; }
.community-icons { display:flex; gap:5px; }
.community-icon { width:20px; height:10px; background: rgba(255,255,255,0.7); border-radius:2px; }
.community-header { display:flex; justify-content:space-between; align-items:center; padding:10px 15px; background: linear-gradient(to bottom, #1E3A8A, #FF3B30); color:#fff; }
.community-back-btn { width:40px; height:30px; display:flex; align-items:center; justify-content:center; }
.community-back-text { font-size:18px; font-weight:bold; color:#fff; }
.community-title { font-size:18px; font-weight:bold; flex:1; text-align:center; }
.community-search-box { display:flex; align-items:center; padding:10px 15px; background:#fff; margin:10px; border-radius:20px; }
.community-search-icon { width:16px; height:16px; background:#999; border-radius:2px; }
.community-search-input { flex:1; margin-left:10px; font-size:14px; color:#333; border:none; outline:none; }
.community-post-list { flex:1; padding:10px; }
.community-post-card { background:#fff; border-radius:10px; padding:15px; margin-bottom:15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.community-user-info { display:flex; align-items:center; margin-bottom:10px; }
.community-avatar { width:40px; height:40px; border-radius:50%; }
.community-user-detail { margin-left:10px; }
.community-username { font-size:14px; font-weight:bold; color:#333; }
.community-post-time { font-size:12px; color:#999; }
.community-post-content { margin-bottom:10px; }
.community-post-text { font-size:14px; color:#333; margin-bottom:10px; line-height:1.5; display:block; }
.community-post-image { width:100%; height:200px; border-radius:5px; margin-top:10px; }
.community-post-video { width:100%; height:200px; border-radius:5px; margin-top:10px; background:#000; }
.community-action-buttons { display:flex; justify-content:space-around; border-top:1px solid #eee; padding-top:10px; }
.community-action-btn { display:flex; align-items:center; padding:5px 10px; border-radius:5px; }
.community-action-btn:active { background:#f0f0f0; }
.community-action-count { font-size:12px; color:#666; margin-left:5px; }
.community-floating-post-btn { position:fixed; left:0; top:0; width:60px; height:60px; background: linear-gradient(135deg, #FF3B30, #1E3A8A); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 15px rgba(0,0,0,0.4); z-index:999; overflow:hidden; }
.community-post-icon { width:100%; height:100%; border-radius:50%; object-fit: cover; }
.community-comment-modal { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000; }
.community-comment-container { background:#fff; width:90%; max-width:500px; border-radius:10px; padding:20px; max-height:80%; }
.community-comment-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee; }
.community-comment-title { font-size:18px; font-weight:bold; }
.community-close-comment { font-size:24px; color:#999; }
.community-comment-list { max-height:300px; }
.community-comment-item { padding:10px 0; border-bottom:1px solid #f5f5f5; }
.community-comment-user { font-weight:bold; margin-right:5px; }
.community-comment-content { margin:5px 0; }
.community-comment-time { font-size:12px; color:#999; }
.community-comment-input-area { display:flex; margin-top:10px; }
.community-comment-input { flex:1; padding:10px; border:1px solid #ddd; border-radius:5px; margin-right:10px; }
.community-send-comment { background:#1E3A8A; color:#fff; border:none; padding:0 15px; border-radius:5px; }
.community-post-modal { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000; }
.community-post-container { background:#fff; width:90%; max-width:500px; border-radius:10px; padding:20px; }
.community-post-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee; }
.community-post-title { font-size:18px; font-weight:bold; }
.community-close-post { font-size:24px; color:#999; }
.community-post-input-area { margin-bottom:15px; }
.community-post-textarea { width:100%; min-height:100px; padding:10px; border:1px solid #ddd; border-radius:5px; }
.community-post-actions { display:flex; justify-content:flex-end; gap:10px; }
.community-cancel-post { padding:8px 15px; background:#f0f0f0; border:none; border-radius:5px; }
.community-submit-post { padding:8px 15px; background:#1E3A8A; color:#fff; border:none; border-radius:5px; }

.profile-container { padding: 15px; }
.user-card { background: white; border-radius: 20px; padding: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin-bottom: 25px; text-align: center; border: 5px solid #2a5caa; position: relative; overflow: hidden; }
.user-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: #2a5caa; }
.avatar { width: 100px; height: 100px; border-radius: 50%; background: #ffcc00; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; border: 4px solid #2a5caa; overflow: hidden; }
.avatar image { width: 80%; height: 80%; }
.username { font-size: 18px; color: #2a5caa; margin-bottom: 10px; display: block; text-align: center; font-weight: 700; }
.welcome-message { background: linear-gradient(135deg, #2a5caa, #4a7cd4); color: white; padding: 12px 20px; border-radius: 30px; display: inline-block; margin-bottom: 20px; font-size: 14px; font-weight: bold; box-shadow: 0 4px 10px rgba(42,92,170,0.3); position: relative; }
.menu { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px; }
.menu-item { background: white; border-radius: 15px; padding: 20px 15px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border: 2px solid #e0e0e0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 120px; }
.menu-icon { font-size: 24px; margin-bottom: 10px; color: #2a5caa; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,204,0,0.2); }
.menu-title { font-weight: bold; margin-bottom: 6px; color: #333; font-size: 14px; }
.menu-desc { font-size: 12px; color: #666; line-height: 1.4; }
.logout-button { margin-top: 12px; display: inline-block; padding: 8px 14px; border-radius: 16px; color: #fff; background: #e74c3c; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
</style>
