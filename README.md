# 🛡️ Shield AI

An AI-powered apologetics companion designed to help believers, seekers, and faith leaders explore and defend the Christian worldview. Built with a sleek and minimalist interface inspired by Grok, Shield AI provides conversational, context-rich answers to challenging theological, philosophical, and cultural questions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Features

- **Dark Mode Interface**: Clean, distraction-free design
- **Fast/Accurate Mode Toggle**: Choose between quick responses or detailed analysis
- **Voice Input**: Microphone support for hands-free interaction
- **Real-time Chat**: Interactive conversation with AI
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

## 📁 Project Structure

```
shieldai/
├── components/
│   ├── Header.tsx          # Navigation and branding
│   └── InputBar.tsx        # Main input interface
├── pages/
│   ├── _app.tsx           # App wrapper
│   ├── _document.tsx      # HTML structure
│   └── index.tsx          # Main page
├── styles/
│   └── globals.css        # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎨 Design System

### Colors
- **Background**: `#000000` (Shield Black)
- **Text**: `#FFFFFF` (Shield White)  
- **Accent**: `#46A1E2` (Shield Blue)
- **Gray**: `#1a1a1a` (Shield Gray)
- **Light Gray**: `#2a2a2a` (Shield Light Gray)

### Typography
- **Font Family**: Inter
- **Weights**: 300, 400, 500, 600, 700

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components

1. Create component in `components/` directory
2. Import and use in `pages/index.tsx`
3. Follow existing naming conventions

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Shield AI** - Empowering believers with AI-powered apologetics insights.