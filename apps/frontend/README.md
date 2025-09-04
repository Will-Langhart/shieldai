# Shield AI Frontend

A modern React frontend application for Shield AI, built with TypeScript, Vite, and Tailwind CSS.

## Architecture

The frontend is organized using a feature-based architecture with clear separation of concerns:

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Layout components (Header, Footer)
│   ├── features/              # Feature-specific components
│   │   ├── bible/            # Bible study components
│   │   ├── chat/             # Chat interface components
│   │   └── churches/         # Church finder components
│   └── common/               # Common shared components
├── pages/                    # Page components
├── hooks/                    # Custom React hooks
├── services/                 # API service layer
├── types/                    # TypeScript type definitions
├── contexts/                 # React context providers
├── utils/                    # Utility functions
└── styles/                   # CSS and styling
```

## Features

### Bible Study
- **Bible Search**: Search through scripture with advanced filtering
- **Bible Reader**: Read and navigate through Bible books and chapters
- **Verse Lookup**: Find specific verses by reference

### AI Chat
- **Conversational AI**: Chat with an AI assistant trained on Christian content
- **Conversation History**: Save and manage chat conversations
- **Context Awareness**: AI understands biblical context and references

### Church Finder
- **Location Search**: Find churches near you
- **Denomination Filtering**: Filter by denomination or faith tradition
- **Service Times**: View worship and service schedules
- **Reviews and Ratings**: Read and leave reviews for churches

## Technology Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **Lucide React**: Beautiful icon library

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Create a `.env.local` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Shield AI
VITE_APP_VERSION=1.0.0
```

## Component Architecture

### UI Components
Reusable components in `components/ui/`:
- `Button`: Customizable button with variants and states
- `Input`: Form input with validation and error states
- `Modal`: Accessible modal dialog component

### Feature Components
Feature-specific components organized by domain:
- **Bible**: `BibleSearch`, `BibleReader`
- **Chat**: `ChatInterface`, `MessageList`
- **Churches**: `ChurchCard`, `ChurchMap`

### Layout Components
- `Header`: Navigation and branding
- `Footer`: Links and additional information

## Service Layer

The service layer provides a clean abstraction over API calls:

```typescript
// Bible service
import { bibleService } from './services'

const verses = await bibleService.getVerses('John', 3, 16)
const searchResults = await bibleService.searchBible('love')

// Chat service
import { chatService } from './services'

const message = await chatService.sendMessage('Hello')
const conversations = await chatService.getConversations()

// Church service
import { churchService } from './services'

const churches = await churchService.searchChurches({
  location: 'New York',
  radius: 10
})
```

## State Management

The application uses React Context for global state management:

- **AuthContext**: User authentication and session management
- **ThemeContext**: Dark/light theme switching

## Styling

### Tailwind CSS
The application uses Tailwind CSS for styling with custom configuration:

- Custom color palette
- Responsive design utilities
- Dark mode support
- Custom component classes

### CSS Organization
- `globals.css`: Base styles and CSS variables
- `components.css`: Component-specific styles
- `utilities.css`: Custom utility classes

## Type Safety

Comprehensive TypeScript types are organized by domain:

- `types/api.ts`: API response types
- `types/bible.ts`: Bible-related types
- `types/chat.ts`: Chat and conversation types
- `types/church.ts`: Church and location types

## Development

### Code Style
- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode enabled

### Testing
```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building
```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Type checking
npm run type-check
```

## Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Follow the established code structure
2. Use TypeScript for all new code
3. Write tests for new features
4. Follow the component naming conventions
5. Update documentation for new features

## Scriptural Foundation

This application is built on the foundation of God's Word, as stated in **Psalm 119:105**: *"Your word is a lamp for my feet, a light on my path."* Every feature is designed to help users grow in their faith and understanding of Scripture.