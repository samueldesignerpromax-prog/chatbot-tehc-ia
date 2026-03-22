// src/controllers/chatController.js
const ChatService = require('../services/chatService');

class ChatController {
  static async sendMessage(req, res) {
    try {
      const { message, chatId } = req.body;
      const userId = req.user.id;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ 
          message: 'Mensagem inválida',
          error: 'A mensagem não pode estar vazia' 
        });
      }
      
      if (message.length > 2000) {
        return res.status(400).json({ 
          message: 'Mensagem muito longa',
          error: 'A mensagem não pode ter mais de 2000 caracteres' 
        });
      }
      
      const chat = await ChatService.saveMessage(chatId, userId, 'user', message);
      const aiResponse = await ChatService.generateAIResponse(message, chat.messages);
      const updatedChat = await ChatService.saveMessage(chat._id, userId, 'assistant', aiResponse);
      
      const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];
      
      res.status(200).json({
        message: aiResponse,
        chatId: updatedChat._id,
        timestamp: lastMessage.timestamp,
        messageId: updatedChat.messages.length - 1
      });
      
    } catch (error) {
      console.error('Erro no chatController.sendMessage:', error);
      res.status(500).json({ 
        message: 'Erro ao processar mensagem',
        error: error.message 
      });
    }
  }
  
  static async getChatHistory(req, res) {
    try {
      const userId = req.user.id;
      const { chatId } = req.params;
      
      if (chatId) {
        const chat = await ChatService.getChatById(chatId, userId);
        if (!chat) {
          return res.status(404).json({ message: 'Conversa não encontrada' });
        }
        
        return res.status(200).json({
          chatId: chat._id,
          title: chat.title,
          messages: chat.messages,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        });
      }
      
      const chats = await ChatService.getUserChats(userId);
      res.status(200).json({
        chats: chats.map(chat => ({
          chatId: chat._id,
          title: chat.title,
          lastMessage: chat.messages[chat.messages.length - 1],
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          messageCount: chat.messages.length
        }))
      });
      
    } catch (error) {
      console.error('Erro no chatController.getChatHistory:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar histórico',
        error: error.message 
      });
    }
  }
  
  static async deleteChat(req, res) {
    try {
      const userId = req.user.id;
      const { chatId } = req.params;
      
      if (!chatId) {
        return res.status(400).json({ message: 'ID da conversa é obrigatório' });
      }
      
      const deleted = await ChatService.deleteChat(chatId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Conversa não encontrada' });
      }
      
      res.status(200).json({ 
        message: 'Conversa deletada com sucesso',
        chatId 
      });
      
    } catch (error) {
      console.error('Erro no chatController.deleteChat:', error);
      res.status(500).json({ 
        message: 'Erro ao deletar conversa',
        error: error.message 
      });
    }
  }
}

module.exports = ChatController;
