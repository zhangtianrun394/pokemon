<template>
    <div class="phone-container" :style="{ background: dynamicBackground }">
        
        <!-- 加载骨架屏 -->
        <div v-if="loading" class="loading-skeleton white-content">
            <div class="skeleton-image"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-subtitle"></div>
            <div class="skeleton-tags">
                <div class="skeleton-tag"></div>
                <div class="skeleton-tag"></div>
            </div>
            <div class="skeleton-description"></div>
            <div class="skeleton-details">
                <div class="skeleton-detail-item"></div>
                <div class="skeleton-detail-item"></div>
                <div class="skeleton-detail-item"></div>
                <div class="skeleton-detail-item"></div>
            </div>
        </div>

        <div class="pokemon-container white-content" v-if="!loading">
            <!-- 图鉴编号 -->
            <div class="pokemon-number">#{{ pokemon.index ? String(pokemon.index).padStart(4, '0') : (form.pokemon_id ? String(form.pokemon_id).padStart(4, '0') : '') }}</div>
            
            <div class="pokemon-image">
                <image :src="getImageUrl(form.image)" mode="aspectFit" style="width: 150px; height: 150px;"></image>
            </div>
            
            <h1 class="pokemon-name">{{ pokemon.name }}</h1>
            <div class="japanese-name">{{ pokemon.name_jp }}・{{ pokemon.name_en }}</div>
            <div class="pokemon-category">{{ form.genus || '未知宝可梦' }}</div>
            
            <div class="attributes">
                <div v-for="(t, index) in form.typesZh" :key="t" class="attribute" :class="form.typesEn[index]">{{ t }}</div>
            </div>
            
            <div class="egg-groups">
                <div class="egg-group">怪兽群</div>
                <div class="egg-group">植物群</div>
            </div>
            
            <div class="pokemon-description" @click="showFullDescription">
                <p>{{ truncatedProfile }}</p>
                <span v-if="pokemon.profile && pokemon.profile.length > 100" class="read-more">点击查看完整介绍 ></span>
            </div>
            
            <!-- 完整介绍模态框 -->
            <div v-if="showModal" class="modal-overlay" @click="closeModal">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>{{ pokemon.name }} - 详细介绍</h3>
                        <button class="close-btn" @click="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <p>{{ pokemon.profile }}</p>
                    </div>
                </div>
            </div>
            
            <div class="pokemon-details">
                <div class="detail-item">
                    <span class="detail-label">身高</span>
                    <span class="detail-value">{{ form.height || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">体重</span>
                    <span class="detail-value">{{ form.weight || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">体形</span>
                    <span class="detail-value">{{ form.shape || '未知' }}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">颜色</span>
                    <span class="detail-value">
                        <span class="color-indicator" :style="{ backgroundColor: getColorValue(form.color) }"></span>
                        {{ form.color || '未知' }}
                    </span>
                </div>
            </div>
            
            <div class="ability" v-for="ability in abilities" :key="ability.name">
                <div class="ability-title">{{ ability.name }} <span v-if="ability.is_hidden" style="font-size: 12px; color: #e67e22;">(隐藏特性)</span></div>
                <p class="ability-description">{{ ability.description }}</p>
            </div>
            
            <view class="wiki-button" @click="goWiki">查看神奇宝贝百科介绍</view>
        </div>

        <!-- 悬浮操作组件：点赞与收藏 -->
        <div class="floating-actions">
            <div class="float-btn like" @click="handleLike">
                <span class="icon">👍</span>
                <span class="count">{{ likesCount }}</span>
            </div>
            <div class="float-btn favorite" :class="{ active: isFavorite }" @click="handleToggleFavorite">
                <span class="icon">★</span>
            </div>
        </div>
        
        <div class="navigation">
            <div class="nav-item active">基本信息</div>
            <div class="nav-item">技能招式</div>
            <div class="nav-item">获得方式</div>
            <div class="nav-item">配招培育</div>
            <div class="nav-item">相关</div>
        </div>
    </div>
</template>

<script>
import { fetchFormById, fetchPokemonByIdAndName, fetchAbilitiesByPokemonId, fetchPokemonDetailOptimized } from '../../src/lib/pokeData.js';
import { getImageUrl } from '../../src/lib/utils.js';

export default {
    data() {
        return {
            loading: true,
            form: {},
            pokemon: {},
            abilities: [],
            activeTab: '基本信息',
            showModal: false,
            dynamicBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 优雅的紫蓝渐变加载背景
            // 悬浮操作状态
            likesCount: 0,
            isFavorite: false,
            supabaseUrl: '',
            supabaseKey: '',
        };
    },
    computed: {
        truncatedProfile() {
            if (!this.pokemon.profile) return '';
            const profile = this.pokemon.profile;
            if (profile.length <= 100) return profile;
            return profile.substring(0, 100) + '...';
        }
    },
    onLoad(options) {
        this.bootstrapEnv();
        if (options.forms_id) {
            // 设置一个优雅的预加载背景
            this.setLoadingBackground();
            this.loadPokemonData(options.forms_id);
        }
    },
    methods: {
        getImageUrl,
        bootstrapEnv() {
            try {
                const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
                this.supabaseUrl = env && env.VITE_SUPABASE_URL ? String(env.VITE_SUPABASE_URL) : ''
                this.supabaseKey = env && env.VITE_SUPABASE_ANON_KEY ? String(env.VITE_SUPABASE_ANON_KEY) : ''
            } catch (e) {}
        },
        goWiki() {
            const idx = this.pokemon && this.pokemon.index
            if (!idx) {
                uni.showToast({ title: '缺少图鉴编号', icon: 'none' })
                return
            }
            uni.navigateTo({ url: `/pages/wiki/wiki?index=${idx}` })
        },
        async handleLike() {
            if (!this.form || !this.form.forms_id) { uni.showToast({ title: '缺少表单ID', icon: 'none' }); return }
            const next = (this.likesCount || 0) + 1;
            this.likesCount = next; // 乐观更新
            try {
                const base = (this.supabaseUrl || '').replace(/\/$/, '')
                const key = this.supabaseKey
                if (!base || !key) return
                const url = `${base}/rest/v1/forms?forms_id=eq.${encodeURIComponent(this.form.forms_id)}`
                const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
                await new Promise((resolve, reject) => {
                    uni.request({ url, method: 'PATCH', header: headers, data: { likes: next }, timeout: 10000, success: resolve, fail: reject })
                })
            } catch (e) {
                this.likesCount = Math.max(0, this.likesCount - 1) // 回滚
                uni.showToast({ title: '点赞失败', icon: 'none' })
            }
        },
        async handleToggleFavorite() {
            if (!this.form || !this.form.forms_id) { uni.showToast({ title: '缺少表单ID', icon: 'none' }); return }
            const nextFav = !this.isFavorite;
            this.isFavorite = nextFav; // 乐观更新
            try {
                const base = (this.supabaseUrl || '').replace(/\/$/, '')
                const key = this.supabaseKey
                if (!base || !key) return
                const url = `${base}/rest/v1/forms?forms_id=eq.${encodeURIComponent(this.form.forms_id)}`
                const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
                await new Promise((resolve, reject) => {
                    uni.request({ url, method: 'PATCH', header: headers, data: { favorite: nextFav }, timeout: 10000, success: resolve, fail: reject })
                })
                uni.showToast({ title: nextFav ? '收藏成功' : '已取消收藏', icon: 'none' })
            } catch (e) {
                this.isFavorite = !nextFav; // 回滚
                uni.showToast({ title: '收藏操作失败', icon: 'none' })
            }
        },
        async loadPokemonData(formsId) {
            this.loading = true;
            try {
                // 使用优化的数据获取函数，大幅提高加载速度
                const result = await fetchPokemonDetailOptimized(formsId);
                
                this.form = result.form;
                this.pokemon = result.pokemon;
                this.abilities = result.abilities;
                // 同步点赞与收藏状态
                this.likesCount = Number(result.form && result.form.likes) || 0;
                this.isFavorite = !!(result.form && result.form.favorite);

                // 根据宝可梦颜色设置背景色
                this.setBackgroundColor(result.form.color);

            } catch (error) {
                console.error("Failed to load pokemon details:", error);
                uni.showToast({
                    title: '加载宝可梦信息失败',
                    icon: 'none'
                });
            } finally {
                this.loading = false;
            }
        },
        switchTab(tabName) {
            this.activeTab = tabName;
        },
        getColorValue(colorName) {
            // 将中文颜色名转换为CSS颜色值（基于数据库实际颜色值）
            const colorMap = {
                '红色': '#F44336',      // 标准红色
                '蓝色': '#2196F3',      // 标准蓝色
                '绿色': '#4CAF50',      // 标准绿色（修复之前的淡蓝色问题）
                '黄色': '#FFEB3B',      // 标准黄色
                '紫色': '#9C27B0',      // 标准紫色
                '粉红色': '#E91E63',    // 粉红色（数据库中的实际值）
                '黑色': '#424242',      // 柔和黑色
                '白色': '#FAFAFA',      // 柔和白色
                '灰色': '#9E9E9E',      // 标准灰色
                '褐色': '#8D6E63',      // 褐色（数据库中的实际值）
                '未知色': '#BDC3C7'     // 未知颜色的默认值
            };
            return colorMap[colorName] || '#BDC3C7';
        },
        showFullDescription() {
            if (this.pokemon.profile && this.pokemon.profile.length > 100) {
                this.showModal = true;
            }
        },
        closeModal() {
            this.showModal = false;
        },
        setBackgroundColor(colorName) {
            // 根据宝可梦颜色设置页面背景色（使用渐变效果）
            const baseColor = this.getColorValue(colorName);
            const lightColor = this.lightenColor(baseColor, 0.3);
            const darkColor = this.darkenColor(baseColor, 0.1);
            
            // 在uni-app中使用动态样式
            this.dynamicBackground = `linear-gradient(135deg, ${lightColor} 0%, ${baseColor} 50%, ${darkColor} 100%)`;
        },
        lightenColor(color, amount) {
            // 将颜色变亮
            const num = parseInt(color.replace("#", ""), 16);
            const amt = Math.round(255 * amount);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        },
        darkenColor(color, amount) {
            // 将颜色变暗
            const num = parseInt(color.replace("#", ""), 16);
            const amt = Math.round(255 * amount);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
                (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
                (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
        },
        setLoadingBackground() {
            // 设置优雅的加载背景，使用多种渐变色随机选择
            const loadingBackgrounds = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 紫蓝渐变
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // 粉红渐变
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // 蓝青渐变
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // 绿青渐变
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // 粉黄渐变
                'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // 淡青粉渐变
                'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // 淡粉渐变
            ];
            
            // 随机选择一个优雅的背景
            const randomIndex = Math.floor(Math.random() * loadingBackgrounds.length);
            this.dynamicBackground = loadingBackgrounds[randomIndex];
        }
    }
};
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

body {
    margin: 0;
    padding: 0;
}

.phone-container {
    width: 100%;
    min-height: 100vh;
    position: relative;
    background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
    transition: background 0.5s ease;
    padding: 20px 0;
}

/* 悬浮操作组件样式 */
.floating-actions {
    position: fixed;
    right: 20px;
    bottom: 80px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1001;
}
.float-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255,255,255,0.9);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
}
.float-btn .icon { font-size: 20px; }
.float-btn .count { font-size: 14px; font-weight: 600; }
.float-btn:hover { transform: translateY(-2px); }
.float-btn.like { color: #e74c3c; }
.float-btn.favorite { color: #999; }
.float-btn.favorite.active { color: #f1c40f; }

/* 白色内容容器 */
.white-content {
    background: white;
    border-radius: 20px;
    margin: 20px auto;
    max-width: 375px;
    position: relative;
    z-index: 1;
}

.pokemon-number {
    position: absolute;
    top: 20px;
    left: 20px;
    font-size: 16px;
    font-weight: bold;
    color: #666;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 12px;
    z-index: 10;
}

.pokemon-container {
    padding: 20px;
}

.pokemon-image {
    text-align: center;
    margin-bottom: 20px;
    position: relative;
}

.pokemon-image img {
    width: 150px;
    height: 150px;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 5px 10px rgba(0,0,0,0.1));
}

.pokemon-image:hover img {
    transform: scale(1.05);
}

/* 描述区域样式 */
.pokemon-description {
    cursor: pointer;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 15px 0;
    transition: background-color 0.3s ease;
}

.pokemon-description:hover {
    background: #e9ecef;
}

.read-more {
    color: #007bff;
    font-size: 14px;
    font-weight: 500;
    display: block;
    margin-top: 8px;
}

/* 模态框样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 90%;
    max-height: 80%;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to right, #78C850, #5CA935);
    color: white;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: white;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.modal-body {
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
    line-height: 1.6;
}

/* 颜色指示器样式 */
.color-indicator {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 8px;
    border: 2px solid #ddd;
    vertical-align: middle;
}

.pokemon-name {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
    color: #2c3e50;
    text-align: center;
}

.japanese-name {
    color: #666;
    font-size: 16px;
    margin-bottom: 15px;
    text-align: center;
}

.pokemon-category {
    color: #888;
    font-size: 14px;
    margin-bottom: 15px;
    text-align: center;
}

.attributes {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    justify-content: center;
}

.attribute {
    padding: 5px 12px;
    border-radius: 20px;
    color: white;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.grass { background-color: #78c850; }
.poison { background-color: #a040a0; }
.fire { background-color: #f08030; }
.water { background-color: #6890f0; }
.electric { background-color: #f8d030; }
.normal { background-color: #a8a878; }
.psychic { background-color: #f85888; }
.flying { background-color: #a890f0; }
.ghost { background-color: #705898; }
.dragon { background-color: #7038f8; }
.rock { background-color: #b8a038; }
.ground { background-color: #e0c068; }
.steel { background-color: #b8b8d0; }
.dark { background-color: #705848; }
.fairy { background-color: #ee99ac; }
.ice { background-color: #98d8d8; }
.bug { background-color: #a8b820; }
.fighting { background-color: #c03028; }


.egg-groups {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: center;
}

.egg-group {
    padding: 4px 10px;
    border-radius: 15px;
    color: #666;
    font-size: 12px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
}

.pokemon-description {
    line-height: 1.5;
    margin-bottom: 20px;
    color: #333;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
    border-left: 4px solid #78c850;
}

.pokemon-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.detail-label {
    color: #666;
}

.detail-value {
    font-weight: bold;
    color: #2c3e50;
}



.ability {
    margin-bottom: 20px;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
}

.ability-title {
    font-weight: bold;
    margin-bottom: 5px;
    color: #2c3e50;
}

.ability-description {
    color: #666;
    line-height: 1.4;
}

.wiki-button {
    display: block;
    width: 100%;
    padding: 12px;
    background: linear-gradient(to right, #4a90e2, #63b3ed);
    color: white;
    text-align: center;
    border-radius: 8px;
    font-weight: bold;
    text-decoration: none;
    margin-top: 20px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(74, 144, 226, 0.2);
}

.wiki-button:hover {
    background: linear-gradient(to right, #3a80d2, #53a3dd);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(74, 144, 226, 0.3);
}

.navigation {
    display: flex;
    justify-content: space-between;
    background-color: #f8f8f8;
    padding: 10px 15px;
    border-top: 1px solid #eee;
    margin: 0 auto;
    max-width: 375px;
    border-radius: 0 0 20px 20px;
}

.nav-item {
    padding: 8px 12px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    white-space: nowrap;
    flex: 1;
    text-align: center;
}

.nav-item.active {
    color: #4a90e2;
    font-weight: bold;
}

.nav-item.active::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    background-color: #4a90e2;
    border-radius: 50%;
}

.nav-item:hover {
    color: #4a90e2;
}



/* 响应式调整 */
@media (max-width: 400px) {
    .white-content {
        margin: 10px;
        border-radius: 15px;
    }
    
    .navigation {
        margin: 0 10px;
        border-radius: 0 0 15px 15px;
    }
    
    .pokemon-details {
        grid-template-columns: 1fr;
    }
    
    .nav-item {
        font-size: 12px;
        padding: 8px 8px;
    }
}

/* 动画效果 */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.pokemon-container > * {
    animation: fadeIn 0.5s ease forwards;
    opacity: 0; /* Start with opacity 0 to make animation visible */
}

.pokemon-container > *:nth-child(1) { animation-delay: 0.1s; }
.pokemon-container > *:nth-child(2) { animation-delay: 0.2s; }
.pokemon-container > *:nth-child(3) { animation-delay: 0.3s; }
.pokemon-container > *:nth-child(4) { animation-delay: 0.4s; }
.pokemon-container > *:nth-child(5) { animation-delay: 0.5s; }
.pokemon-container > *:nth-child(6) { animation-delay: 0.6s; }
.pokemon-container > *:nth-child(7) { animation-delay: 0.7s; }
.pokemon-container > *:nth-child(8) { animation-delay: 0.8s; }
.pokemon-container > *:nth-child(9) { animation-delay: 0.9s; }



/* 加载骨架屏样式 - 优化版 */
.loading-skeleton {
    padding: 20px;
    text-align: center;
    position: relative;
}

/* 添加一个优雅的加载提示 */
.loading-skeleton::before {
    content: '正在加载宝可梦信息...';
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.skeleton-image {
    width: 150px;
    height: 150px;
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 2s infinite ease-in-out;
    border-radius: 50%;
    margin: 30px auto 20px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.skeleton-title {
    width: 60%;
    height: 28px;
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 2s infinite ease-in-out;
    border-radius: 8px;
    margin: 0 auto 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.skeleton-subtitle {
    width: 80%;
    height: 18px;
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 2s infinite ease-in-out;
    border-radius: 6px;
    margin: 0 auto 25px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.skeleton-tags {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 25px;
}

.skeleton-tag {
    width: 65px;
    height: 28px;
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 2s infinite ease-in-out;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.skeleton-description {
    width: 90%;
    height: 70px;
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 2s infinite ease-in-out;
    border-radius: 10px;
    margin: 0 auto 25px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.skeleton-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 25px;
}

.skeleton-detail-item {
    height: 45px;
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 2s infinite ease-in-out;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

@keyframes skeleton-loading {
    0% {
        background-position: -200% 0;
        opacity: 0.6;
    }
    50% {
        opacity: 1;
    }
    100% {
        background-position: 200% 0;
        opacity: 0.6;
    }
}
</style>
