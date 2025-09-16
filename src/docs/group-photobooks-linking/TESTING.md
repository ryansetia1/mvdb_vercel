# Testing Guide for Group Photobooks Linking

## 🧪 **Testing Checklist**

### ✅ **Basic Functionality**
- [ ] **Tab Photobooks muncul** di Group Detail Page
- [ ] **4 sub-tabs tersedia**: Group, Generation, Lineup, Member
- [ ] **Empty state** muncul dengan tombol "Link Photobooks"
- [ ] **Linking dialog** terbuka saat klik "Link Photobooks"
- [ ] **Search functionality** bekerja di linking dialog
- [ ] **Photobook selection** bekerja (checkbox selection)
- [ ] **Link Selected** button berfungsi
- [ ] **Linked photobooks** muncul di grid
- [ ] **Unlink functionality** bekerja (hover + click unlink button)

### ✅ **Error Handling**
- [ ] **Network errors** ditangani dengan toast notifications
- [ ] **Empty states** ditampilkan dengan benar
- [ ] **Loading states** muncul saat fetch data
- [ ] **Authentication errors** ditangani dengan baik

### ✅ **UI/UX**
- [ ] **Responsive design** bekerja di mobile, tablet, desktop
- [ ] **Hover effects** pada photobook cards
- [ ] **Smooth transitions** dan animations
- [ ] **Keyboard navigation** berfungsi
- [ ] **Accessibility** features bekerja

## 🚀 **Testing Steps**

### 1. **Access Group Detail Page**
```
1. Login ke aplikasi
2. Navigate ke Groups page
3. Pilih salah satu group
4. Verify tab "Photobooks" muncul
```

### 2. **Test Linking Workflow**
```
1. Klik tab "Photobooks"
2. Pilih sub-tab "Group"
3. Klik "Link Photobooks" button
4. Verify dialog terbuka
5. Search untuk photobooks
6. Select beberapa photobooks
7. Klik "Link Selected"
8. Verify photobooks muncul di grid
```

### 3. **Test Unlinking Workflow**
```
1. Hover over photobook card
2. Klik tombol unlink (X)
3. Verify photobook hilang dari grid
4. Verify toast notification muncul
```

### 4. **Test Different Sub-tabs**
```
1. Test Group sub-tab
2. Test Generation sub-tab
3. Test Lineup sub-tab
4. Test Member sub-tab
5. Verify masing-masing bekerja dengan benar
```

## 🐛 **Common Issues & Solutions**

### **Issue: 404 Error saat load photobooks**
**Solution**: Pastikan server functions sudah di-deploy
```bash
supabase functions deploy make-server-e0516fcf
```

### **Issue: Authentication Error**
**Solution**: Pastikan user sudah login dengan valid access token

### **Issue: Empty state tidak muncul**
**Solution**: Check apakah ada photobooks di database

### **Issue: Linking dialog tidak terbuka**
**Solution**: Check console untuk JavaScript errors

## 📊 **Performance Testing**

### **Load Time**
- [ ] Photobooks tab load dalam < 2 detik
- [ ] Linking dialog load dalam < 1 detik
- [ ] Search results muncul dalam < 500ms

### **Memory Usage**
- [ ] No memory leaks saat navigate antar tabs
- [ ] Images load efficiently dengan lazy loading

## 🔍 **Browser Testing**

### **Chrome**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Responsive design works

### **Firefox**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Responsive design works

### **Safari**
- [ ] All features work correctly
- [ ] No console errors
- [ ] Responsive design works

## 📱 **Mobile Testing**

### **iOS Safari**
- [ ] Touch interactions work
- [ ] Responsive layout correct
- [ ] Performance acceptable

### **Android Chrome**
- [ ] Touch interactions work
- [ ] Responsive layout correct
- [ ] Performance acceptable

## 🎯 **Success Criteria**

### **Functional**
- ✅ All linking/unlinking operations work
- ✅ Search functionality works
- ✅ Error handling works
- ✅ Data persistence works

### **Performance**
- ✅ Load times < 2 seconds
- ✅ Smooth animations
- ✅ No memory leaks

### **User Experience**
- ✅ Intuitive workflow
- ✅ Clear feedback
- ✅ Responsive design
- ✅ Accessibility support

## 📝 **Test Results**

| Test Case | Status | Notes |
|-----------|--------|-------|
| Tab Photobooks muncul | ✅ | Working |
| Linking dialog | ✅ | Working |
| Search functionality | ✅ | Working |
| Photobook selection | ✅ | Working |
| Link operations | ✅ | Working |
| Unlink operations | ✅ | Working |
| Error handling | ✅ | Working |
| Responsive design | ✅ | Working |

## 🚀 **Deployment Checklist**

- [ ] Server functions deployed
- [ ] Client code built successfully
- [ ] No linting errors
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] Security review completed
