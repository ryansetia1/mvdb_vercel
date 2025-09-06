# Template Placeholder System

Sistem placeholder yang komprehensif untuk auto-fill URL templates berdasarkan data movie.

## Available Placeholders

### Basic Placeholders
- `*` - DM code replacement
- `#` - 1-digit numbers (1, 2, 3, ..., 9)
- `##` - 2-digit numbers (01, 02, 03, ..., 99)
- `###` - 3-digit numbers (001, 002, 003, ..., 999)

### New Advanced Placeholders
- `@studio` - Studio name (lowercase)
- `@firstname` - First name of actress (lowercase, ignores text in parentheses)
- `@lastname` - Last name of actress (lowercase, ignores text in parentheses)

## How It Works

### Name Processing
Actress names are intelligently processed:
- **Input**: "Yui Hatano (葉月ゆい)"
- **First name**: "yui" (first word, lowercase)
- **Last name**: "hatano" (last word, lowercase)
- **Parentheses ignored**: Text in parentheses like "(葉月ゆい)" is automatically ignored

### Multiple Actresses
For multiple actresses separated by commas:
- **Input**: "Yui Hatano, Maria Ozawa"
- **Result**: Uses only the first actress ("Yui Hatano")

### Single Name
If actress has only one name:
- **Input**: "Madonna"
- **Result**: Both @firstname and @lastname become "madonna"

## Examples

### Cover URL Template
```
https://pics.com/@studio/*/covers/@firstname-@lastname.jpg
```

**With data:**
- Studio: "Moodyz"
- Actress: "Yui Hatano (葉月ゆい)"
- DMCode: "abc123"

**Results in:**
```
https://pics.com/moodyz/abc123/covers/yui-hatano.jpg
```

### Gallery URL Template
```
https://gallery.com/@studio/@firstname-@lastname/*/img##.jpg
```

**With data:**
- Studio: "S1"
- Actress: "Yui Hatano (葉月ゆい)"
- DMCode: "abc123"

**Results in:**
```
https://gallery.com/s1/yui-hatano/abc123/img01.jpg
https://gallery.com/s1/yui-hatano/abc123/img02.jpg
https://gallery.com/s1/yui-hatano/abc123/img03.jpg
...
```

## Use Cases

### Standard Site Structure
Many adult sites follow this URL structure:
```
https://site.com/{studio}/{actress-name}/{code}/{filename}
```

Now you can template this as:
```
https://site.com/@studio/@firstname-@lastname/*/{filename}
```

### Cover Images
```
https://covers.site.com/@studio/*/cover-@firstname-@lastname.jpg
```

### Gallery with Actress Names
```
https://pics.site.com/@studio/@firstname-@lastname/*/gallery##.jpg
```

### Mixed Patterns
```
https://site.com/@studio/actresses/@firstname/@lastname/*/images/img###.jpg
```

## Technical Implementation

### Template Processing Order
1. `*` → DM code replacement
2. `@studio` → Studio name (lowercase)
3. `@firstname` → First name (lowercase, parentheses ignored)
4. `@lastname` → Last name (lowercase, parentheses ignored)
5. `#` patterns → Number replacement (client-side for galleries)

### Components Supporting Placeholders
- ✅ **TemplatePreview** - Shows processed URL with explanations
- ✅ **MediaLinksTab** - Cover and gallery template inputs
- ✅ **MovieDetailContent** - Gallery template edit
- ✅ **EnhancedGallery** - URL generation for image loading

### Functions Updated
- ✅ `processTemplate()` - Main template processing
- ✅ `generateGalleryUrls()` - Gallery URL generation
- ✅ `generateSmartGalleryUrls()` - Advanced gallery with placeholder support
- ✅ `countPlaceholders()` - Count all placeholder types
- ✅ `getPlaceholderExplanation()` - UI explanations

## Benefits

1. **Automatic URL Generation** - No more manual typing of repetitive URL patterns
2. **Consistent Naming** - Automatic lowercase conversion ensures consistency
3. **Smart Name Parsing** - Handles Japanese names in parentheses correctly
4. **Flexible Templates** - Mix and match any placeholders as needed
5. **Real-time Preview** - See exactly what URLs will be generated
6. **Error Prevention** - Missing data clearly indicated in UI

## Migration from Old System

### Before (Manual)
```
https://pics.dmm.com/moodyz/yui-hatano/abc123/gallery01.jpg
```
User had to type the full URL manually.

### After (Template)
```
https://pics.dmm.com/@studio/@firstname-@lastname/*/gallery##.jpg
```
System auto-fills based on movie data:
- @studio → "moodyz"
- @firstname → "yui" 
- @lastname → "hatano"
- * → "abc123"
- ## → "01", "02", "03"...

This saves significant time and reduces typos!