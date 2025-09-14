# Contributing to MVDB

Thank you for your interest in contributing to MVDB! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/yourusername/mvdb/issues) page
- Check existing issues before creating a new one
- Provide detailed information about the bug or feature request
- Include steps to reproduce for bugs

### Suggesting Features
- Use the [GitHub Discussions](https://github.com/yourusername/mvdb/discussions) for feature requests
- Describe the feature and its benefits
- Consider the impact on existing functionality
- Provide use cases and examples

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📋 Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code structure and patterns

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use proper error handling

### React Best Practices
- Use functional components with hooks
- Implement proper state management
- Use proper prop types and interfaces
- Follow React performance best practices

### Testing
- Write unit tests for utility functions
- Add integration tests for critical features
- Test error scenarios and edge cases
- Ensure accessibility compliance

### Documentation
- Update README.md for significant changes
- Add JSDoc comments for functions and components
- Update API documentation
- Include examples and usage instructions

## 🏗️ Project Structure

```
mvdb/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   └── constants/          # Application constants
├── docs/                   # Documentation
├── public/                 # Static assets
└── supabase/               # Supabase configuration
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Supabase account

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env.local`
4. Configure your environment variables
5. Start development server: `npm run dev`

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

## 🧪 Testing

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Test Structure
- Unit tests for utility functions
- Integration tests for API calls
- Component tests for React components
- E2E tests for critical user flows

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

### Examples
```
feat(parser): add R18 data parsing support
fix(alias): resolve alias merging bug
docs(readme): update installation instructions
```

## 🔍 Code Review Process

### Pull Request Guidelines
- Provide a clear description of changes
- Include screenshots for UI changes
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Follow the code style guidelines

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes without migration guide
- [ ] Performance impact is considered
- [ ] Security implications are reviewed

## 🐛 Bug Reports

### Information to Include
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, browser, version)
- Screenshots or error messages

### Bug Report Template
```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows, macOS, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

## 🚀 Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- MAJOR: Incompatible API changes
- MINOR: Backward-compatible functionality additions
- PATCH: Backward-compatible bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Changelog is updated
- [ ] Version number is incremented
- [ ] Release notes are prepared

## 📞 Getting Help

- 💬 [GitHub Discussions](https://github.com/yourusername/mvdb/discussions)
- 📧 Email: contributors@mvdb.com
- 📖 [Documentation](./docs/)
- 🐛 [Issues](https://github.com/yourusername/mvdb/issues)

## 📄 License

By contributing to MVDB, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MVDB! 🎉
