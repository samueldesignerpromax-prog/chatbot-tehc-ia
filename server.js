// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const chatRoutes = require('./src/routes/chatRoutes');
const authRoutes = require('./src/routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Samuel Tech IA is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo deu errado!', error: err.message });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/samueltechia', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Conectado ao MongoDB com sucesso!');
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
})
.catch((err) => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

module.exports = app;
