# AlkisCord 🎤

A real-time communication platform built with Next.js, featuring voice chat, screen sharing, file sharing, and beautiful Discord-like UI.

![AlkisCord](https://img.shields.io/badge/AlkisCord-Real--time%20Communication-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![WebRTC](https://img.shields.io/badge/WebRTC-Peer--to--Peer-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-orange)

## ✨ Features

- 🎤 **Real-time Voice Chat** - Peer-to-peer audio communication using WebRTC
- 🖥️ **Screen Sharing** - Share your screen with other users in real-time
- 💬 **Text Chat** - Instant messaging with emoji support
- 📁 **File Sharing** - Upload and share files up to 8MB with inline preview
- 🎨 **Beautiful UI** - Discord-like interface with glassmorphism effects
- 🚀 **No Registration** - Join rooms instantly without creating accounts
- 🔒 **Temporary Rooms** - Rooms are automatically cleaned up when empty
- 🌐 **Cross-Platform** - Works on desktop and mobile browsers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alkiscord
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### For External Access (Friends on Different Networks)

1. **Install ngrok** (for easy external access)
   ```bash
   npm install -g ngrok
   ```

2. **Start the application**
   ```bash
   npm run dev
   ```

3. **In a new terminal, expose the app**
   ```bash
   ngrok http 3000
   ```

4. **Share the ngrok URL** with your friends (e.g., `https://abc123.ngrok-free.app`)

## 🎮 How to Use

### Creating a Room
1. Click "Create New Room"
2. Enter a room name and your nickname
3. Choose an avatar
4. Click "Create Room"
5. Share the room code with friends

### Joining a Room
1. Click "Join Existing Room"
2. Enter the room code and your nickname
3. Choose an avatar
4. Click "Join Room"

### Voice Chat
1. Click the microphone button in the bottom toolbar
2. Grant microphone permissions when prompted
3. Start talking - your voice will be transmitted to other users
4. Click the microphone button again to stop

### Screen Sharing
1. Click the screen share button in the bottom toolbar
2. Select the screen/window to share
3. Your screen will be visible to other users
4. Click the button again to stop sharing

### File Sharing
1. Click the paperclip button in the bottom toolbar
2. Select a file (up to 8MB)
3. The file will be uploaded and shared with all users
4. Images and videos have inline preview

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism effects
- **Real-time Communication**: Socket.IO
- **Voice/Video**: WebRTC with STUN servers
- **State Management**: Zustand
- **File Upload**: Custom API with file type detection
- **UI Components**: Custom components with Lucide icons

## 📁 Project Structure

```
alkiscord/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── rooms/         # Room management
│   │   │   ├── socket/        # Socket.IO integration
│   │   │   └── upload/        # File upload handling
│   │   ├── room/[id]/         # Dynamic room pages
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── room/             # Room-specific components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utility libraries
│   │   ├── socket.ts         # Socket.IO client
│   │   ├── webrtc.ts         # WebRTC manager
│   │   └── utils.ts          # Helper functions
│   ├── stores/               # State management
│   └── types/                # TypeScript definitions
├── public/                   # Static assets
├── server.js                 # Custom server with Socket.IO
└── package.json             # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for custom configuration:

```env
# Optional: Custom port (default: 3000)
PORT=3000

# Optional: Custom hostname (default: localhost)
HOSTNAME=localhost
```

### WebRTC Configuration

The WebRTC implementation uses Google's STUN servers by default. You can modify the STUN servers in `src/lib/webrtc.ts`:

```typescript
private iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Add your own STUN/TURN servers here
]
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

3. **Configure Custom Server**
   - Vercel automatically handles the custom server setup
   - Your app will be available at `https://your-app.vercel.app`

### Deploy to Other Platforms

The app can be deployed to any platform that supports Node.js:
- Railway
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Voice Chat Not Working
- Ensure microphone permissions are granted
- Check that both users are using HTTPS (required for WebRTC)
- Verify that STUN servers are accessible

### External Access Issues
- Use ngrok for easy external access during development
- Ensure CORS is properly configured (already set up in this project)
- Check firewall settings if using port forwarding

### File Upload Issues
- Maximum file size is 8MB
- Supported formats: images, videos, documents
- Check available disk space

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Real-time communication powered by [Socket.IO](https://socket.io/)
- WebRTC implementation for peer-to-peer connections
- UI inspired by Discord's beautiful design
- Icons by [Lucide](https://lucide.dev/)

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Check the browser console for error messages

---

**Made with ❤️ for real-time communication**
