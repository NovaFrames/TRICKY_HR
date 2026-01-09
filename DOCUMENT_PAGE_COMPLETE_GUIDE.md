# Complete Document Page Implementation

## Step 1: Update services/ApiService.ts (Line 881)

### Current Code:
```typescript
FolderName: "EDUCATION",     // Category: "All", "EDUCATION", "EXPERIENCE", etc.
```

### Change To:
```typescript
FolderName: category === 'All' ? '' : category,
```

---

## Step 2: Update app/(tabs)/employee/empdocument.tsx

### Find the fetchDocuments function (around line 66-78):

### Current Code:
```typescript
const fetchDocuments = async () => {
    try {
        setLoading(true);
        const docs = await ApiService.getDocuments();
        setDocuments(docs);
    } catch (error) {
        Alert.alert('Error', 'Failed to load documents');
        console.error('Error fetching documents:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
};
```

### Replace With:
```typescript
const fetchDocuments = async () => {
    try {
        setLoading(true);
        
        // Get current tab and convert to folder name
        const currentTab = routes[index].key;
        const folderName = currentTab === 'all' ? 'All' : currentTab.toUpperCase();
        
        console.log('Fetching documents for folder:', folderName);
        const docs = await ApiService.getDocuments(folderName);
        console.log('Fetched documents:', docs);
        
        setDocuments(docs);
        setFilteredDocuments(docs);
    } catch (error) {
        Alert.alert('Error', 'Failed to load documents');
        console.error('Error fetching documents:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
};
```

### Also update the useEffect (around line 62-64):

### Current Code:
```typescript
useEffect(() => {
    filterDocumentsByTab();
}, [index, documents]);
```

### Replace With:
```typescript
useEffect(() => {
    fetchDocuments();
}, [index]);
```

---

## How It Works

### Tab Selection Flow:

1. **ALL Tab Selected:**
   - `routes[index].key` = `'all'`
   - `folderName` = `'All'`
   - `ApiService.getDocuments('All')` is called
   - In ApiService: `FolderName: category === 'All' ? '' : category` → `FolderName: ''`
   - Backend returns ALL documents from all folders

2. **EDUCATION Tab Selected:**
   - `routes[index].key` = `'education'`
   - `folderName` = `'EDUCATION'`
   - `ApiService.getDocuments('EDUCATION')` is called
   - In ApiService: `FolderName: 'EDUCATION'`
   - Backend returns only EDUCATION documents

3. **EXPERIENCE Tab Selected:**
   - `routes[index].key` = `'experience'`
   - `folderName` = `'EXPERIENCE'`
   - `ApiService.getDocuments('EXPERIENCE')` is called
   - In ApiService: `FolderName: 'EXPERIENCE'`
   - Backend returns only EXPERIENCE documents

4. **PROOF Tab Selected:**
   - `routes[index].key` = `'proof'`
   - `folderName` = `'PROOF'`
   - `ApiService.getDocuments('PROOF')` is called
   - In ApiService: `FolderName: 'PROOF'`
   - Backend returns only PROOF documents

5. **BIRTH CERTIFICATE Tab Selected:**
   - `routes[index].key` = `'birth'`
   - `folderName` = `'BIRTH CERTIFICATE'`
   - `ApiService.getDocuments('BIRTH CERTIFICATE')` is called
   - In ApiService: `FolderName: 'BIRTH CERTIFICATE'`
   - Backend returns only BIRTH CERTIFICATE documents

---

## Summary of Changes

### services/ApiService.ts:
- Line 881: Change `"EDUCATION"` to `category === 'All' ? '' : category`

### app/(tabs)/employee/empdocument.tsx:
- Update `fetchDocuments` function to get current tab and pass to `getDocuments()`
- Update `useEffect` to refetch when tab changes (dependency: `[index]`)

---

## After Implementation

✅ Selecting ALL tab shows all documents
✅ Selecting EDUCATION tab shows only EDUCATION documents  
✅ Selecting EXPERIENCE tab shows only EXPERIENCE documents
✅ Selecting PROOF tab shows only PROOF documents
✅ Selecting BIRTH CERTIFICATE tab shows only BIRTH CERTIFICATE documents
✅ Console logs help debug what's being sent/received
