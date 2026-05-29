// src/app/(dashboard)/dashboard/quick-links/book-appointment/page.tsx
import { DevGuard } from '@/components/UI/DevGuard';
import { CalendarCheck } from 'lucide-react';

export default function BookAppointmentPage() {
  return (
    <DevGuard featureName="Book Appointment">
      {/* Placeholder — replace with real appointment-booking component when ready */}
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
        <CalendarCheck size={40} className="opacity-30" />
        <p className="text-sm font-medium">Book Appointment — coming soon</p>
      </div>
    </DevGuard>
  );
}
