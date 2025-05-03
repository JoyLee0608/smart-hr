import { marked } from 'marked'; // 注意这里添加了空格
const response = await fetch('/api/v1/chat', { // 修正后的规范路径
  method: 'POST',
  headers: {
    'Apikey': apiKey,  // 注意密钥格式是否正确，可能需要添加 Bearer 前缀
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: inputMessage.value })
});
import { marked } from 'marked'; // 注意这里添加了空格
const data = {
  Query: userContent,
  AppConversationID: appConversationId,
  ResponseMode: 'streaming',
  UserID: userId
  // 检查是否缺少必要参数如 AppID 等
};