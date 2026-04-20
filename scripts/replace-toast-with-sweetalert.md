# Replace Toast with SweetAlert - Instructions

## Files Already Updated:
- ✅ src/pages/admin/AdminDashboard.tsx
- ✅ src/pages/admin/Questions.tsx
- ✅ src/pages/admin/Users.tsx
- ✅ src/pages/admin/Feedback.tsx
- ✅ src/pages/Dashboard.tsx
- ✅ src/pages/Tests.tsx
- ✅ src/pages/Feedback.tsx

## Pattern to Follow:

### 1. Replace Import:
```typescript
// OLD:
import { toast } from 'sonner';

// NEW:
import { showError, showSuccess, showWarning, showInfo, showDeleteConfirm } from '@/lib/sweetalert';
```

### 2. Replace Toast Calls:
```typescript
// OLD:
toast.error('Error message');
toast.success('Success message');
toast.warning('Warning message');
toast.info('Info message');

// NEW:
showError('Error message');
showSuccess('Success message');
showWarning('Warning message');
showInfo('Info message');
```

### 3. Replace Confirm Dialogs:
```typescript
// OLD:
if (!confirm('Are you sure?')) return;

// NEW:
const result = await showDeleteConfirm('item name');
if (!result.isConfirmed) return;
```

## Remaining Files to Update:
- src/pages/admin/ExamHierarchy.tsx
- src/pages/admin/Categories.tsx
- src/pages/admin/Subjects.tsx
- src/pages/admin/Topics.tsx
- src/pages/admin/Tests.tsx
- src/pages/admin/Jobs.tsx
- src/pages/admin/Materials.tsx
- src/pages/admin/AssignQuestions.tsx
- src/pages/admin/AdminProfile.tsx
- src/pages/admin/Settings.tsx
- src/pages/admin/System.tsx
- src/pages/admin/PaymentSettings.tsx
- src/pages/Login.tsx
- src/pages/Register.tsx
- src/pages/Profile.tsx
- src/pages/History.tsx
- src/pages/TestAttempt.tsx
- src/pages/TestResult.tsx
- src/pages/CustomPractice.tsx
- src/pages/CustomPracticeSession.tsx
- src/pages/CustomPracticeResult.tsx
- src/pages/MyProgress.tsx
- src/pages/Jobs.tsx
- src/pages/Materials.tsx
- src/pages/UserExamHierarchy.tsx
- src/pages/BasicToAdvance.tsx
- src/pages/LevelSelection.tsx
- src/pages/LevelContent.tsx
- src/pages/LevelPractice.tsx
- src/pages/SkipTest.tsx
- src/pages/Subscriptions.tsx
- src/pages/Donate.tsx
- src/pages/ForgotPassword.tsx
- src/pages/ResetPassword.tsx

