// Script to replace toast calls with SweetAlert
// Run: node scripts/replace-toast.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const filesToUpdate = [
  'src/pages/admin/Categories.tsx',
  'src/pages/admin/Subjects.tsx',
  'src/pages/admin/Topics.tsx',
  'src/pages/admin/Tests.tsx',
  'src/pages/admin/Jobs.tsx',
  'src/pages/admin/Materials.tsx',
  'src/pages/admin/AssignQuestions.tsx',
  'src/pages/admin/AdminProfile.tsx',
  'src/pages/admin/Settings.tsx',
  'src/pages/admin/System.tsx',
  'src/pages/admin/PaymentSettings.tsx',
  'src/pages/Profile.tsx',
  'src/pages/History.tsx',
  'src/pages/TestAttempt.tsx',
  'src/pages/TestResult.tsx',
  'src/pages/CustomPractice.tsx',
  'src/pages/CustomPracticeSession.tsx',
  'src/pages/CustomPracticeResult.tsx',
  'src/pages/MyProgress.tsx',
  'src/pages/Jobs.tsx',
  'src/pages/Materials.tsx',
  'src/pages/UserExamHierarchy.tsx',
  'src/pages/BasicToAdvance.tsx',
  'src/pages/LevelSelection.tsx',
  'src/pages/LevelContent.tsx',
  'src/pages/LevelPractice.tsx',
  'src/pages/SkipTest.tsx',
  'src/pages/Subscriptions.tsx',
  'src/pages/Donate.tsx',
  'src/pages/ForgotPassword.tsx',
  'src/pages/ResetPassword.tsx',
];

function replaceInFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace import
  if (content.includes("import { toast } from 'sonner';")) {
    content = content.replace(
      /import { toast } from 'sonner';/g,
      "import { showError, showSuccess, showWarning, showInfo, showDeleteConfirm } from '@/lib/sweetalert';"
    );
    modified = true;
  }

  // Replace toast.error
  if (content.includes('toast.error')) {
    content = content.replace(
      /toast\.error\((['"`])([^'"`]+)\1\)/g,
      "showError('$2')"
    );
    content = content.replace(
      /toast\.error\(([^)]+)\)/g,
      (match) => {
        // Handle complex expressions
        if (match.includes('+') || match.includes('||')) {
          return match.replace('toast.error(', 'showError(');
        }
        return match.replace('toast.error', 'showError');
      }
    );
    modified = true;
  }

  // Replace toast.success
  if (content.includes('toast.success')) {
    content = content.replace(
      /toast\.success\((['"`])([^'"`]+)\1\)/g,
      "showSuccess('$2')"
    );
    content = content.replace(
      /toast\.success\(([^)]+)\)/g,
      (match) => {
        if (match.includes('+') || match.includes('||')) {
          return match.replace('toast.success(', 'showSuccess(');
        }
        return match.replace('toast.success', 'showSuccess');
      }
    );
    modified = true;
  }

  // Replace toast.warning
  if (content.includes('toast.warning')) {
    content = content.replace(
      /toast\.warning\((['"`])([^'"`]+)\1\)/g,
      "showWarning('$2')"
    );
    modified = true;
  }

  // Replace toast.info
  if (content.includes('toast.info')) {
    content = content.replace(
      /toast\.info\((['"`])([^'"`]+)\1\)/g,
      "showInfo('$2')"
    );
    modified = true;
  }

  // Replace confirm
  if (content.includes('confirm(')) {
    content = content.replace(
      /if\s*\(!\s*confirm\(([^)]+)\)\)\s*return;/g,
      "const result = await showDeleteConfirm($1);\n    if (!result.isConfirmed) return;"
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
  }
}

console.log('🔄 Replacing toast with SweetAlert...\n');

filesToUpdate.forEach(replaceInFile);

console.log('\n✨ Done! Please review the changes and test.');

