<template>
  <div id="app">
    <div class="header">HR工作台</div>
    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'jd' }" @click="activeTab = 'jd'">JD生成</div>
      <div class="tab" :class="{ active: activeTab === 'resume' }" @click="activeTab = 'resume'">简历筛选</div>
      <div class="tab" :class="{ active: activeTab === 'interview' }" @click="activeTab = 'interview'">面试提问</div>
    </div>

    <div class="main-content-container">
      <!-- JD生成模块 -->
      <div v-show="activeTab === 'jd'" class="main-content">
        <div class="input-section">
          <h3>职位描述生成</h3>
          <div class="form-group">
            <label>职位基本信息</label>
            <textarea v-model="inputMessage" placeholder="输入职位名称、要求等信息..." class="input-textarea"></textarea>
          </div>
          <div class="button-group">
            <button @click="sendJdMessage" class="generate-btn">+ 生成JD</button>
            <button @click="clearJdContent" class="clear-btn">× 清除内容</button>
          </div>
        </div>
        <div class="output-section">
          <h3>生成结果</h3>
          <div class="result-container">
            <div v-for="(message, index) in jdMessages" :key="index" class="message">
              <div class="markdown-content" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 简历筛选模块 -->
      <div v-show="activeTab === 'resume'" class="main-content">
        <div class="input-section">
          <h3>简历筛选</h3>
          <div class="form-group">
            <label>人才要求</label>
            <textarea v-model="inputResumeRequirement" placeholder="输入人才要求（如：5年经验，Java开发）..." class="input-textarea"></textarea>
          </div>
          <div class="button-group">
            <button @click="sendResumeMessage" class="generate-btn">+ 筛选简历</button>
            <button @click="clearResumeContent" class="clear-btn">× 清除内容</button>
          </div>
        </div>
        <div class="output-section">
          <h3>候选简历</h3>
          <div class="result-container">
            <div v-for="(message, index) in resumeMessages" :key="index" class="message">
              <div class="markdown-content" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 面试提问模块 -->
      <div v-show="activeTab === 'interview'" class="main-content">
        <div class="input-section">
          <h3>面试提问生成</h3>
          <div class="input-column">
            <div class="form-group">
              <label>简历及岗位信息</label>
              <textarea 
                v-model="combinedInput" 
                placeholder="输入候选人简历内容及岗位要求..."
                class="input-textarea"
                style="height: 240px"
              ></textarea>
            </div>
          </div>
          <div class="button-group">
            <button @click="sendInterviewMessage" class="generate-btn">+ 生成面试问题</button>
            <button @click="clearInterviewContent" class="clear-btn">× 清除内容</button>
          </div>
        </div>
        <div class="output-section">
          <h3>面试问题列表</h3>
          <div class="result-container">
            <div v-for="(message, index) in interviewMessages" :key="index" class="message">
              <div class="markdown-content" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      created by <a href="#">HiAgent</a><br>
      页面内容均由 AI 生成，仅供参考
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 配置marked以支持表格渲染
marked.use({
  gfm: true, // 启用GitHub Flavored Markdown
  tables: true, // 启用表格解析
  breaks: true, // 启用换行符转换为 <br>
  sanitize: false // 配合 DOMPurify 进行安全处理

});



// ----------------------
// JD生成模块
// ----------------------
const inputMessage = ref('');
const jdMessages = ref([]);

const jdApiConfig = {

  apiKey: 'd07p1830i2mho6cupjqg',
  baseUrl: '/api/proxy/api/v1/chat_query',
  //baseUrl: 'https://hiagent.volcenginepaas.com/api/proxy/api/v1/chat_query', // 直接使用完整地址
  appConversationId: 'd07p7gav43mu0vq10d3g',
  userId: '321'

};

const sendJdMessage = async () => {
  if (inputMessage.value.trim() === '') return;
  await sendRequest(inputMessage.value, jdMessages, jdApiConfig);
};

const clearJdContent = () => {
  inputMessage.value = '';
  jdMessages.value = [];
};

// ----------------------
// 简历筛选模块
// ----------------------
const inputResumeRequirement = ref('');
const resumeMessages = ref([]);

const resumeApiConfig = {
  apiKey: 'd0b427ufqcku1aff0500',
  baseUrl: '/api/proxy/api/v1/chat_query',
  //baseUrl: 'https://hiagent.volcenginepaas.com/api/proxy/api/v1/chat_query', // 直接使用完整地址
  appConversationId: 'd0b42i7fiaqoof61r630',
  userId: '321'
};

const sendResumeMessage = async () => {
  if (inputResumeRequirement.value.trim() === '') return;
  await sendRequest(inputResumeRequirement.value, resumeMessages, resumeApiConfig);
};

const clearResumeContent = () => {
  inputResumeRequirement.value = '';
  resumeMessages.value = [];
};

// ----------------------
// 面试提问模块
// ----------------------
const combinedInput = ref('');
const interviewMessages = ref([]);  // 添加缺失的响应式变量声明

