<template>
	<view class="battle-container">
		<!-- 对战信息栏 -->
		<view class="battle-info">
			<view class="score">回合: <text>{{ turnCount }}</text></view>
			<scroll-view class="battle-log" scroll-y :scroll-top="scrollTop">
				<view v-for="(log, index) in battleLogs" :key="index" class="log-entry">{{ log }}</view>
			</scroll-view>
		</view>

		<!-- 对战场地 -->
		<view class="battle-field">
			<!-- 对手区域 -->
			<view class="pokemon opponent-pokemon">
				<view class="pokemon-info">
					<text class="pokemon-name">{{ opponentPokemon.name }}</text>
					<text class="pokemon-level">Lv.{{ opponentPokemon.level }}</text>
				</view>
				<view class="hp-bar">
					<view class="hp-fill" :style="{ width: opponentHpPercent + '%' }"></view>
					<text class="hp-text">{{ opponentPokemon.currentHp }}/{{ opponentPokemon.maxHp }}</text>
				</view>
				<view class="pokemon-sprite">
					<image :src="getOpponentImage()" mode="aspectFit"></image>
				</view>
			</view>

			<!-- 玩家区域 -->
			<view class="pokemon player-pokemon">
				<view class="pokemon-sprite">
					<image :src="getPlayerImage()" mode="aspectFit"></image>
				</view>
				<view class="pokemon-info">
					<text class="pokemon-name">{{ playerPokemon.name }}</text>
					<text class="pokemon-level">Lv.{{ playerPokemon.level }}</text>
				</view>
				<view class="hp-bar">
					<view class="hp-fill" :style="{ width: playerHpPercent + '%' }"></view>
					<text class="hp-text">{{ playerPokemon.currentHp }}/{{ playerPokemon.maxHp }}</text>
				</view>
			</view>
		</view>

		<!-- 技能选择区域 -->
		<view class="action-panel">
			<view class="skills-container">
				<button 
					v-for="(move, index) in playerPokemon.moves" 
					:key="index"
					class="skill-btn" 
					:class="'skill-btn-' + move.type"
					:disabled="!isPlayerTurn || battleEnded"
					@click="useMove(index)"
				>
					{{ move.name }}
				</button>
			</view>
			<view class="battle-controls">
				<button @click="switchPokemon" :disabled="battleEnded">切换宝可梦</button>
				<button @click="flee" :disabled="battleEnded">逃跑</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			turnCount: 1,
			isPlayerTurn: true,
			battleEnded: false,
			battleLogs: ['对战开始！'],
			scrollTop: 0,
			
			playerPokemon: {
				id: 4,
				name: '小火龙',
				level: 50,
				maxHp: 100,
				currentHp: 100,
				stats: {
					attack: 52,
					defense: 43,
					spAttack: 60,
					spDefense: 50,
					speed: 65
				},
				types: ['fire'],
				moves: [
					{ name: '火花', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25 },
					{ name: '抓', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
					{ name: '龙息', type: 'dragon', category: 'special', power: 60, accuracy: 100, pp: 20 },
					{ name: '烟幕', type: 'normal', category: 'status', accuracy: 100, pp: 20 }
				]
			},
			
			opponentPokemon: {
				id: 1,
				name: '妙蛙种子',
				level: 50,
				maxHp: 100,
				currentHp: 100,
				stats: {
					attack: 49,
					defense: 49,
					spAttack: 65,
					spDefense: 65,
					speed: 45
				},
				types: ['grass', 'poison'],
				moves: [
					{ name: '藤鞭', type: 'grass', category: 'physical', power: 45, accuracy: 100, pp: 25 },
					{ name: '寄生种子', type: 'grass', category: 'status', accuracy: 90, pp: 10 },
					{ name: '飞叶快刀', type: 'grass', category: 'physical', power: 55, accuracy: 95, pp: 25 },
					{ name: '生长', type: 'normal', category: 'status', pp: 20 }
				]
			},
			
			// 属性克制表
			typeEffectiveness: {
				normal: { rock: 0.5, ghost: 0, steel: 0.5 },
				fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
				water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
				electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
				grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
				dragon: { dragon: 2, steel: 0.5, fairy: 0 }
			}
		}
	},
	
	computed: {
		playerHpPercent() {
			return (this.playerPokemon.currentHp / this.playerPokemon.maxHp) * 100
		},
		opponentHpPercent() {
			return (this.opponentPokemon.currentHp / this.opponentPokemon.maxHp) * 100
		}
	},
	
	methods: {
		getPlayerImage() {
			return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.playerPokemon.id}.png`
		},
		
		getOpponentImage() {
			return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.opponentPokemon.id}.png`
		},
		
		// 计算属性克制
		calculateEffectiveness(moveType, defenderTypes) {
			let effectiveness = 1
			for (let defenderType of defenderTypes) {
				const multiplier = (this.typeEffectiveness[moveType] && this.typeEffectiveness[moveType][defenderType]) || 1
				effectiveness *= multiplier
			}
			return effectiveness
		},
		
		// 伤害计算
		calculateDamage(attacker, defender, move) {
			if (move.category === 'status') return 0
			
			const level = attacker.level
			const power = move.power
			const attack = attacker.stats.attack
			const defense = defender.stats.defense
			
			// 基础伤害计算
			let damage = ((2 * level / 5 + 2) * power * attack / defense) / 50 + 2
			
			// 属性一致加成
			const stab = attacker.types.includes(move.type) ? 1.5 : 1
			damage *= stab
			
			// 属性克制
			const effectiveness = this.calculateEffectiveness(move.type, defender.types)
			damage *= effectiveness
			
			// 随机因子
			const random = 0.85 + Math.random() * 0.15
			damage *= random
			
			return Math.max(1, Math.floor(damage))
		},
		
		// 玩家使用技能
		async useMove(moveIndex) {
			if (!this.isPlayerTurn || this.battleEnded) return
			
			const move = this.playerPokemon.moves[moveIndex]
			this.addToLog(`${this.playerPokemon.name} 使用了 ${move.name}！`)
			
			// 伤害计算和应用
			const damage = this.calculateDamage(this.playerPokemon, this.opponentPokemon, move)
			await this.applyDamage(this.opponentPokemon, damage, false)
			
			// 检查是否获胜
			if (this.opponentPokemon.currentHp <= 0) {
				this.addToLog(`对手的 ${this.opponentPokemon.name} 倒下了！`)
				this.endBattle(true)
				return
			}
			
			this.isPlayerTurn = false
			setTimeout(() => this.opponentTurn(), 1000)
		},
		
		// 对手回合
		async opponentTurn() {
			const moveIndex = Math.floor(Math.random() * this.opponentPokemon.moves.length)
			const move = this.opponentPokemon.moves[moveIndex]
			
			this.addToLog(`对手的 ${this.opponentPokemon.name} 使用了 ${move.name}！`)
			
			const damage = this.calculateDamage(this.opponentPokemon, this.playerPokemon, move)
			await this.applyDamage(this.playerPokemon, damage, true)
			
			// 检查是否失败
			if (this.playerPokemon.currentHp <= 0) {
				this.addToLog(`${this.playerPokemon.name} 倒下了！`)
				this.endBattle(false)
				return
			}
			
			this.isPlayerTurn = true
			this.turnCount++
		},
		
		// 应用伤害
		async applyDamage(pokemon, damage, isPlayer) {
			pokemon.currentHp = Math.max(0, pokemon.currentHp - damage)
			this.addToLog(`造成了 ${damage} 点伤害！`)
			
			await new Promise(resolve => setTimeout(resolve, 500))
		},
		
		// 添加对战日志
		addToLog(message) {
			this.battleLogs.push(message)
			this.$nextTick(() => {
				this.scrollTop = 99999
			})
		},
		
		// 结束对战
		endBattle(isPlayerWinner) {
			this.battleEnded = true
			const message = isPlayerWinner ? '恭喜你获得了胜利！' : '很遗憾，你被打败了...'
			this.addToLog(message)
			
			setTimeout(() => {
				uni.showModal({
					title: '对战结束',
					content: message + ' 要重新开始吗？',
					confirmText: '重新开始',
					cancelText: '返回',
					success: (res) => {
						if (res.confirm) {
							this.resetBattle()
						} else {
							uni.navigateBack()
						}
					}
				})
			}, 1000)
		},
		
		// 重置对战
		resetBattle() {
			this.turnCount = 1
			this.isPlayerTurn = true
			this.battleEnded = false
			this.battleLogs = ['对战开始！']
			this.playerPokemon.currentHp = this.playerPokemon.maxHp
			this.opponentPokemon.currentHp = this.opponentPokemon.maxHp
		},
		
		// 切换宝可梦
		switchPokemon() {
			uni.showToast({
				title: '宝可梦切换功能开发中',
				icon: 'none'
			})
		},
		
		// 逃跑
		flee() {
			uni.showModal({
				title: '确认',
				content: '确定要逃跑吗？',
				success: (res) => {
					if (res.confirm) {
						this.addToLog('你逃跑了...')
						setTimeout(() => {
							uni.navigateBack()
						}, 1000)
					}
				}
			})
		}
	}
}
</script>

