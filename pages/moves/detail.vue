<template>
    <view class="phone-container">
        <!-- 头部导航 -->
        <view class="header">
            <view class="back-btn" @click="goBack">
                <text class="back-icon">←</text>
                <text class="back-text">返回</text>
            </view>
            <view class="header-title">
                <text class="pokemon-name">{{ pokemonName }}</text>
                <text class="page-title">的技能招式</text>
            </view>
            <view class="header-right"></view>
        </view>

        <!-- 内容区域 -->
        <view class="content">
            <!-- 筛选区域 -->
            <view class="filter-section">
                <view class="filter-row">
                    <view class="filter-item" :class="{ active: activeFilter === 'all' }" @click="setFilter('all')">
                        全部技能
                    </view>
                    <view class="filter-item" :class="{ active: activeFilter === 'physical' }" @click="setFilter('physical')">
                        物理
                    </view>
                    <view class="filter-item" :class="{ active: activeFilter === 'special' }" @click="setFilter('special')">
                        特殊
                    </view>
                    <view class="filter-item" :class="{ active: activeFilter === 'status' }" @click="setFilter('status')">
                        变化
                    </view>
                </view>
            </view>

        <!-- 技能列表 -->
        <view class="moves-list" v-if="!loading && filteredMoves.length > 0">
            <view class="move-item" v-for="move in filteredMoves" :key="move.id">
                <view class="move-header" @click="toggleMoveDetail(move.id)">
                    <view class="move-info">
                        <view class="move-name-row">
                            <view class="move-name">{{ move.name }}</view>
                            <view class="learn-level" v-if="move.level">Lv.{{ move.level }}</view>
                        </view>
                        <view class="move-stats-summary">
                            <text class="stat-item">威力: {{ move.power || '-' }}</text>
                            <text class="stat-item">命中: {{ move.accuracy || '-' }}</text>
                            <text class="stat-item">PP: {{ move.pp || '-' }}</text>
                        </view>
                    </view>
                    <view class="move-right-section">
                        <view class="move-type" :class="move.typeEn">{{ move.typeZh }}</view>
                        <view class="expand-icon" :class="{ rotated: expandedMove === move.id }">▼</view>
                    </view>
                </view>
                <!-- 技能详情下拉框 -->
                <view class="move-detail-dropdown" v-show="expandedMove === move.id">
                    <view class="detail-section">
                        <view class="detail-row">
                            <view class="detail-label">分类</view>
                            <view class="detail-value">{{ move.categoryZh || '未知' }}</view>
                        </view>
                        <view class="detail-row">
                            <view class="detail-label">描述</view>
                            <view class="detail-value description">{{ move.description || '暂无描述' }}</view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

            <!-- 空状态 -->
            <view class="empty-state" v-else-if="!loading">
                <view class="empty-icon">⚡</view>
                <view class="empty-text">暂无技能数据</view>
                <view class="empty-subtext">该宝可梦暂时没有可学习的技能</view>
            </view>
            
            <!-- 加载状态 -->
            <view class="loading-state" v-if="loading">
                <view class="loading-icon">🔄</view>
                <view class="loading-text">正在加载招式数据...</view>
            </view>
        </view>
    </view>
</template>

<script>
import { fetchMovesByPokemonId } from '../../src/lib/pokeData.js';

