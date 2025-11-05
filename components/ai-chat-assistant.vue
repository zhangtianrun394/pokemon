<template>
  <view class="ai-chat-assistant" v-if="showInCurrentPage">
    <!-- 悬浮图标 -->
    <view 
      class="floating-icon" 
      :class="{ active: isChatOpen }"
      @click="toggleChat"
    >
      <!-- 精灵球图标 -->
      <view class="pokeball-icon">
        <view class="pokeball-top"></view>
        <view class="pokeball-center"></view>
        <view class="pokeball-bottom"></view>
      </view>
    </view>

    <!-- 聊天框 -->
    <view 
      class="chat-container" 
      :class="{ open: isChatOpen }"
    >
      <!-- 聊天框头部 -->
      <view class="chat-header">
        <text class="chat-title">宝可梦助手</text>
        <view class="close-button" @click="toggleChat">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <!-- 聊天记录区域 -->
      <scroll-view 
        class="chat-messages" 
        scroll-y="true"
        :scroll-top="scrollTop"
      >
        <view 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['message', msg.type]"
        >
          <view class="message-content">
            <view class="message-bubble">
              <text class="message-text">{{ msg.content }}</text>
            </view>
            <view 
              v-if="msg.type === 'ai'" 
              class="pokeball-indicator"
            >
              <view class="mini-pokeball"></view>
            </view>
          </view>
        </view>
        <view v-if="isLoading" class="loading-indicator">
          <text class="loading-text">宝可梦助手正在思考...</text>
          <view class="loading-dots">
            <view class="dot"></view>
            <view class="dot"></view>
            <view class="dot"></view>
          </view>
        </view>
      </scroll-view>

      <!-- 输入区域 -->
      <view class="chat-input-area">
        <input 
          class="message-input" 
          v-model="inputMessage" 
          placeholder="输入关于宝可梦的问题..."
          :disabled="isLoading"
          @confirm="sendMessage"
        />
        <button 
          class="send-button" 
          :disabled="!inputMessage.trim() || isLoading"
          @click="sendMessage"
        >
          <text class="send-icon">➤</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AIChatAssistant',
  data() {
    return {
      isChatOpen: false,
      inputMessage: '',
      messages: [
        {
          type: 'ai',
          content: '你好！我是宝可梦助手，可以问我任何关于宝可梦的问题，比如"皮卡丘的进化形态是什么？"或"妙蛙种子的属性是什么？"'
        }
      ],
      isLoading: false,
      scrollTop: 0,
      // Dify API配置
      difyApiUrl: 'https://dify.aipfuture.com/v1',
      difyApiKey: 'app-DW2nWIuKRYAjbvJnqsp1aaQ5',
      // 页面显示控制
      showInCurrentPage: false
    }
  },
  computed: {
    // 检查当前页面是否为宝可梦图鉴首页
    isPokedexPage() {
      // 通过路由路径判断当前页面
      const currentRoute = this.$route ? this.$route.path : '';
      return currentRoute.includes('/pages/index/index') || 
             currentRoute.includes('pokedex') ||
             currentRoute === '/' ||
             currentRoute === '';
    }
  },
  mounted() {
    // 组件挂载时检查当前页面
    this.checkCurrentPage();
    // 监听路由变化
    this.$watch('$route', this.checkCurrentPage);
  },
  methods: {
    // 检查当前页面是否为宝可梦图鉴首页
    checkCurrentPage() {
      // 在uni-app中，可以通过getCurrentPages获取当前页面栈
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const route = currentPage.route || '';
        
        // 严格判断是否为宝可梦图鉴首页
        // 只显示在首页（pages/index/index），其他页面都不显示
        this.showInCurrentPage = route === 'pages/index/index' || 
                                 route.includes('/pages/index/index') ||
                                 route === 'pages/index';
      } else {
        // 如果没有页面栈信息，默认不显示
        this.showInCurrentPage = false;
      }
    },
    
    toggleChat() {
      this.isChatOpen = !this.isChatOpen
      if (this.isChatOpen) {
        // 打开聊天框时滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    async sendMessage() {
      if (!this.inputMessage.trim()) return

      const userMessage = this.inputMessage.trim()
      this.inputMessage = ''

      // 添加用户消息
      this.messages.push({
        type: 'user',
        content: userMessage
      })

      this.isLoading = true
      this.scrollToBottom()

      try {
        // 调用Dify API
        const response = await uni.request({
          url: `${this.difyApiUrl}/chat-messages`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${this.difyApiKey}`,
            'Content-Type': 'application/json'
          },
          data: {
            inputs: {},
            query: userMessage,
            response_mode: 'blocking',
            user: 'pokemon-user'
          },
          timeout: 30000
        })

        // 处理响应
        const res = Array.isArray(response) ? response[1] : response
        
        if (res && res.statusCode === 200 && res.data) {
          const aiResponse = res.data.answer || res.data.message || '抱歉，我暂时无法回答这个问题。'
          
          this.messages.push({
            type: 'ai',
            content: aiResponse
          })
        } else {
          throw new Error('API响应异常')
        }
      } catch (error) {
        console.error('调用Dify API失败:', error)
        this.messages.push({
          type: 'ai',
          content: '抱歉，宝可梦助手暂时无法响应，请稍后重试。'
        })
      } finally {
        this.isLoading = false
        this.scrollToBottom()
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.scrollTop = 99999
        }, 100)
      })
    }
  }
}
</script>

<style scoped>
.ai-chat-assistant {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 10000;
}

/* 悬浮图标样式 */
.floating-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(230, 57, 70, 0.4);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  animation: breath 3s ease-in-out infinite;
  border: 3px solid #E63946;
}

.floating-icon.active {
  transform: scale(1.1);
  box-shadow: 0 12px 35px rgba(230, 57, 70, 0.6);
}

.floating-icon:hover {
  transform: scale(1.05);
}

@keyframes breath {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 8px 25px rgba(230, 57, 70, 0.4);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 0 12px 30px rgba(230, 57, 70, 0.6);
  }
}

/* 神奇宝贝球图标 */
.pokeball-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: 2px solid #000;
  background: linear-gradient(to bottom, #E63946 0%, #E63946 45%, white 45%, white 55%, white 55%, white 100%);
}

.pokeball-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: #E63946;
  border-bottom: 2px solid #000;
}

.pokeball-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #000;
  background: #fff;
  z-index: 2;
}

.pokeball-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: #fff;
}

/* 神奇宝贝球中心按钮 */
.pokeball-center::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid white;
  background: white;
  z-index: 1;
}

.pokeball-center::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1D3557;
  z-index: 2;
}

/* 聊天框样式 */
.chat-container {
  position: absolute;
  bottom: 100px;
  right: 0;
  width: 300px;
  height: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(20px) scale(0.9);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: none;
  overflow: hidden;
}

.chat-container.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* 聊天框头部 */
.chat-header {
  background: linear-gradient(135deg, #1D3557, #457B9D);
  color: white;
  padding: 16px;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  font-size: 18px;
  font-weight: bold;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-icon {
  font-size: 16px;
  font-weight: bold;
}

/* 聊天记录区域 */
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #F8F9FA;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  display: flex;
  align-items: flex-end;
  max-width: 80%;
}

.message.user .message-content {
  flex-direction: row-reverse;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 100%;
  word-wrap: break-word;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #E63946, #FF6B6B);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.ai .message-bubble {
  background: white;
  color: #333;
  border: 1px solid #E0E0E0;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
}

/* AI消息指示器 */
.pokeball-indicator {
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.mini-pokeball {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #1D3557;
  background: linear-gradient(to bottom, #E63946 0%, #E63946 45%, white 45%, white 55%, white 55%, white 100%);
  position: relative;
}

.mini-pokeball::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid white;
  background: white;
  z-index: 1;
}

.mini-pokeball::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #1D3557;
  z-index: 2;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 16px;
}

.loading-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #E63946;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

/* 输入区域 */
.chat-input-area {
  padding: 16px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 8px;
  background: white;
  border-radius: 0 0 16px 16px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #E63946;
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E63946, #FF6B6B);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
}

.send-button:not(:disabled):hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

.send-icon {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .ai-chat-assistant {
    bottom: 80px;
    right: 10px;
  }
  
  .floating-icon {
    width: 70px;
    height: 70px;
  }
  
  .pokeball-icon {
    width: 45px;
    height: 45px;
  }
  
  .chat-container {
    width: calc(100vw - 40px);
    height: 70vh;
    right: -10px;
  }
}
</style>