# Deployment & Maintenance Guide

## 📋 Overview

Dokumen ini menjelaskan proses deployment dan maintenance untuk Supabase Edge Functions, khususnya untuk perbaikan LineupData dan sistem master data.

## 🚀 Deployment Process

### 1. Pre-Deployment Checklist

#### Code Review
- [ ] All changes reviewed and tested locally
- [ ] No linter errors or warnings
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Logging added for debugging

#### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases handled
- [ ] Performance impact assessed

#### Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] Troubleshooting guides updated
- [ ] Deployment notes documented

### 2. Deployment Commands

#### Supabase Function Deployment
```bash
# Deploy specific function
npx supabase functions deploy make-server-e0516fcf

# Deploy with verbose output
npx supabase functions deploy make-server-e0516fcf --debug

# Deploy all functions
npx supabase functions deploy
```

#### Deployment Verification
```bash
# Check deployment status
npx supabase functions list

# View function logs
npx supabase functions logs make-server-e0516fcf

# Test function endpoint
curl -X POST "https://your-project.supabase.co/functions/v1/make-server-e0516fcf/master/actress/test-id/extended/sync" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Actress", "lineupData": {"test-lineup": {"alias": "Test"}}}'
```

### 3. Post-Deployment Verification

#### Function Health Check
```bash
# Check function status
npx supabase functions list

# Expected output:
# make-server-e0516fcf    Active    deployed
```

#### Log Monitoring
```bash
# Monitor function logs
npx supabase functions logs make-server-e0516fcf --follow

# Expected logs:
# Server: Updating extended master data with sync for type: actress, id: test-id
# Server: lineupData received: {"test-lineup": {"alias": "Test"}}
# Server: Processed lineupData: {"test-lineup": {"alias": "Test"}}
```

#### API Testing
```javascript
// Test lineupData functionality
const testData = {
  name: 'Test Actress',
  lineupData: {
    'test-lineup-id': {
      alias: 'Test Alias',
      profilePicture: 'https://example.com/photo.jpg'
    }
  }
}

const response = await masterDataApi.updateExtended('actress', 'test-id', testData)
console.log('Response lineupData:', response.data.lineupData)
// Expected: {"test-lineup-id": {"alias": "Test Alias", "profilePicture": "https://example.com/photo.jpg"}}
```

## 🔧 Maintenance Procedures

### 1. Regular Maintenance Tasks

#### Weekly Tasks
- [ ] Check function logs for errors
- [ ] Monitor performance metrics
- [ ] Review error rates
- [ ] Check storage usage

#### Monthly Tasks
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Performance optimization review
- [ ] Documentation updates

#### Quarterly Tasks
- [ ] Architecture review
- [ ] Code refactoring
- [ ] Performance testing
- [ ] Disaster recovery testing

### 2. Monitoring & Alerting

#### Key Metrics to Monitor
```typescript
// Function execution metrics
- Execution count
- Execution duration
- Error rate
- Memory usage
- Cold start frequency

// Business metrics
- API response times
- Data processing success rate
- User activity patterns
- Storage growth rate
```

#### Log Analysis
```bash
# Search for errors
npx supabase functions logs make-server-e0516fcf | grep "ERROR"

# Search for specific patterns
npx supabase functions logs make-server-e0516fcf | grep "lineupData"

# Monitor performance
npx supabase functions logs make-server-e0516fcf | grep "duration"
```

### 3. Troubleshooting Common Issues

#### Issue 1: Function Deployment Failure
**Symptoms**:
- Deployment command fails
- Function not available
- 404 errors on API calls

**Solutions**:
```bash
# Check Supabase CLI version
npx supabase --version

# Verify project connection
npx supabase status

# Check function syntax
npx supabase functions serve make-server-e0516fcf

# Redeploy with debug
npx supabase functions deploy make-server-e0516fcf --debug
```

#### Issue 2: Function Timeout
**Symptoms**:
- Requests timing out
- 504 Gateway Timeout errors
- Slow response times

**Solutions**:
- Optimize data processing logic
- Implement request batching
- Add caching mechanisms
- Review database queries

#### Issue 3: Memory Issues
**Symptoms**:
- Function crashes
- Out of memory errors
- Performance degradation

**Solutions**:
- Optimize data structures
- Implement data pagination
- Add memory monitoring
- Review data processing logic

## 🔄 Update Procedures

### 1. Minor Updates (Bug Fixes)

#### Process:
1. **Create Feature Branch**
   ```bash
   git checkout -b fix/lineup-data-bug
   ```

2. **Make Changes**
   - Fix the bug
   - Add tests
   - Update documentation

3. **Test Locally**
   ```bash
   npx supabase functions serve make-server-e0516fcf
   # Test the fix
   ```

4. **Deploy**
   ```bash
   npx supabase functions deploy make-server-e0516fcf
   ```

5. **Verify**
   - Test in production
   - Monitor logs
   - Confirm fix works

### 2. Major Updates (New Features)

#### Process:
1. **Planning Phase**
   - Define requirements
   - Design architecture
   - Plan testing strategy

2. **Development Phase**
   - Implement feature
   - Add comprehensive tests
   - Update documentation

3. **Testing Phase**
   - Unit testing
   - Integration testing
   - Performance testing
   - User acceptance testing

