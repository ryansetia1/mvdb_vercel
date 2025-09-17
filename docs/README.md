# MVDB Documentation Index

## 📚 Documentation Overview

This directory contains comprehensive documentation for the MVDB project, including technical specifications, implementation guides, and troubleshooting resources.

## 🔧 Technical Documentation

### Core Features
- **[Lineup System](./lineup-feature.md)** - Complete lineup management system documentation
- **[Lineup Data Implementation](./lineup-data-implementation.md)** - Technical details of lineup data structure
- **[Lineup Version System](./lineup-version-system.md)** - Version management for lineups

### Recent Fixes & Updates
- **[Lineup Member Removal Fix](./LINEUP_MEMBER_REMOVAL_FIX.md)** - Complete documentation of lineup member removal bug fix
- **[Technical Summary: Lineup Fix](./TECHNICAL_SUMMARY_LINEUP_FIX.md)** - Quick technical reference for developers
- **[Root Cause Analysis](./LINEUP_REMOVAL_ROOT_CAUSE_ANALYSIS.md)** - Deep dive analysis of the lineup removal issue

### System Architecture
- **[Server Routing Architecture](./server-routing-architecture.md)** - Backend routing and API structure
- **[Version Systems Hierarchy](./version-systems-hierarchy.md)** - System versioning and hierarchy
- **[Database Schema](./group-photobooks-linking/database-schema.md)** - Database structure and relationships

### Group & Generation Management
- **[Group Photobooks Linking](./group-photobooks-linking/)** - Group-photobook relationship system
- **[Group Management](./group-management.md)** - Group creation and management features

## 🐛 Troubleshooting

### Known Issues & Solutions
- **Lineup Member Removal** - Fixed in latest deployment
  - Issue: Members not removed from lineup despite UI interaction
  - Solution: Server logic fix + consistent API pattern
  - Status: ✅ Resolved

### Debugging Guides
- Check server logs for `lineupData` processing
- Verify API responses contain expected data structure
- Test with both frontend and backend logging enabled

## 🚀 Deployment & Maintenance

### Recent Deployments
- **Server (Supabase Functions)**: `make-server-e0516fcf` - Lineup removal fix deployed
- **Frontend**: Ready for deployment with lineup fixes

### Maintenance Notes
- Monitor lineup data processing in server logs
- Maintain consistency between generation and lineup removal patterns
- Test data removal operations thoroughly

## 📖 Quick Reference

### Key Files Modified (Latest Fix)
```
Backend:
- supabase/functions/make-server-e0516fcf/masterDataApi.ts
- supabase/functions/make-server-e0516fcf/updateMasterDataWithSync.ts

Frontend:
- src/utils/masterDataApi.ts
- src/components/LineupManagement.tsx
```

### API Functions
- `removeActressFromLineup()` - New function for consistent lineup removal
- `removeActressFromGeneration()` - Existing function (working correctly)

## 🔄 Version History

### Latest Updates
- **v1.0** (2025-09-17): Lineup member removal fix
  - Fixed server-side lineupData processing
  - Added consistent API patterns
  - Improved error handling and logging

---

*For detailed information, refer to individual documentation files listed above.*