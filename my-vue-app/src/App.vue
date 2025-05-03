<template>
  <div id="app">
    <div class="header">HR工作台</div>
    <div class="tabs">
      <div class="tab active">JD生成</div>
      <div class="tab">简历筛选</div>
      <div class="tab">面试提问</div>
    </div>
    <div class="main-content">
      <div class="input-section">
        <h3>职位描述生成</h3>
        <div class="form-group">
          <label>职位基本信息</label>
          <textarea v-model="inputMessage" placeholder="输入职位名称、要求等信息..." class="input-textarea"></textarea>
        </div>
        <div class="button-group">
          <button @click="sendMessage" class="generate-btn">+ 生成JD</button>
          <button @click="clearContent" class="clear-btn">× 清除内容</button>
        </div>
      </div>
      <div class="output-section">
        <h3>生成结果</h3>
        <div class="result-container">
          <div v-for="(message, index) in messages" :key="index" class="message">
            <div class="markdown-content" v-html="renderMarkdown(message.content)"></div>
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
import { ref } from 'vue';
import { marked } from'marked';
import DOMPurify from 'dompurify';
import { nextTick } from 'vue';

const inputMessage = ref('');
const messages = ref([]);

const apiKey = 'd07p1830i2mho6cupjqg';
const baseUrl = '/api/proxy/api/v1/chat_query'; // 同步curl的API路径
const appConversationId = 'd07p7gav43mu0vq10d3g';
const userId = '321';

const sendMessage = async () => {
  if (inputMessage.value.trim() === '') return;

  const userContent = inputMessage.value;
  
  try {
    const headers = {
      'Apikey': apiKey,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`, // 添加标准认证头
      'Accept': 'text/event-stream'
    };
    const data = {
      Query: userContent,
      AppConversationID: appConversationId,
      ResponseMode: 'streaming',
      UserID: userId
    };

    messages.value = [];
    const agentMessage = { sender: 'agent', content: '' };
    messages.value.push(agentMessage);
    let currentChunk = '';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
      credentials: 'omit'  
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          lines.forEach(line => {
            if (line.startsWith('data:')) {
              const jsonStr = line.slice(5).trim();
              let validJson = jsonStr;
              const start = validJson.indexOf('{');
              const end = validJson.lastIndexOf('}');
              if (start!== -1 && end!== -1 && end > start) {
                validJson = validJson.substring(start, end + 1);
              } else {
                console.warn('无效的JSON片段:', jsonStr);
                return;
              }
              try {
                const eventData = JSON.parse(validJson);
                if (eventData.event ==='message' && eventData.answer) {
                  currentChunk += eventData.answer;
                  // 每次接收到数据都更新 messages
                  messages.value = [{
                    ...messages.value[0],
                    content: DOMPurify.sanitize(marked.parse(currentChunk)) 
                  }];
                }
              } catch (error) {
                console.error('事件解析失败:', error);
              }
            }
          });
        }
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      let lineEndIndex;
      while ((lineEndIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, lineEndIndex);
        buffer = buffer.slice(lineEndIndex + 1);
        
        if (line.startsWith('data:')) {
          const jsonStr = line.slice(5).trim();
          let validJson = jsonStr;
          const start = validJson.indexOf('{');
          const end = validJson.lastIndexOf('}');
          if (start!== -1 && end!== -1 && end > start) {
            validJson = validJson.substring(start, end + 1);
          } else {
            console.warn('无效的JSON片段:', jsonStr);
            continue;
          }
          try {
            const eventData = JSON.parse(validJson);
            switch(eventData.event) {
              case'message_start':
                currentChunk = '';
                messages.value = [{...agentMessage, content: ''}];
                break;
              case 'message':
                if (eventData.answer) {
                  currentChunk += eventData.answer;
                  // 使用响应式赋值并强制更新
                  messages.value[0].content = DOMPurify.sanitize(
                    marked.parse(currentChunk, { breaks: true })
                  );
                  // 触发异步DOM更新
                  await nextTick();
                }
                break;
              case'message_end':
                break;
            }
          } catch (error) {
            console.error('事件解析失败:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('请求出错:', error);
    inputMessage.value = userContent;
    messages.value = [];
  }
};

const clearContent = () => {
  inputMessage.value = '';
  messages.value = [];
};

marked.setOptions({
  breaks: true,
  gfm: true
});

const renderMarkdown = (content) => {
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml);
};

function tryProcessLine(dataStr) {
  let sanitizedData = dataStr || ''; 
  
  try {
    if (sanitizedData) {
      sanitizedData = sanitizedData
       .replace(/(['"])?([a-z0-9_]+)(['"]):/gi, '"$2":')
       .replace(/,\s*}/g, '}')
       .replace(/(\\*)"([^"]*)"(\\*)/g, '$1\\"$2\\"$3');
    }

    const jsonStart = sanitizedData.indexOf('{');
    const jsonEnd = sanitizedData.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      console.warn('JSON结构异常:', sanitizedData.slice(0, 50));
      return;
    }

    const validJson = sanitizedData.slice(jsonStart, jsonEnd + 1);
    const dataObj = JSON.parse(validJson);
    
    console.debug('Processed event:', dataObj.event);

    if (dataObj.event === 'message') {
      currentChunk += dataObj.answer?.replace(/["']/g, '') || ''; 
    }
  } catch (error) {
    console.error('增强错误处理:', {
      rawData: dataStr,
      sanitizedData: sanitizedData || 'undefined', 
      error: error.message
    });
  }
}

function safeParseJSON(str) {
  try {
    const sanitized = str
     .replace(/\\+/g, '\\\\')
     .replace(/[\x00-\x1F]/g, '')
     .replace(/'/g, '"');
    return JSON.parse(sanitized);
  } catch (e) {
    console.warn('JSON解析失败:', str.slice(0, 50));
    return null;
  }
}

function updateMessageContent(content) {
  messages.value = [{
    ...messages.value[0],
    content: DOMPurify.sanitize(marked.parse(content))
  }];
}
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
  padding: 20px;
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

.main-content {
  display: flex;
  gap: 20px;
  width: 1200px;          
  margin: 0 auto;         
  overflow: hidden;      
}

.input-section {
  width: 500px;          
  height: 560px;         
  flex: none;            
}

.output-section {
  width: 700px;          
  height: 560px;         
  flex: none;            
}

.result-container {
  height: 460px;         
  overflow-y: auto;      
}

.input-section,
.output-section {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
}

.generate-btn {
  background: #0066cc;
}

.clear-btn {
  background: #808080;  
  color: white;         
}

.output-section h3 {
  color: #333;
  margin-top: 0;
}

.result-container {
  margin-top: 10px;
  min-height: 300px;
  border: 1px solid #e0e0e0;
  padding: 10px;
  overflow-y: auto;
}

.markdown-content {
  line-height: 1.6;
  color: #333;
  text-align: left;
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3 {
  margin: 1em 0 0.5em;
}

.markdown-content ul {
  padding-left: 2em;
  list-style: disc;
}

.markdown-content ol {
  padding-left: 2em;
  list-style: decimal;
}

.markdown-content code {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.footer {
  margin-top: 30px;
  color: #666;
  font-size: 14px;
  text-align: center;
}
</style>