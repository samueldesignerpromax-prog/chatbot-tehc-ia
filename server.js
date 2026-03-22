// server.js
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Models
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const ChatSchema = new mongoose.Schema({
  userId: String,
  messages: [{
    role: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', UserSchema);
const Chat = mongoose.model('Chat', ChatSchema);

// Middleware Auth
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Não autorizado' });
  }
};

// AI Response
function getAIResponse(message) {
  const msg = message.toLowerCase();
  
  const responses = {
    'oi': 'Olá! Sou o Samuel Tech IA. Como posso ajudar?',
    'olá': 'Olá! Sou o Samuel Tech IA. Como posso ajudar?',
    'como você está': 'Estou ótimo! Pronto para te ajudar com tecnologia!',
    'programação': 'Posso ajudar com JavaScript, Python, Node.js, React e mais!',
    'javascript': 'JavaScript é incrível! Quer aprender sobre?',
    'python': 'Python é ótimo para iniciantes e data science!',
    'react': 'React é perfeito para interfaces modernas!',
    'node': 'Node.js é poderoso para back-end!',
    'banco de dados': 'MongoDB, PostgreSQL, MySQL - qual te interessa?',
    'carreira': 'Invista em fundamentos e pratique muito!',
    'obrigado': 'Por nada! Estou aqui para ajudar!',
    'tchau': 'Até mais! Volte sempre!'
  };
  
  for (let [key, value] of Object.entries(responses)) {
    if (msg.includes(key)) return value;
  }
  
  return 'Posso ajudar com programação, frameworks, banco de dados e carreira em tecnologia. Qual sua dúvida?';
}

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao cadastrar' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.userId });
    }
    
    if (!chat) {
      chat = new Chat({ userId: req.userId, messages: [] });
    }
    
    chat.messages.push({ role: 'user', content: message });
    const aiResponse = getAIResponse(message);
    chat.messages.push({ role: 'assistant', content: aiResponse });
    
    await chat.save();
    
    res.json({ 
      message: aiResponse, 
      chatId: chat._id,
      messages: chat.messages 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
});

app.get('/api/history', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).sort('-createdAt');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

app.get('/api/chat/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat não encontrado' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar chat' });
  }
});

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samueltechia')
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(3000, () => console.log('🚀 Servidor rodando em http://localhost:3000'));
  })
  .catch(err => console.error('❌ Erro MongoDB:', err));
