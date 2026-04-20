# 🇮🇳 Indian Government Exams Hierarchy Structure

यह document बताता है कि exam hierarchy structure कैसे काम करती है।

## 📊 Structure Overview

```
All India Exams (🇮🇳)
    ├── UPSC (📜)
    │   ├── Civil Services (🏛️)
    │   ├── Engineering Services (ESE) (⚙️)
    │   ├── CDS (🎖️)
    │   └── NDA (🪖)
    │
    ├── SSC (📋)
    │   ├── SSC CGL (📊)
    │   ├── SSC CHSL (📝)
    │   ├── SSC MTS (🔧)
    │   ├── SSC JE (🔩)
    │   └── SSC GD (👮)
    │
    ├── Banking (🏦)
    │   ├── IBPS PO (💼)
    │   ├── IBPS Clerk (📄)
    │   ├── SBI PO (🏛️)
    │   ├── SBI Clerk (📑)
    │   └── RBI Grade B (💰)
    │
    ├── Railway (🚂)
    │   ├── RRB NTPC (🚄)
    │   ├── RRB Group D (🔧)
    │   └── RRB JE (⚙️)
    │
    ├── State Level Exams (🗺️)
    │   └── VYAPAM (📑)
    │       ├── Teacher (👨‍🏫)
    │       │   ├── Teacher Grade 1 (⭐)
    │       │   ├── Teacher Grade 2 (⭐⭐)
    │       │   └── Teacher Grade 3 (⭐⭐⭐)
    │       ├── Patwari (📋)
    │       ├── Police (👮)
    │       ├── Nurse (💉)
    │       └── Lab Assistant (🧪)
    │
    └── ... (और भी बहुत सारे exams)
```

## 🎯 Real Example: VYAPAM Teacher Hierarchy

```
All India Exams
    └── State Level Exams
        └── VYAPAM
            └── Teacher
                ├── Teacher Grade 1
                ├── Teacher Grade 2
                └── Teacher Grade 3
```

## 📝 How to Use

### 1. Seed the Hierarchy

```bash
cd server
npm run seed-exam-hierarchy
```

यह script:
- ✅ Complete hierarchy structure create करेगा
- ✅ सभी categories और sub-categories बनाएगा
- ✅ हर leaf category के लिए default subjects add करेगा

### 2. View Hierarchy

Admin panel में जाएं:
- `/admin/exam-hierarchy` - Complete tree view देखें
- `/admin/categories` - Categories manage करें

### 3. Add New Categories

Categories page से:
- **Parent Category** select करें (nested structure के लिए)
- **Name** और **Icon** add करें
- Hierarchy automatically build होगी

## 🔄 Multi-Level Support

आप unlimited levels तक nested categories बना सकते हैं:

```
Level 1: All India Exams
Level 2: SSC
Level 3: SSC CGL
Level 4: (अगर चाहें तो और भी nested कर सकते हैं)
```

## 📚 Default Subjects

हर leaf category (जिसके children नहीं हैं) के लिए automatically ये subjects add होते हैं:

1. Mathematics (🔢)
2. General Knowledge (📚)
3. English (🔤)
4. Reasoning (🧠)
5. Hindi (📖)

## 🌐 Reference Websites

Real exam structure देखने के लिए:

1. **SSC Official**: https://ssc.nic.in
2. **UPSC Official**: https://upsc.gov.in
3. **VYAPAM Official**: https://vyapam.nic.in
4. **IBPS Official**: https://ibps.in
5. **Railway RRB**: https://indianrailways.gov.in

## 📊 Complete Exam List in Script

Script में ये exams include हैं:

### National Level
- UPSC (Civil Services, ESE, CDS, NDA)
- SSC (CGL, CHSL, MTS, JE, GD)
- Banking (IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B)
- Railway (RRB NTPC, Group D, JE)
- Defence (Army, Navy, Air Force)
- Teaching (CTET, UGC NET, DSSSB TGT)
- Engineering (JEE Main, JEE Advanced, GATE)
- Medical (NEET UG, NEET PG)

### State Level
- **VYAPAM (MP)**: Teacher (Grade 1/2/3), Patwari, Police, Nurse, Lab Assistant
- **UPPSC**: PCS, RO/ARO
- **BPSC**: Various exams
- **RPSC**: RAS, REET

## 🎨 Features

✅ Multi-level nested categories
✅ Real Indian exam structure
✅ Automatic subject creation
✅ Icon support for visual clarity
✅ Hindi descriptions
✅ Easy to extend

## 🚀 Next Steps

1. Run seed script to create hierarchy
2. Check `/admin/exam-hierarchy` to see structure
3. Add more categories as needed
4. Create subjects, topics, and questions for each exam

---

**Note**: Script को run करने से पहले ensure करें कि MongoDB connection सही है।


