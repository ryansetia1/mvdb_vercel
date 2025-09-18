# 🎬 MVDB - Movie Database Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

A comprehensive movie database management system with advanced parsing capabilities, AI-powered translation, and smart data processing for Japanese adult content.

## 🌟 Features

### 🎭 **Smart Data Processing**
- ✅ **Intelligent Alias Merging**: Automatically merges new aliases with existing ones
- ✅ **Duplicate Detection**: Case-insensitive duplicate removal
- ✅ **R18 Data Integration**: Seamless parsing and merging of R18.dev data
- ✅ **Data Preservation**: No loss of existing data during updates
- ✅ **Japanese Name Normalization**: Advanced Japanese name processing

### 🤖 **AI-Powered Translation**
- ✅ **Japanese to English Translation**: Context-aware translation using DeepSeek
- ✅ **Movie Title Translation**: Intelligent title translation with context
- ✅ **Actor/Actress Name Translation**: Professional name translation
- ✅ **Romaji Conversion**: Automatic romaji conversion
- ✅ **Series Name Translation**: Contextual series translation

### 📊 **Advanced Parsing**
- ✅ **Dual Parser System**: JavDB and R18.dev parser integration
- ✅ **R18 JSON Format Support**: Native R18.dev data format support
- ✅ **Smart Matching**: Advanced actor/actress matching algorithms
- ✅ **Data Validation**: Comprehensive data validation and cleanup

### 🎨 **Modern UI/UX**
- ✅ **Responsive Design**: Mobile-first responsive design
- ✅ **Dark/Light Theme**: Automatic theme switching
- ✅ **Loading States**: Beautiful shimmer effects and loading indicators
- ✅ **Interactive Components**: Smooth animations and transitions
- ✅ **Accessibility**: WCAG compliant accessibility features

### 🔒 **Security & Performance**
- ✅ **Secure API Key Management**: Supabase secrets integration
- ✅ **Client-Side Caching**: LocalStorage caching for performance
- ✅ **Optimized Queries**: Efficient database queries
- ✅ **Error Handling**: Comprehensive error handling and recovery

## 📚 Documentation

### **🔧 Recent Fixes & Updates**
- ✅ **[Endpoint Duplication Fix](./docs/ENDPOINT_DUPLICATION_FIX.md)** - Fixed photobooks and favorites not displaying
- ✅ **[Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions
- ✅ **[Photobook Actress Badge System](./docs/photobook-actress-badge-system.md)** - Simplified badge display system
- ✅ **[Development Guidelines](./docs/DEVELOPMENT_GUIDELINES.md)** - Best practices for endpoint management
- ✅ **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Emergency fixes and common commands

### **📖 Complete Documentation**
- [Comprehensive Documentation](./src/COMPREHENSIVE_DOCUMENTATION.md)
- [API Guidelines](./src/docs/api-guidelines.md)
- [Data Merge Feature](./src/docs/data-merge-feature.md)
- [Gallery Filtering System](./src/docs/gallery-filtering-system.md)
- [Template Placeholders](./src/docs/template-placeholders.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mvdb.git
   cd mvdb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔑 API Key Setup

### Quick Setup (2 minutes)
1. Get API key from [OpenRouter.ai](https://openrouter.ai/)
2. Login to the application
3. Go to "Setup API Key" tab
4. Save your API key to Supabase secrets
5. Test translation in "DeepSeek Test" tab

### Features Requiring API Key
- Japanese to English translation
- Movie title translation with context
- Actor/Actress name translation
- Romaji conversion
- Series name translation

## 📚 Documentation

- [**📖 Documentation Index**](./docs/DOCUMENTATION_INDEX.md) - Complete documentation index
- [**Quick API Key Setup**](./docs/QUICK_API_KEY_SETUP.md) - 2-minute setup guide
- [**Supabase Secrets Guide**](./docs/SUPABASE_SECRETS_API_KEY_GUIDE.md) - Complete technical documentation
- [**Security Guidelines**](./docs/SECURITY_GUIDELINES.md) - Security best practices
- [**Deployment Guide**](./docs/DEPLOYMENT.md) - Production deployment
- [**Alias Merging Feature**](./docs/ALIAS_MERGING_FEATURE.md) - Smart alias merging for R18 data
- [**Alias System Summary**](./docs/ALIAS_SYSTEM_SUMMARY.md) - Complete overview of alias system

## 🛠️ Development

### Project Structure
```
mvdb/
├── src/
│   ├── components/          # React components
│   ├── utils/              # Utility functions
│   ├── supabase/           # Supabase functions
│   └── types/              # TypeScript type definitions
├── docs/                   # Documentation
├── public/                 # Static assets
└── supabase/               # Supabase configuration
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Variables
Create `.env.local` for local development:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

## 🔒 Security

- ✅ No API keys in version control
- ✅ Encrypted storage in Supabase
- ✅ Token-based authentication
- ✅ Environment variable fallback
- ✅ Secure API key management

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## 📊 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Modules
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI Translation**: OpenRouter API (DeepSeek)
- **Deployment**: Vercel
- **Version Control**: Git

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure accessibility compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter.ai](https://openrouter.ai/) for AI translation services
- [Supabase](https://supabase.com/) for backend infrastructure
- [Vercel](https://vercel.com/) for deployment platform
- [Tailwind CSS](https://tailwindcss.com/) for styling framework

## 📞 Support

- 📧 Email: support@mvdb.com
- 💬 Discord: [Join our community](https://discord.gg/mvdb)
- 📖 Documentation: [docs/](./docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/mvdb/issues)

## 🔄 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed changelog.

### Recent Updates
- ✅ **Alias Merging System**: Smart alias merging for R18 data
- ✅ **AI Translation**: Context-aware Japanese translation
- ✅ **Performance Optimization**: Client-side caching and optimization
- ✅ **Security Enhancement**: Secure API key management

---

<div align="center">
  <p>Made with ❤️ by the MVDB Team</p>
  <p>
    <a href="#-mvdb---movie-database-management-system">⬆️ Back to top</a>
  </p>
</div>
