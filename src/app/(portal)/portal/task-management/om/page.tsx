// src/app/(portal)/portal/task-management/om/page.tsx
// Permanent redirect — /om was renamed to /operations
import { redirect } from 'next/navigation';

export default function OMLegacyPage() {
  redirect('/portal/task-management/operations');
}
