// chatService.js (new file for reusable logic)
const { Chat } = require('../model/tranzitdb');

async function createMessage({ deliveryId, sender, receiver, message }) {
  const chat = await Chat.create({ deliveryId, sender, receiver, message });
  return chat;
}

async function fetchChatHistory(deliveryId) {
  const chatHistory = await Chat.find({ deliveryId })
    .populate('sender', 'name')
    .populate('receiver', 'name');
  return chatHistory;
}

module.exports = {
  createMessage,
  fetchChatHistory,
};
