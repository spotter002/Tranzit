const http = require('http');
const socketio = require('socket.io');
const app = require('./app'); // if your express app is in app.js as a module

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: '*', // or restrict domains
    methods: ['GET', 'POST']
  }
});

// Socket.IO logic
const { createMessage, fetchChatHistory } = require('./path/to/chatService');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Receive a new chat message from client
  socket.on('sendMessage', async (data) => {
    /*
      data = {
        deliveryId,
        sender,
        receiver,
        message
      }
    */

    try {
      const savedMessage = await createMessage(data);
      
      // Broadcast the new message to relevant clients (could be everyone or room-based)
      io.emit('receiveMessage', savedMessage); // or socket.to(room).emit if you want rooms
    } catch (err) {
      console.error('Error saving chat message:', err);
      socket.emit('errorMessage', 'Failed to send message');
    }
  });

  // Client requests chat history for a delivery
  socket.on('getChat', async (deliveryId) => {
    try {
      const chatHistory = await fetchChatHistory(deliveryId);
      socket.emit('chatHistory', chatHistory);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      socket.emit('errorMessage', 'Failed to fetch chat history');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


const PORT = 3005;

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
