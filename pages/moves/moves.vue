<template>
	<view class="container">
		<!-- 去除uniapp原生状态栏 -->
		<view class="uni-status-bar"></view>
		
		<!-- 头部（使用首页的布局格式） -->
		<view class="header">
			<text class="title">招式与特性</text>
			<view class="header-buttons">
				<view class="pokeball-icon" @click="toggleMenu"></view>
				<view class="debug-fab" @click="goConfig">调试</view>
			</view>
		</view>
		
		<!-- 搜索栏区域（包含切换按钮、搜索框、排序按钮） -->
		<view class="search-section">
			<!-- 切换按钮（放在搜索框左边） -->
			<view class="switch-btn" @click="toggleListType">
				<text class="switch-icon" :class="{ active: isAbilityList }">{{ isAbilityList ? '💫' : '⚡' }}</text>
				<text class="switch-text">{{ isAbilityList ? '特性' : '招式' }}</text>
			</view>
			
			<!-- 搜索框（中间） -->
			<view class="search-bar">
				<view class="search-container">
					<input type="text" :placeholder="isAbilityList ? '搜索特性名称 / 效果' : '搜索招式名称 / 属性 / 分类'" v-model="searchKeyword" @input="handleSearch" />
					<view class="clear-search" :class="{ visible: searchKeyword.length > 0 }" @click="clearSearch"></view>
					<view class="search-btn" @click="handleSearch">
						<text class="search-icon">🔍</text>
					</view>
				</view>
			</view>
			
			<!-- 排序按钮（放在搜索框右边） -->
			<view class="sort-btn" @click="toggleSort">
				<text class="sort-icon">{{ sortAscending ? '↓↑' : '↑↓' }}</text>
				<text class="sort-text">排序</text>
			</view>
		</view>

		<!-- 列表内容 -->
	<scroll-view class="list-container" scroll-y @scrolltolower="onScrollToLower" :scroll-top="scrollTop" lower-threshold="50" upper-threshold="0" @scroll="onScroll" scroll-with-animation="false">
		<!-- 招式列表 -->
		<view v-if="!isAbilityList" v-for="(item, index) in filteredMoveList" :key="'move-' + index" class="move-card">
			<text class="move-index">{{ item.id }}</text>
			<view class="move-info">
				<view class="move-header" @click="toggleExpand(index, 'move')">
					<text class="move-name">{{ item.name }}</text>
					<view class="move-tags">
						<view :class="['type-tag', item.type]">{{ item.type }}</view>
						<view class="category-tag">
							<!-- 物理（物攻）使用爆炸图标 -->
							<view v-if="item.category === '物理'" class="physical-icon">💥</view>
							<!-- 特殊（特攻）使用三个圈圈图标 -->
							<view v-if="item.category === '特殊'" class="special-icon">🌀</view>
							<!-- 变化使用太极图标 -->
							<view v-if="item.category === '变化'" class="change-icon">☯️</view>
						</view>
						<!-- 展开箭头 -->
						<view class="expand-arrow" :class="{ expanded: item.expanded }">
							<text>▼</text>
						</view>
					</view>
				</view>
				<text class="move-stats">威力：{{ item.power }} 命中：{{ item.accuracy }} PP:{{ item.pp }} 优先：{{ item.priority }}</text>
				
				<!-- 展开栏 -->
				<view v-if="item.expanded" class="expand-panel">
					<view class="expand-content">
						<text class="expand-title">招式说明</text>
						<text class="expand-description">{{ item.flavor_text || '暂无详细描述' }}</text>
						<view class="expand-details">
							<view class="detail-item">
								<text class="detail-label">属性：</text>
								<text class="detail-value">{{ item.type }}</text>
							</view>
							<view class="detail-item">
								<text class="detail-label">分类：</text>
								<text class="detail-value">{{ item.category }}</text>
							</view>
							<view class="detail-item">
								<text class="detail-label">威力：</text>
								<text class="detail-value">{{ item.power === '-' ? '无' : item.power }}</text>
							</view>
							<view class="detail-item">
								<text class="detail-label">命中率：</text>
								<text class="detail-value">{{ item.accuracy === '-' ? '必中' : item.accuracy }}</text>
							</view>
							<view class="detail-item">
								<text class="detail-label">PP值：</text>
								<text class="detail-value">{{ item.pp }}</text>
							</view>
							<view class="detail-item">
								<text class="detail-label">优先度：</text>
								<text class="detail-value">{{ item.priority }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 加载更多提示 -->
		<view v-if="pagination.isLoadingMore" class="load-more">
			<text>正在加载更多招式...</text>
		</view>
		<view v-else-if="!pagination.hasMore && !isAbilityList" class="load-more-end">
			<text>已加载全部招式</text>
		</view>
		<!-- 手动加载更多按钮 -->
		<view v-if="pagination.hasMore && !isAbilityList && !pagination.isLoadingMore" class="load-more-btn" @click="loadMoreMoves">
			<text class="load-btn-text">加载下50条招式数据</text>
			<text class="load-btn-icon">▼</text>
		</view>
			
				<!-- 特性列表 -->
				<view v-if="isAbilityList" v-for="(item, index) in filteredAbilityList" :key="'ability-' + index" class="ability-card">
					<text class="ability-index">{{ item.id }}</text>
					<view class="ability-info">
						<view class="ability-header" @click="toggleExpand(index, 'ability')">
							<text class="ability-name">{{ item.name }}</text>
							<view class="ability-tags">
								<!-- 展开箭头 -->
								<view class="expand-arrow" :class="{ expanded: item.expanded }">
									<text>▼</text>
								</view>
							</view>
						</view>
						<text class="ability-effect">{{ item.description }}</text>
						
						<!-- 展开栏 -->
						<view v-if="item.expanded" class="expand-panel">
							<view class="expand-content">
								<text class="expand-title">特性说明</text>
								<text class="expand-description">{{ item.description }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 特性列表加载更多提示 -->
				<view v-if="paginationAbility.isLoadingMore" class="load-more">
					<text>正在加载更多特性...</text>
				</view>
				<view v-else-if="!paginationAbility.hasMore && isAbilityList" class="load-more-end">
					<text>已加载全部特性</text>
				</view>
				<!-- 特性列表手动加载更多按钮 -->
				<view v-if="paginationAbility.hasMore && isAbilityList && !paginationAbility.isLoadingMore" class="load-more-btn" @click="loadMoreAbilities">
					<text class="load-btn-text">加载下50条特性数据</text>
					<text class="load-btn-icon">▼</text>
				</view>
		</scroll-view>
		
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
	import { fetchMovesByPage, fetchAbilitiesByPage } from '../../src/lib/pokeData.js'
	
	export default {
		data() {
			return {
				searchKeyword: '',
				isAbilityList: false, // 是否显示特性列表
				sortAscending: true, // 排序方向：true为升序，false为降序
				activePage: 'moves', // 当前激活的页面
				scrollTop: 0,
				navItems: [
					{ page: 'pokedex', label: '图鉴' },
					{ page: 'community', label: '社区' },
					{ page: 'moves', label: '招式与特性' },
					{ page: 'profile', label: '我的' }
				],
				abilityList: [
					{
						id: 1,
						name: '茂盛',
						type: '草系',
						shortEffect: 'HP减少时草属性招式威力提升',
						fullEffect: '当宝可梦的HP减少到1/3以下时，草属性招式的威力会提升50%。这个特性在关键时刻能够逆转战局，特别适合草属性宝可梦使用。',
						expanded: false
					},
					{
						id: 2,
						name: '猛火',
						type: '火系',
						shortEffect: 'HP减少时火属性招式威力提升',
						fullEffect: '当宝可梦的HP减少到1/3以下时，火属性招式的威力会提升50%。这个特性让火属性宝可梦在危急时刻能够爆发出更强的力量。',
						expanded: false
					},
					{
						id: 3,
						name: '激流',
						type: '水系',
						shortEffect: 'HP减少时水属性招式威力提升',
						fullEffect: '当宝可梦的HP减少到1/3以下时，水属性招式的威力会提升50%。这个特性让水系宝可梦在逆境中能够发挥更强的战斗力。',
						expanded: false
					},
					{
						id: 4,
						name: '静电',
						type: '电系',
						shortEffect: '接触类招式可能让对手麻痹',
						fullEffect: '当对手使用接触类招式攻击时，有30%的几率让对手陷入麻痹状态。麻痹状态会降低对手的速度，并有可能让对手无法行动。',
						expanded: false
					},
					{
						id: 5,
						name: '坚硬',
						type: '防御',
						shortEffect: '不会被一击必杀招式击败',
						fullEffect: '拥有坚硬特性的宝可梦不会被一击必杀招式（如绝对零度、地裂等）击败。这个特性提供了重要的生存保障。',
						expanded: false
					},
					{
						id: 6,
						name: '压迫感',
						type: '特殊',
						shortEffect: '对手使用招式时消耗更多PP',
						fullEffect: '对手使用招式时，PP消耗量会加倍。这个特性能够有效限制对手的招式使用次数，在持久战中具有优势。',
						pokemon: '急冻鸟、闪电鸟、火焰鸟等',
						trigger: '对手使用招式时',
						battleEffect: '对手招式PP消耗加倍',
						expanded: false
					},
					{
						id: 7,
						name: '技术高手',
						type: '攻击',
						shortEffect: '低威力招式威力提升',
						fullEffect: '使用威力60或以下的招式时，威力会提升50%。这个特性让低威力招式变得更有价值，适合搭配快速连击的招式。',
						pokemon: '飞天螳螂、巨钳螳螂等',
						trigger: '使用威力≤60的招式时',
						battleEffect: '低威力招式威力提升50%',
						expanded: false
					},
					{
						id: 8,
						name: '沙隐',
						type: '天气',
						shortEffect: '沙暴天气下闪避率提升',
						fullEffect: '在沙暴天气下，闪避率会提升20%。同时不会受到沙暴天气的伤害。这个特性在沙暴队中非常有用。',
						pokemon: '穿山鼠、穿山王等',
						trigger: '沙暴天气下',
						battleEffect: '闪避率提升20%，免疫沙暴伤害',
						expanded: false
					},
					{
						id: 9,
						name: '毒疗',
						type: '恢复',
						shortEffect: '中毒时每回合恢复HP',
						fullEffect: '中毒状态下，每回合结束时恢复最大HP的1/8。这个特性将中毒状态转化为持续恢复效果，在特定战术中非常强大。',
						pokemon: '蘑蘑菇、斗笠菇等',
						trigger: '中毒状态下每回合结束',
						battleEffect: '每回合恢复1/8最大HP',
						expanded: false
					}
				],
				moveList: [], // 初始为空数组，将从数据库加载
				abilityList: [], // 初始为空数组，将从数据库加载
				isLoading: false, // 初始加载状态
				isLoadingAbility: false, // 特性加载状态
				pagination: {
					currentPage: 1,
					pageSize: 50,
					hasMore: true,
					isLoadingMore: false
				},
				paginationAbility: {
					currentPage: 1,
					pageSize: 50,
					hasMore: true,
					isLoadingMore: false
				}
			}
		},
		
		async mounted() {
			await this.loadMovesData()
		},
		
		computed: {
			filteredAbilityList() {
				let list;
				if (!this.searchKeyword) {
					list = [...this.abilityList];
				} else {
					const keyword = this.searchKeyword.toLowerCase();
					list = this.abilityList.filter(item => 
						item.name.toLowerCase().includes(keyword) ||
						item.type.toLowerCase().includes(keyword) ||
						item.shortEffect.toLowerCase().includes(keyword) ||
						item.fullEffect.toLowerCase().includes(keyword)
					);
				}
				
				// 按ID排序，支持升序和降序
				return list.slice().sort((a, b) => {
					if (this.sortAscending) {
						return a.id - b.id;
					} else {
						return b.id - a.id;
					}
				});
			},
			filteredMoveList() {
				let list;
				if (!this.searchKeyword) {
					list = [...this.moveList];
				} else {
					const keyword = this.searchKeyword.toLowerCase();
					list = this.moveList.filter(item => 
						item.name.toLowerCase().includes(keyword) ||
						item.type.toLowerCase().includes(keyword) ||
						item.category.toLowerCase().includes(keyword)
					);
				}
				
				// 按ID排序，支持升序和降序
				return list.slice().sort((a, b) => {
					if (this.sortAscending) {
						return a.id - b.id;
					} else {
						return b.id - a.id;
					}
				});
			}
		},
		methods: {
			// 加载招式数据（分页方式）
			async loadMovesData() {
				this.isLoading = true
				try {
					const result = await fetchMovesByPage(1, this.pagination.pageSize)
					this.moveList = result.moves
					this.pagination.hasMore = result.hasMore
					this.pagination.currentPage = 1
					console.log('招式数据加载成功:', this.moveList.length, '个招式，总数据量:', result.totalCount)
				} catch (error) {
					console.error('加载招式数据失败:', error)
					uni.showToast({
						title: '加载招式数据失败',
						icon: 'none'
					})
				} finally {
					this.isLoading = false
				}
			},
			
			// 加载更多招式数据
			async loadMoreMoves() {
				if (!this.pagination.hasMore || this.pagination.isLoadingMore) {
					return
				}
				
				this.pagination.isLoadingMore = true
				
				try {
					const nextPage = this.pagination.currentPage + 1
					const result = await fetchMovesByPage(nextPage, this.pagination.pageSize)
					
					if (result.moves.length > 0) {
						this.moveList = [...this.moveList, ...result.moves]
						this.pagination.hasMore = result.hasMore
						this.pagination.currentPage = nextPage
						console.log('加载更多招式成功:', result.moves.length, '个招式，当前总数据量:', this.moveList.length)
					}
				} catch (error) {
					console.error('加载更多招式数据失败:', error)
					uni.showToast({
						title: '加载更多招式失败',
						icon: 'none'
					})
			} finally {
				this.pagination.isLoadingMore = false
			}
		},
		
		// 加载特性数据（分页方式）
		async loadAbilitiesData() {
			this.isLoadingAbility = true
			try {
				const result = await fetchAbilitiesByPage(1, this.paginationAbility.pageSize)
				this.abilityList = result.abilities
				this.paginationAbility.hasMore = result.hasMore
				this.paginationAbility.currentPage = 1
				console.log('特性数据加载成功:', this.abilityList.length, '个特性，总数据量:', result.totalCount)
			} catch (error) {
				console.error('加载特性数据失败:', error)
				uni.showToast({
					title: '加载特性数据失败',
					icon: 'none'
				})
			} finally {
				this.isLoadingAbility = false
			}
		},
		
		// 加载更多特性数据
		async loadMoreAbilities() {
			if (!this.paginationAbility.hasMore || this.paginationAbility.isLoadingMore) {
				return
			}
			
			this.paginationAbility.isLoadingMore = true
			
			try {
				const nextPage = this.paginationAbility.currentPage + 1
				const result = await fetchAbilitiesByPage(nextPage, this.paginationAbility.pageSize)
				
				if (result.abilities.length > 0) {
					this.abilityList = [...this.abilityList, ...result.abilities]
					this.paginationAbility.hasMore = result.hasMore
					this.paginationAbility.currentPage = nextPage
					console.log('加载更多特性成功:', result.abilities.length, '个特性，当前总数据量:', this.abilityList.length)
				}
			} catch (error) {
				console.error('加载更多特性数据失败:', error)
				uni.showToast({
					title: '加载更多特性失败',
					icon: 'none'
				})
			} finally {
				this.paginationAbility.isLoadingMore = false
			}
		},
		
		// 加载特性数据（分页方式）
		async loadAbilitiesData() {
			this.isLoadingAbility = true
			try {
				const result = await fetchAbilitiesByPage(1, this.paginationAbility.pageSize)
				this.abilityList = result.abilities
				this.paginationAbility.hasMore = result.hasMore
				this.paginationAbility.currentPage = 1
				console.log('特性数据加载成功:', this.abilityList.length, '个特性，总数据量:', result.totalCount)
			} catch (error) {
				console.error('加载特性数据失败:', error)
				uni.showToast({
					title: '加载特性数据失败',
					icon: 'none'
				})
			} finally {
				this.isLoadingAbility = false
			}
		},
		
		// 加载更多特性数据
		async loadMoreAbilities() {
			if (!this.paginationAbility.hasMore || this.paginationAbility.isLoadingMore) {
				return
			}
			
			this.paginationAbility.isLoadingMore = true
			
			try {
				const nextPage = this.paginationAbility.currentPage + 1
				const result = await fetchAbilitiesByPage(nextPage, this.paginationAbility.pageSize)
				
				if (result.abilities.length > 0) {
					this.abilityList = [...this.abilityList, ...result.abilities]
					this.paginationAbility.hasMore = result.hasMore
					this.paginationAbility.currentPage = nextPage
					console.log('加载更多特性成功:', result.abilities.length, '个特性，当前总数据量:', this.abilityList.length)
				}
			} catch (error) {
				console.error('加载更多特性数据失败:', error)
				uni.showToast({
					title: '加载更多特性失败',
					icon: 'none'
				})
			} finally {
				this.paginationAbility.isLoadingMore = false
			}
		},
			
		// 滚动到底部自动加载更多
	onScrollToLower() {
		console.log('滚动到底部，自动加载更多数据')
		if (!this.isAbilityList && this.pagination.hasMore && !this.pagination.isLoadingMore) {
			this.loadMoreMoves()
		}
	},
	
	// 手动检测滚动到底部
	onScroll(event) {
		const { scrollHeight, scrollTop, clientHeight } = event.detail
		const distanceToBottom = scrollHeight - scrollTop - clientHeight
		
		// 当距离底部小于50px时自动加载
		if (distanceToBottom < 50 && !this.isAbilityList && this.pagination.hasMore && !this.pagination.isLoadingMore) {
			console.log('接近底部，自动加载更多数据', { distanceToBottom, scrollHeight, scrollTop, clientHeight })
			this.loadMoreMoves()
		}
	},
				
			// 获取属性颜色
			getTypeColor(type) {
				const typeColors = {
					'一般': '#A8A878',
					'火': '#F08030',
					'水': '#6890F0',
					'草': '#78C850',
					'电': '#F8D030',
					'冰': '#98D8D8',
					'格斗': '#C03028',
					'毒': '#A040A0',
					'地面': '#E0C068',
					'飞行': '#A890F0',
					'超能力': '#F85888',
					'虫': '#A8B820',
					'岩石': '#B8A038',
					'幽灵': '#705898',
					'龙': '#7038F8',
					'恶': '#705848',
					'钢': '#B8B8D0',
					'妖精': '#EE99AC'
				}
				return typeColors[type] || '#777'
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
			clearSearch() {
				this.searchKeyword = '';
			},
			handleSearch() {
				// 搜索功能由computed属性自动处理
				// 添加搜索反馈
				if (this.searchKeyword.trim()) {
					const listType = this.isAbilityList ? '特性' : '招式';
					const resultCount = this.isAbilityList ? this.filteredAbilityList.length : this.filteredMoveList.length;
					
					if (resultCount === 0) {
						uni.showToast({
							title: `未找到匹配的${listType}`,
							icon: 'none',
							duration: 1500
						});
					} else {
						uni.showToast({
							title: `找到${resultCount}个${listType}`,
							icon: 'none',
							duration: 1500
						});
					}
				}
			},
			
			// 切换列表类型（招式/特性）
			async toggleListType() {
				this.isAbilityList = !this.isAbilityList
				this.searchKeyword = '' // 清空搜索关键词
				
				// 关闭所有展开项
				this.moveList.forEach(item => item.expanded = false)
				this.abilityList.forEach(item => item.expanded = false)
				
				// 如果切换到特性列表且未加载过数据，则加载特性数据
				if (this.isAbilityList && this.abilityList.length === 0) {
					await this.loadAbilitiesData()
				}
			},
			
			// 切换展开状态（支持招式和特性）
			toggleExpand(index, type) {
				if (type === 'move') {
					// 关闭其他所有展开的招式
					this.moveList.forEach((item, i) => {
						if (i !== index) {
							item.expanded = false
						}
					})
					// 切换当前招式的展开状态
					this.moveList[index].expanded = !this.moveList[index].expanded
				} else if (type === 'ability') {
					// 关闭其他所有展开的特性
					this.abilityList.forEach((item, i) => {
						if (i !== index) {
							item.expanded = false
						}
					})
					// 切换当前特性的展开状态
					this.abilityList[index].expanded = !this.abilityList[index].expanded
				}
			},
			
			// 切换排序方向
			toggleSort() {
				this.sortAscending = !this.sortAscending;
				uni.showToast({
					title: this.sortAscending ? '升序排序' : '降序排序',
					icon: 'none',
					duration: 1000
				});
			},
			
			// 切换页面
			switchPage(page) {
				// 更新当前激活的页面
				this.activePage = page;
				
				// 如果切换到招式与特性页面，不进行跳转
				if (page === 'moves') {
					return;
				}
				
				// 根据页面进行跳转
				switch(page) {
					case 'pokedex':
						// 跳转到首页（图鉴页面）
						uni.navigateTo({ url: '/pages/index/index' });
						break;
					case 'community':
						// 社区页面在首页中显示，通过URL参数告诉首页显示社区页面
						uni.navigateTo({ url: '/pages/index/index?page=community' });
						break;
					case 'profile':
						// 我的页面在登录页面
						uni.navigateTo({ url: '/pages/login/index' });
						break;
				}
			},
			
			// 获取招式说明（现在使用数据库中的flavor_text字段）
			getMoveDescription(item) {
				return item.flavor_text || `这是${item.name}招式，属于${item.type}属性${item.category}类招式。`
			}
		}
	}
</script>

<style>
	page {
		height: 100%;
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
		background: white;
		color: #333;
		padding: 0;
		margin: 0 auto;
		min-height: 100vh;
		position: relative;
		padding-bottom: 90px; /* 为底部导航栏留出空间 */
		overflow-x: hidden;
	}
	
	/* 隐藏uniapp原生状态栏 */
	.uni-status-bar {
		display: none !important;
	}
	
	/* 确保页面从顶部开始 */
	page {
		padding-top: 0 !important;
		margin-top: 0 !important;
	}
	

	
	/* 头部 */
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
	
	/* 搜索栏 */
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
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
		transition: var(--transition);
	}
	
	.voice-search:active {
		transform: scale(0.9);
		box-shadow: 0 1px 2px rgba(0,0,0,0.2);
	}
	
	.voice-search::before {
		content: '';
		width: 16px;
		height: 16px;
		background-color: var(--primary-red);
		border-radius: 50%;
	}
	
	.clear-search {
		position: absolute;
		right: 48px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		opacity: 0;
		transition: var(--transition);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.clear-search.visible {
		opacity: 1;
	}
	
	.clear-search::before,
	.clear-search::after {
		content: '';
		position: absolute;
		width: 12px;
		height: 2px;
		background-color: var(--primary-red);
		border-radius: 1px;
	}
	
	.clear-search::before {
		transform: rotate(45deg);
	}
	
	.clear-search::after {
		transform: rotate(-45deg);
	}
	
	/* 搜索按钮样式 */
	.search-btn {
		position: absolute;
		right: 8px;
		width: 36px;
		height: 36px;
		background-color: white;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
		transition: var(--transition);
	}
	
	.search-btn:active {
		transform: scale(0.9);
		box-shadow: 0 1px 2px rgba(0,0,0,0.2);
	}
	
	.search-icon {
		font-size: 18px;
		color: var(--primary-red);
	}
	
	/* 搜索按钮样式 */
	.search-btn {
		position: absolute;
		right: 8px;
		width: 36px;
		height: 36px;
		background-color: white;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
		transition: var(--transition);
	}
	
	.search-btn:active {
		transform: scale(0.9);
		box-shadow: 0 1px 2px rgba(0,0,0,0.2);
	}
	
	.search-icon {
		font-size: 18px;
		color: var(--primary-red);
	}
	
	/* 搜索区域 */
	.search-section {
		display: flex;
		align-items: center;
		padding: 0 15px 15px;
		gap: 10px;
	}
	
	/* 切换按钮 */
	.switch-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: linear-gradient(135deg, var(--primary-red), var(--primary-variant));
		border-radius: 20px;
		color: white;
		font-size: 14px;
		font-weight: 600;
		box-shadow: var(--card-shadow);
		cursor: pointer;
		transition: var(--transition);
		flex-shrink: 0;
	}
	
	.switch-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2px 8px rgba(0,0,0,0.2);
	}
	
	.switch-icon {
		font-size: 16px;
		transition: var(--transition);
	}
	
	.switch-icon.active {
		transform: rotate(180deg);
	}
	
	/* 搜索栏 */
	.search-bar {
		flex: 1;
		position: relative;
	}
	
	/* 排序按钮 */
	.sort-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: linear-gradient(135deg, var(--secondary-blue), var(--secondary-variant));
		border-radius: 20px;
		color: white;
		font-size: 14px;
		font-weight: 600;
		box-shadow: var(--card-shadow);
		cursor: pointer;
		transition: var(--transition);
		flex-shrink: 0;
	}
	
	.sort-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2px 8px rgba(0,0,0,0.2);
	}
	
	.sort-icon {
		font-size: 16px;
		transition: var(--transition);
	}
	

	
	/* 顶部导航栏 */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 40rpx 30rpx 20rpx;
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
	
	.search-section {
		display: flex;
		align-items: center;
		margin: 20rpx 30rpx;
		gap: 15rpx;
	}
	
	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 20rpx 20rpx;
		background-color: #f5f5f5;
		border-radius: 50rpx;
		gap: 15rpx;
	}
	
	.search-icon {
		font-size: 32rpx;
		color: #999;
	}
	
	.search-input {
		flex: 1;
		font-size: 28rpx;
		color: #333;
		background: transparent;
		border: none;
		outline: none;
	}
	
	.list-container {
		flex: 1;
		padding: 0 30rpx;
		overflow: auto;
	}
	
	.move-card {
		display: flex;
		align-items: center;
		padding: 30rpx 0;
		border-bottom: 1px solid #f5f5f5;
	}
	
	.move-index {
		width: 50rpx;
		font-size: 24rpx;
		color: #999;
		text-align: center;
		flex-shrink: 0;
	}
	
	.move-info {
		flex: 1;
		margin: 0 15rpx;
		min-width: 0;
	}
	
	.move-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
		gap: 20rpx;
	}
	
	.move-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		flex: 0.6;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-right: 5rpx;
	}
	
	.move-stats {
		display: block;
		font-size: 24rpx;
		color: #999;
	}
	
	.move-tags {
		display: flex;
		align-items: center;
		gap: 15rpx;
		flex-shrink: 0;
		min-width: 180rpx;
		justify-content: flex-start;
		margin-left: -40rpx;
	}
	
	.type-tag,
	.category-tag {
		padding: 6rpx 12rpx;
		border-radius: 30rpx;
		font-size: 22rpx;
		color: #fff;
		margin-bottom: 10rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		min-width: 60rpx;
		text-align: center;
	}
	
	/* 类别图标样式 */
	.category-tag {
		background-color: #ffa500;
		width: 55rpx;
		height: 55rpx;
		padding: 0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.physical-icon,
	.special-icon,
	.change-icon {
		font-size: 28rpx;
		line-height: 1;
	}
	
	/* 属性标签颜色 */
	.type-tag.一般 {
		background-color: #a8a878;
	}
	
	.type-tag.格斗 {
		background-color: #c03028;
	}
	
	.type-tag.火 {
		background-color: #f08030;
	}
	
	.type-tag.水 {
		background-color: #6890f0;
	}
	
	.type-tag.草 {
		background-color: #78c850;
	}
	
	.type-tag.电 {
		background-color: #f8d030;
		color: #333;
	}
	
	.type-tag.冰 {
		background-color: #98d8d8;
	}
	
	.type-tag.毒 {
		background-color: #a040a0;
	}
	
	.type-tag.超能力 {
		background-color: #f85888;
	}
	
	/* 展开箭头样式 */
	.expand-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30rpx;
		height: 30rpx;
		font-size: 20rpx;
		color: #999;
		transition: transform 0.3s ease;
		cursor: pointer;
	}
	
	.expand-arrow.expanded {
		transform: rotate(180deg);
	}
	
	/* 展开栏样式 */
	.expand-panel {
		margin-top: 20rpx;
		padding: 20rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-radius: 12rpx;
		border-left: 4rpx solid #007bff;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}
	
	.expand-content {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.expand-title {
		font-size: 26rpx;
		font-weight: bold;
		color: #007bff;
		margin-bottom: 10rpx;
	}
	
	.expand-description {
		font-size: 24rpx;
		line-height: 1.6;
		color: #495057;
		background: white;
		padding: 15rpx;
		border-radius: 8rpx;
		border: 1rpx solid #dee2e6;
	}
	
	.expand-details {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10rpx;
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 12rpx;
		background: white;
		border-radius: 6rpx;
		border: 1rpx solid #dee2e6;
	}
	
	.detail-label {
		font-size: 22rpx;
		color: #6c757d;
		font-weight: bold;
		min-width: 100rpx;
	}
	
	.detail-value {
		font-size: 22rpx;
		color: #495057;
		font-weight: 500;
	}
	
	/* 点击效果 */
	.move-header {
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	
	.move-header:active {
		background-color: #f8f9fa;
		border-radius: 8rpx;
	}
	
	/* 特性卡片样式 */
	.ability-card {
		display: flex;
		align-items: center;
		padding: 30rpx 0;
		border-bottom: 1px solid #f5f5f5;
	}
	
	.ability-index {
		width: 50rpx;
		font-size: 24rpx;
		color: #999;
		text-align: center;
		flex-shrink: 0;
	}
	
	.ability-info {
		flex: 1;
		margin: 0 15rpx;
		min-width: 0;
	}
	
	.ability-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
		gap: 20rpx;
	}
	
	.ability-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		flex: 0.6;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-right: 5rpx;
	}
	
	.ability-effect {
		display: block;
		font-size: 24rpx;
		color: #999;
	}
	
	.ability-tags {
		display: flex;
		align-items: center;
		gap: 15rpx;
		flex-shrink: 0;
		min-width: 180rpx;
		justify-content: flex-start;
		margin-left: -40rpx;
	}
	
	.ability-type-tag {
		padding: 6rpx 12rpx;
		border-radius: 30rpx;
		font-size: 22rpx;
		color: #fff;
		margin-bottom: 10rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		white-space: nowrap;
		min-width: 60rpx;
		text-align: center;
		background-color: #6c757d;
	}
	
	/* 特性类型标签颜色 */
	.ability-type-tag.草系 {
		background-color: #78c850;
	}
	
	.ability-type-tag.火系 {
		background-color: #f08030;
	}
	
	.ability-type-tag.水系 {
		background-color: #6890f0;
	}
	
	.ability-type-tag.电系 {
		background-color: #f8d030;
		color: #333;
	}
	
	.ability-type-tag.防御 {
		background-color: #b8a038;
	}
	
	.ability-type-tag.特殊 {
		background-color: #705898;
	}
	
	.ability-type-tag.攻击 {
		background-color: #c03028;
	}
	
	.ability-type-tag.天气 {
		background-color: #98d8d8;
	}
	
	.ability-type-tag.恢复 {
		background-color: #78c850;
	}
	
	/* 切换按钮样式 */
	.switch-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100rpx;
		height: 60rpx;
		border-radius: 30rpx;
		background: linear-gradient(135deg, #1E3A8A, #FF3B30);
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		gap: 8rpx;
		padding: 0 20rpx;
		flex-shrink: 0;
	}
	
	.switch-btn:active {
		transform: scale(0.95);
	}
	
	.switch-icon {
		font-size: 24rpx;
		transition: all 0.3s ease;
	}
	
	.switch-icon.active {
		transform: rotate(180deg);
	}
	
	.switch-text {
		font-size: 24rpx;
		font-weight: bold;
	}
	
	/* 点击效果 */
	.ability-header {
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	
	.ability-header:active {
		background-color: #f8f9fa;
		border-radius: 8rpx;
	}
	
	/* 底部导航栏样式 */
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
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--secondary-blue);
		border: 2px solid white;
		z-index: 2;
	}
	
	.pokeball::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--secondary-blue);
		z-index: 1;
	}
	
	.nav-button text {
		font-size: 12px;
		color: #666;
		font-weight: 500;
		transition: var(--transition);
	}
	
	.nav-button.active text {
		color: var(--primary-red);
		font-weight: bold;
	}
	
	/* 加载更多按钮样式 */
	.load-more-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 30rpx 0;
		background: linear-gradient(135deg, var(--primary-red), var(--primary-variant));
		border-radius: 20rpx;
		margin: 30rpx 0;
		cursor: pointer;
		transition: var(--transition);
		box-shadow: var(--card-shadow);
	}
	
	.load-more-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2px 8px rgba(0,0,0,0.2);
	}
	
	.load-btn-text {
		font-size: 28rpx;
		color: white;
		font-weight: bold;
		margin-bottom: 10rpx;
	}
	
	.load-btn-icon {
		font-size: 24rpx;
		color: white;
		animation: bounce 1.5s infinite;
	}
	
	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-8rpx);
		}
		60% {
			transform: translateY(-4rpx);
		}
	}
	
	/* 加载更多提示样式 */
	.load-more {
		text-align: center;
		padding: 30rpx 0;
		color: #999;
		font-size: 26rpx;
	}
	
	.load-more-end {
		text-align: center;
		padding: 30rpx 0;
		color: #78c850;
		font-size: 26rpx;
		font-weight: bold;
	}
</style>