export default {
    data() {
        return {
            pokemonId: '',
            pokemonName: '',
            moves: [],
            activeFilter: 'all',
            expandedMove: null,
            loading: true
        };
    },
    computed: {
        filteredMoves() {
            let filtered = this.moves;
            
            // 按分类筛选
            if (this.activeFilter !== 'all') {
                filtered = filtered.filter(move => {
                    if (this.activeFilter === 'physical') return move.categoryEn === 'physical';
                    if (this.activeFilter === 'special') return move.categoryEn === 'special';
                    if (this.activeFilter === 'status') return move.categoryEn === 'status';
                    return true;
                });
            }
            
            return filtered;
        }
    },
    onLoad(options) {
        this.pokemonId = options.pokemonId || '';
        this.pokemonName = decodeURIComponent(options.pokemonName || '未知宝可梦');
        
        console.log('[技能招式页面] 接收参数:', {
            pokemonId: this.pokemonId,
            pokemonName: this.pokemonName
        });
        
        if (this.pokemonId) {
            this.loadPokemonMoves();
        } else {
            uni.showToast({ title: '缺少宝可梦ID参数', icon: 'none' });
            setTimeout(() => {
                uni.navigateBack();
            }, 1500);
        }
    },
    methods: {
        goBack() {
            uni.navigateBack();
        },
        setFilter(filter) {
            this.activeFilter = filter;
        },
        toggleMoveDetail(moveId) {
            if (this.expandedMove === moveId) {
                // 如果点击的是已展开的技能，则关闭
                this.expandedMove = null;
            } else {
                // 展开新的技能
                this.expandedMove = moveId;
            }
        },
        async loadPokemonMoves() {
            this.loading = true;
            try {
                console.log('[技能招式页面] 开始加载招式数据，pokemon_id:', this.pokemonId);
                
                // 从数据库获取真实数据
                const moves = await fetchMovesByPokemonId(this.pokemonId);
                
                console.log('[技能招式页面] 获取到招式数据:', moves.length, '个');
                
                this.moves = moves;
                
                if (moves.length === 0) {
                    uni.showToast({ 
                        title: '该宝可梦暂无可学习的招式', 
                        icon: 'none',
                        duration: 2000
                    });
                }
            } catch (error) {
                console.error('[技能招式页面] 加载失败:', error);
                uni.showToast({ 
                    title: '加载招式失败', 
                    icon: 'none' 
                });
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped>
.phone-container {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4eaf1 100%);
    padding-top: 44px;
    background-image: 
        radial-gradient(rgba(100, 100, 100, 0.05) 1px, transparent 1px),
        radial-gradient(rgba(100, 100, 100, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
}

/* 头部导航 */
.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    z-index: 1000;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
}

.back-btn {
    display: flex;
    align-items: center;
    color: #007AFF;
    font-size: 16px;
    padding: 5px 8px;
    border-radius: 6px;
}

.back-icon {
    font-size: 20px;
    margin-right: 5px;
}

.header-title {
    display: flex;
    align-items: center;
    font-size: 17px;
    font-weight: 600;
    color: #333;
}

.pokemon-name {
    color: #007AFF;
    margin-right: 5px;
    font-weight: 700;
}

.page-title {
    color: #666;
}

.header-right {
    width: 60px;
}

/* 内容区域 */
.content {
    padding: 15px;
}

/* 筛选区域 */
.filter-section {
    background: white;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.filter-row {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.filter-item {
    padding: 7px 15px;
    border-radius: 20px;
    background: #f5f5f5;
    color: #666;
    font-size: 14px;
    transition: all 0.3s ease;
    border: 1px solid transparent;
    font-weight: 500;
}

.filter-item.active {
    background: #007AFF;
    color: white;
    border-color: #007AFF;
    box-shadow: 0 3px 8px rgba(0, 122, 255, 0.3);
}

/* 技能列表 */
.moves-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.move-item {
    background: white;
    border-radius: 12px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.07);
    overflow: hidden;
    transition: all 0.3s ease;
    margin-bottom: 8px;
    border: 1px solid rgba(0, 0, 0, 0.03);
}

.move-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 15px;
}

.move-info {
    flex: 1;
    min-width: 0;
}

.move-name-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.move-name {
    font-size: 17px;
    font-weight: 600;
    color: #333;
    flex-shrink: 0;
}

.learn-level {
    font-size: 13px;
    font-weight: 600;
    color: #007AFF;
    background: rgba(0, 122, 255, 0.1);
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid rgba(0, 122, 255, 0.3);
}

.move-stats-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.move-stats-summary .stat-item {
    font-size: 12px;
    color: #666;
    background: #f0f0f0;
    padding: 4px 10px;
    border-radius: 8px;
    white-space: nowrap;
}

.move-right-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    margin-left: 15px;
}

.move-type {
    padding: 6px 14px;
    border-radius: 15px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

/* 属性类型颜色 */
.normal { background-color: #a8a878; }
.fire { background-color: #f08030; }
.water { background-color: #6890f0; }
.electric { background-color: #f8d030; }
.grass { background-color: #78c850; }
.ice { background-color: #98d8d8; }
.fighting { background-color: #c03028; }
.poison { background-color: #a040a0; }
.ground { background-color: #e0c068; }
.flying { background-color: #a890f0; }
.psychic { background-color: #f85888; }
.bug { background-color: #a8b820; }
.rock { background-color: #b8a038; }
.ghost { background-color: #705898; }
.dragon { background-color: #7038f8; }
.dark { background-color: #705848; }
.steel { background-color: #b8b8d0; }
.fairy { background-color: #ee99ac; }

.expand-icon {
    font-size: 14px;
    color: #999;
    transition: transform 0.3s ease, color 0.2s ease;
    padding: 3px;
}

.expand-icon.rotated {
    transform: rotate(180deg);
    color: #007AFF;
}

/* 技能详情下拉框 */
.move-detail-dropdown {
    padding: 0 15px 15px 15px;
    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.detail-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
}

.detail-row:last-child {
    margin-bottom: 0;
}

.detail-label {
    color: #666;
    font-size: 13px;
    font-weight: 500;
    min-width: 60px;
    line-height: 1.4;
}

.detail-value {
    font-size: 13px;
    color: #333;
    font-weight: 500;
    flex: 1;
    margin-left: 20px;
    line-height: 1.4;
}

.detail-value.description {
    text-align: left;
    line-height: 1.6;
    padding: 5px 0;
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    margin-top: 30px;
}

.empty-icon {
    font-size: 56px;
    margin-bottom: 15px;
    color: #e0e0e0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-text {
    font-size: 16px;
    color: #333;
    margin-bottom: 8px;
    font-weight: 600;
}

.empty-subtext {
    font-size: 14px;
    color: #999;
}

/* 动画效果 */
@keyframes slideDown {
    from { 
        opacity: 0;
        max-height: 0;
        transform: translateY(-10px);
    }
    to { 
        opacity: 1;
        max-height: 500px;
        transform: translateY(0);
    }
}

/* 加载状态 */
.loading-state {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    margin-top: 30px;
}

.loading-icon {
    font-size: 56px;
    margin-bottom: 15px;
    animation: rotate 1.5s linear infinite;
}

.loading-text {
    font-size: 14px;
    color: #666;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
