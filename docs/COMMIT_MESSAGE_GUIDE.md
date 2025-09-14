# 📝 Commit Message Guide

## 🎯 **Purpose**

Dokumentasi ini menjelaskan format commit message yang digunakan untuk tracking perubahan dan fixes yang dilakukan pada sistem.

## 📋 **Format Commit Message**

### **Standard Format**
```
type(scope): description

[optional body]

[optional footer]
```

### **Types**
- **fix**: Bug fixes
- **feat**: New features
- **docs**: Documentation changes
- **style**: Code style changes
- **refactor**: Code refactoring
- **test**: Test changes
- **chore**: Maintenance tasks

### **Scopes**
- **endpoint**: Endpoint-related changes
- **auth**: Authentication changes
- **ui**: User interface changes
- **api**: API changes
- **db**: Database changes
- **config**: Configuration changes

## 🔧 **Recent Fixes Examples**

### **Endpoint Duplication Fix**
```
fix(endpoint): resolve photobooks and favorites endpoint duplication

- Separate stats endpoints to /stats/photobooks and /stats/favorites
- Fix Hono router "first match wins" issue
- Update frontend URLs to use correct server ID
- Deploy function to Supabase

Fixes: Photobooks and favorites not displaying despite data in database
```

### **Frontend URL Fix**
```
fix(api): correct frontend endpoint URLs

- Update PhotobooksContent.tsx to use make-server-e0516fcf
- Update CoverTemplateSelector.tsx to use correct KV endpoint
- Update BulkAssignmentManager.tsx to use correct health endpoint

Fixes: 404 errors on frontend API calls
```

### **Documentation Update**
```
docs: add comprehensive documentation for endpoint management

- Add Endpoint Duplication Fix documentation
- Add Troubleshooting Guide for common issues
- Add Development Guidelines for best practices
- Add Quick Reference for emergency fixes
- Update README with new documentation links
- Update CHANGELOG with recent fixes

Prevents: Future endpoint duplication issues
```

## 📚 **Documentation Commits**

### **New Documentation**
```
docs: add [documentation-name] documentation

- Add [description] documentation
- Include [key sections] sections
- Cover [topics] topics
- Provide [examples] examples

Purpose: [why this documentation is needed]
```

### **Update Documentation**
```
docs: update [documentation-name] documentation

- Update [specific sections] sections
- Add [new information] information
- Fix [incorrect information] information
- Improve [clarity/accuracy] clarity

Reason: [why update is needed]
```

## 🚀 **Deploy Commits**

### **Function Deploy**
```
deploy: deploy make-server-e0516fcf function

- Deploy updated endpoint configuration
- Apply endpoint duplication fixes
- Update authentication logic
- Test all endpoints

Environment: Supabase Edge Functions
```

### **Frontend Deploy**
```
deploy: deploy frontend with endpoint fixes

- Deploy updated frontend code
- Apply URL corrections
- Update API client configurations
- Test all frontend-backend connections

Environment: Vercel
```

## 🔍 **Testing Commits**

### **Endpoint Testing**
```
test: test endpoint functionality

- Test photobooks endpoint (public access)
- Test favorites endpoint (user authentication)
- Test stats endpoints (admin authentication)
- Verify all endpoints return correct data

Results: All endpoints working correctly
```

### **Integration Testing**
```
test: integration test for photobooks and favorites

- Test complete photobooks flow
- Test complete favorites flow
- Test authentication scenarios
- Test error handling

Results: All flows working correctly
```

## 📊 **Changelog Commits**

### **Update Changelog**
```
chore: update CHANGELOG with recent fixes

- Add endpoint duplication fixes
- Add authentication improvements
- Add documentation updates
- Add performance improvements

Version: [version-number]
```

## 🎯 **Best Practices**

### **Commit Message Guidelines**
1. **Use present tense**: "fix" not "fixed"
2. **Use imperative mood**: "add" not "added"
3. **Keep first line under 50 characters**
4. **Capitalize first letter**
5. **No period at end of first line**
6. **Use body for detailed explanation**

### **Commit Frequency**
- **Small commits**: One logical change per commit
- **Atomic commits**: Each commit should be complete
- **Clear purpose**: Each commit should have clear purpose
- **Testable**: Each commit should be testable

### **Commit History**
- **Linear history**: Avoid merge commits when possible
- **Clear progression**: Each commit should build on previous
- **Reversible**: Each commit should be reversible
- **Documented**: Each commit should be documented

## 📝 **Examples**

### **Good Commit Messages**
```
fix(endpoint): resolve photobooks endpoint duplication

Separate stats endpoint to /stats/photobooks to prevent
Hono router "first match wins" issue that was causing
public photobooks endpoint to never be called.

Fixes: Photobooks not displaying despite data in database
```

```
docs: add troubleshooting guide for common issues

Add comprehensive troubleshooting guide covering:
- Data not displaying issues
- Authentication errors
- Endpoint not found errors
- KV store issues

Includes debugging commands and solutions for each issue.
```

### **Bad Commit Messages**
```
fix stuff
```
```
Fixed photobooks
```
```
Update
```
```
WIP
```

## 🔄 **Commit Workflow**

### **Development Process**
1. **Create feature branch**: `git checkout -b feature/endpoint-fix`
2. **Make changes**: Implement fixes
3. **Test changes**: Verify fixes work
4. **Commit changes**: Use proper commit message
5. **Push branch**: `git push origin feature/endpoint-fix`
6. **Create PR**: With detailed description
7. **Review**: Code review and testing
8. **Merge**: Merge to main branch

### **Hotfix Process**
1. **Create hotfix branch**: `git checkout -b hotfix/endpoint-duplication`
2. **Implement fix**: Apply emergency fix
3. **Test fix**: Verify fix works
4. **Commit fix**: Use proper commit message
5. **Deploy fix**: Deploy to production
6. **Create PR**: For review and documentation

## 📚 **Resources**

### **Commit Message Standards**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Versioning](https://semver.org/)

### **Git Best Practices**
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [GitLab Flow](https://docs.gitlab.com/ee/topics/gitlab_flow.html)

---

**Commit Message Guide** - Last Updated: September 14, 2025
**Version**: 1.0.0
**Status**: ✅ Active