4. **Deployment Phase**
   - Staging deployment
   - Production deployment
   - Monitoring and verification

5. **Post-Deployment**
   - Monitor performance
   - Gather feedback
   - Address issues
   - Document lessons learned

### 3. Emergency Updates (Critical Fixes)

#### Process:
1. **Immediate Assessment**
   - Identify the issue
   - Assess impact
   - Determine urgency

2. **Quick Fix**
   - Implement minimal fix
   - Test quickly
   - Deploy immediately

3. **Follow-up**
   - Monitor results
   - Implement proper fix
   - Update documentation
   - Conduct post-mortem

## 📊 Performance Monitoring

### 1. Key Performance Indicators (KPIs)

#### Function Performance
```typescript
// Execution metrics
- Average execution time: < 2 seconds
- Error rate: < 1%
- Memory usage: < 128MB
- Cold start frequency: < 10%

// Business metrics
- API response time: < 500ms
- Data processing success rate: > 99%
- User satisfaction: > 95%
```

#### Monitoring Tools
```bash
# Supabase Dashboard
- Function metrics
- Error logs
- Performance graphs

# Custom monitoring
- Application logs
- Business metrics
- User feedback
```

### 2. Performance Optimization

#### Code Optimization
```typescript
// Efficient data processing
const processedData = data
  .filter(item => item.isValid)
  .map(item => transformItem(item))
  .reduce((acc, item) => ({ ...acc, [item.id]: item }), {})

// Memory-efficient operations
const result = new Map()
for (const item of data) {
  result.set(item.id, processItem(item))
}
```

#### Caching Strategies
```typescript
// Response caching
const cacheKey = `actress_${id}_${timestamp}`
const cachedData = await kv.get(cacheKey)
if (cachedData) {
  return JSON.parse(cachedData)
}

// Process data
const result = await processData(data)
await kv.set(cacheKey, JSON.stringify(result), { ttl: 3600 })
```

## 🛡️ Security & Compliance

### 1. Security Best Practices

#### Authentication
```typescript
// Verify access token
const accessToken = c.req.header('Authorization')?.split(' ')[1]
const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

if (!user?.id || authError) {
  return c.json({ error: 'Unauthorized' }, 401)
}
```

#### Input Validation
```typescript
// Validate all inputs
if (!name?.trim()) {
  return c.json({ error: 'Name is required' }, 400)
}

if (!id || !isValidId(id)) {
  return c.json({ error: 'Invalid ID format' }, 400)
}
```

#### Data Sanitization
```typescript
// Sanitize user input
const sanitizedName = name.trim().replace(/[<>]/g, '')
const sanitizedAlias = alias?.trim().replace(/[<>]/g, '') || undefined
```

### 2. Compliance Requirements

#### Data Privacy
- Implement data encryption
- Follow GDPR guidelines
- Implement data retention policies
- Provide data deletion capabilities

#### Audit Logging
```typescript
// Log all data modifications
console.log('Data modification:', {
  userId: user.id,
  action: 'update',
  type: 'actress',
  id: actressId,
  timestamp: new Date().toISOString()
})
```

## 📚 Documentation Maintenance

### 1. Documentation Standards

#### Code Documentation
```typescript
/**
 * Updates extended master data with sync functionality
 * @param c - Hono context object
 * @returns JSON response with updated data
 */
export async function updateExtendedMasterDataWithSync(c: Context) {
  // Implementation
}
```

#### API Documentation
```typescript
/**
 * PUT /master/:type/:id/extended/sync
 * 
 * Updates master data item with extended fields and syncs changes across related records
 * 
 * @param type - Master data type (actor, actress, director)
 * @param id - Item ID
 * @body - Extended data including lineupData
 * @returns Updated item data with sync results
 */
```

### 2. Documentation Updates

#### When to Update
- After code changes
- When adding new features
- When fixing bugs
- When changing APIs
- When updating dependencies

#### Update Process
1. Identify affected documentation
2. Update relevant sections
3. Review for accuracy
4. Test examples and code snippets
5. Publish updates

## 🚨 Disaster Recovery

### 1. Backup Procedures

#### Data Backup
```bash
# Backup KV store data
npx supabase functions logs make-server-e0516fcf > backup_$(date +%Y%m%d).log

# Backup function code
git tag backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

#### Function Backup
```bash
# Download function code
npx supabase functions download make-server-e0516fcf

# Backup to external storage
tar -czf function_backup_$(date +%Y%m%d).tar.gz supabase/functions/
```

### 2. Recovery Procedures

#### Function Recovery
```bash
# Restore from backup
npx supabase functions deploy make-server-e0516fcf

# Verify restoration
npx supabase functions list
```

#### Data Recovery
```bash
# Restore from logs
npx supabase functions logs make-server-e0516fcf --follow

# Replay critical operations
# (Manual process based on logs)
```

## 📚 Related Documentation

- [LineupData Undefined Troubleshooting](./lineup-data-undefined-troubleshooting.md)
- [Server Routing Architecture](./server-routing-architecture.md)
- [Debugging Methodology](./debugging-methodology.md)
- [LineupData Implementation](./lineup-data-implementation.md)

---

**Last Updated**: 2025-01-15  
**Version**: 1.0  
**Status**: ✅ Production Ready
