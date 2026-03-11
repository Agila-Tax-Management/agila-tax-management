import { TaskBoard } from "@/components/account-officer/TaskBoard";

export default function ComplianceTasksPage() {
    // Note: Re-using the AO TaskBoard for now as requested.
    // This will likely need its own version later.
    return (
        <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Task Board</h1>
            <p className="text-sm text-slate-500 mt-1">Tasks assigned to the compliance department.</p>
            <div className="mt-8">
                <TaskBoard />
            </div>
        </div>
    );
}