const interviewApiConfig = { 
  apiKey: 'd08hiib0i2msccmh24bg',
  baseUrl: '/api/proxy/api/v1/chat_query',
  //baseUrl: 'https://hiagent.volcenginepaas.com/api/proxy/api/v1/chat_query', // 直接使用完整地址
  appConversationId: 'd08hovffiaqoof61pqu0',
  userId: '321'
};

const sendInterviewMessage = async () => {
  if (combinedInput.value.trim() === '') return;
  await sendRequest(combinedInput.value, interviewMessages, interviewApiConfig);
};

const clearInterviewContent = () => {
  combinedInput.value = '';
  interviewMessages.value = [];
};

// ----------------------
// 通用请求处理sendRequest
// ----------------------
const sendRequest = async (userContent, messagesRef, apiConfig) => {
  try {
    // 安全处理响应式对象
    const contentValue = typeof userContent === 'object' ? userContent.value : userContent;
    
    // 构建请求数据
    const data = {
      Query: contentValue,
      AppConversationID: apiConfig.appConversationId,
      ResponseMode: 'streaming',
      UserID: apiConfig.userId
    };

    messagesRef.value = [];
    const agentMessage = { sender: 'agent', content: '' };
    messagesRef.value.push(agentMessage);
    let currentChunk = '';

    // 发送请求
    const response = await fetch(apiConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Apikey': apiConfig.apiKey,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(data),
      credentials: 'omit'
    });

    // 流式数据处理
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          buffer.split('\n').forEach(processSSELine);
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      
      let lineEndIndex;
      while ((lineEndIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, lineEndIndex);
        buffer = buffer.slice(lineEndIndex + 1);
        processSSELine(line);
      }
    }

    function processSSELine(line) {
      if (!line.startsWith('data:')) return;
      
      const jsonStr = line.slice(5).trim();
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        console.warn('Invalid JSON segment:', jsonStr.slice(0, 50));
        return;
      }

      try {
        const eventData = JSON.parse(jsonStr.slice(jsonStart, jsonEnd + 1));
        
        switch (eventData.event) {
          case 'message_start':
            currentChunk = '';
            messagesRef.value = [{...agentMessage, content: ''}];
            break;
            
          case 'message':
            if (eventData.answer) {
              currentChunk += eventData.answer;
              messagesRef.value[0].content = DOMPurify.sanitize(
                marked.parse(currentChunk, { breaks: true })
              );
              nextTick();
            }
            break;
            
          case 'message_end':
            // 可添加最终处理逻辑
            break;
        }
      } catch (error) {
        console.error('SSE Processing Error:', error);
      }
    }

  } catch (error) {
    console.error('请求失败:', error);
    messagesRef.value = [];
  }
};

// ----------------------
// 通用工具方法
// ----------------------
marked.setOptions({ breaks: true, gfm: true });

const renderMarkdown = (content) => {
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml);
};

// 状态管理
const activeTab = ref('jd');
</script>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #333;
  margin: 0;
  padding: 5px;
}

.header {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
}

.tab {
  padding: 8px 16px;
  margin-right: 10px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  background: #f8f9fa;
  border-radius: 4px;
}

.tab.active {
  border-bottom: 2px solid #0066cc;
  background: white;
}

.main-content-container {
  flex: 1;
  min-height: calc(100vh - 160px);  /* 保持原有高度计算 */
  overflow-y: auto;  /* 新增滚动条 */
  padding-bottom: 80px;  /* 新增底部内边距 */
}

.footer {
  position: relative;
  margin-top: auto;  /* 关键布局属性 */
  padding: 20px 0;
  background: white;
  z-index: 1;
}

.main-content {
  width: 100%;
  min-height: auto;
}

.input-section,
.output-section {
  flex: 1 1 50%; /* 新增弹性分配比例 */
  min-width: 600px; /* 最小宽度保证可读性 */
  height: 100%;
}

.result-container {
  height: calc(100% - 60px); /* 60px = 标题高度 + 按钮高度 */
}

.main-content {
  display: flex;
  gap: 20px;
  flex: 1;
}

.input-section,
.output-section {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 14px;
}

.input-textarea {
  width: 100%;
  height: 120px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  resize: vertical;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.generate-btn,
.clear-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.generate-btn {
  background: #0066cc;
}

.clear-btn {
  background: #808080;
}

.output-section h3 {
  color: #333;
  margin: 0 0 15px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.result-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.markdown-content {
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin: 1em 0 0.5em;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-content code {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content th,
.markdown-content td {
  padding: 8px;
  border: 1px solid #e0e0e0;
}

.markdown-content th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.markdown-content tr:nth-child(even) {
  background-color: #f8f9fa;
}
/* 新增和修改的 CSS 样式 */
.markdown-content {
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  /* 关键优化：重置段落和标题的间距 */
}
.markdown-content p {
  margin: 0.5em 0; /* 段落上下间距调整为较小值 */
}

.footer {
  margin-top: 30px;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.input-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
</style>