<style scoped>
/* 基础样式 */
.battle-container {
	width: 100%;
	height: 100vh;
	background: rgba(255, 255, 255, 0.95);
	overflow: hidden;
	position: relative;
}

/* 对战信息栏 */
.battle-info {
	padding: 10px 20px;
	background: #2c3e50;
	color: white;
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 60px;
}

.score {
	font-size: 14px;
	font-weight: bold;
}

.battle-log {
	flex-grow: 1;
	margin-left: 20px;
	font-size: 12px;
	height: 40px;
}

.log-entry {
	margin-bottom: 4px;
}

/* 对战场地 */
.battle-field {
	height: 400px;
	background: linear-gradient(180deg, #87CEEB 0%, #98FB98 100%);
	position: relative;
	overflow: hidden;
}

.pokemon {
	position: absolute;
	display: flex;
	align-items: center;
}

.opponent-pokemon {
	top: 50px;
	right: 50px;
	flex-direction: column;
	align-items: flex-end;
}

.player-pokemon {
	bottom: 50px;
	left: 50px;
	flex-direction: column;
	align-items: flex-start;
}

.pokemon-info {
	margin-bottom: 10px;
	display: flex;
	align-items: center;
}

.pokemon-name {
	font-weight: bold;
	font-size: 16px;
	margin-right: 10px;
}

.pokemon-level {
	color: #666;
	font-size: 12px;
}

.hp-bar {
	width: 150px;
	height: 20px;
	background: #ddd;
	border-radius: 10px;
	overflow: hidden;
	position: relative;
	margin: 5px 0;
}

.hp-fill {
	height: 100%;
	background: linear-gradient(90deg, #ff4444, #ffaa00, #44ff44);
	transition: width 0.3s ease;
}

.hp-text {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	text-align: center;
	font-size: 11px;
	line-height: 20px;
	color: #000;
	font-weight: bold;
}

.pokemon-sprite {
	width: 120px;
	height: 120px;
}

.pokemon-sprite image {
	width: 100%;
	height: 100%;
	filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
}

/* 技能面板 */
.action-panel {
	padding: 20px;
	background: #34495e;
	position: absolute;
	bottom: 0;
	width: 100%;
}

.skills-container {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	margin-bottom: 15px;
}

.skill-btn {
	padding: 12px;
	border: none;
	border-radius: 8px;
	background: #3498db;
	color: white;
	font-size: 14px;
	transition: all 0.3s ease;
}

.skill-btn:disabled {
	opacity: 0.6;
}

/* 技能类型颜色 */
.skill-btn-fire { background: #e74c3c; }
.skill-btn-water { background: #3498db; }
.skill-btn-grass { background: #2ecc71; }
.skill-btn-electric { background: #f1c40f; color: #333; }
.skill-btn-normal { background: #95a5a6; }
.skill-btn-dragon { background: #7038F8; }

.battle-controls {
	display: flex;
	gap: 10px;
}

.battle-controls button {
	flex: 1;
	padding: 10px;
	border: none;
	border-radius: 5px;
	background: #7f8c8d;
	color: white;
	font-size: 14px;
}
</style>
