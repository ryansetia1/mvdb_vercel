# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Smart alias merging system for R18 data
- AI-powered Japanese to English translation
- Context-aware movie title translation
- Advanced Japanese name normalization
- Client-side caching for improved performance
- Comprehensive error handling and recovery
- **NEW**: Comprehensive documentation for endpoint management
- **NEW**: Troubleshooting guide for common issues
- **NEW**: Development guidelines for preventing endpoint duplication
- **NEW**: Photobook cover image click-to-zoom functionality
- **NEW**: Simplified photobook actress badge system documentation

### Changed
- Improved data parsing accuracy
- Enhanced UI/UX with modern design
- Optimized database queries
- Better security for API key management
- **IMPROVED**: Endpoint organization and naming conventions
- **IMPROVED**: Authentication strategy consistency
- **IMPROVED**: Photobook actress badge display system - simplified logic for consistent individual badges

### Fixed
- Critical bug where aliases wouldn't merge with existing data
- Case-insensitive duplicate detection
- Data preservation during updates
- Performance issues with large datasets
- **CRITICAL**: Fixed photobooks not displaying due to endpoint duplication
- **CRITICAL**: Fixed favorites not displaying due to endpoint duplication
- **FIXED**: Endpoint URL inconsistencies between frontend and backend
- **FIXED**: Authentication issues with public endpoints
- **FIXED**: Photobook actress badges displaying inconsistently (mixed individual and combined badges)
- **FIXED**: Photobook cover image click functionality not working due to pointer events conflicts

## [1.0.0] - 2024-09-14

### Added
- Initial release of MVDB
- Movie database management system
- R18.dev data parsing integration
- JavDB parser integration
- Supabase backend integration
- React frontend with TypeScript
- Tailwind CSS styling
- Vercel deployment configuration

### Features
- Movie data parsing and management
- Actor/actress profile management
- Series and label management
- Image search and management
- Backup and restore functionality
- User authentication and authorization
- Responsive design for mobile and desktop

## [0.9.0] - 2024-09-01

### Added
- Basic movie parsing functionality
- Simple data management interface
- Initial database schema
- Basic authentication system

### Changed
- Improved data validation
- Enhanced error handling
- Better user interface

## [0.8.0] - 2024-08-15

### Added
- Initial project setup
- Basic React application structure
- Supabase integration
- TypeScript configuration
- Vite build system

### Changed
- Project architecture improvements
- Code organization and structure
- Development workflow optimization

---

## Legend

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
