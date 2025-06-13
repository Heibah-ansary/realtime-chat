const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// ==== Setup Express Server ====
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
// ==== Serve Static HTML/React ====
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Real-time Chat</title>
      <meta charset="UTF-8" />
      <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
      <style>
        body { font-family: Arial; margin: 20px; }
        #chatBox { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin-bottom: 10px; }
        input { width: 80%; padding: 5px; }
        button { padding: 5px 10px; }
      </style>
    </head>
    <body>
      <h2>🟢 Real-time Chat</h2>
      <div id="root"></div>

      <script type="text/babel">
        const { useState, useEffect, useRef } = React;

        function App() {
          const [messages, setMessages] = useState([]);
          const [input, setInput] = useState('');
          const ws = useRef(null);
          const chatRef = useRef(null);

          useEffect(() => {
            ws.current = new WebSocket('ws://' + window.location.host);

            ws.current.onmessage = (event) => {
              setMessages(prev => [...prev, event.data]);
            };

            return () => ws.current.close();
          }, []);

          useEffect(() => {
            if (chatRef.current) {
              chatRef.current.scrollTop = chatRef.current.scrollHeight;
            }
          }, [messages]);

          const sendMessage = () => {
            if (input.trim()) {
              ws.current.send(input);
              setMessages(prev => [...prev, "You: " + input]);
              setInput('');
            }
          };

          return (
            <div>
              <div id="chatBox" ref={chatRef}>
                {messages.map((msg, idx) => <div key={idx}>{msg}</div>)}
              </div>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
      </script>
    </body>
    </html>
  `);
});

// ==== WebSocket Logic ====
wss.on('connection', (ws) => {
  console.log('🔌 Client connected');

  ws.on('message', (message) => {
    console.log('📨 Received:', message);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client !== ws) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => console.log('❌ Client disconnected'));
});

// ==== Start Server ====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
