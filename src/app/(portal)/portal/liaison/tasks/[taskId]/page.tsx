'use client';

import React, { useState } from 'react';
import { TaskDetailPage } from '@/components/liaison/TaskDetailPage';
import { INITIAL_LIAISON_TASKS } from '@/lib/mock-liaison-data';
import type { AOTask } from '@/lib/types';

interface PageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default function TaskDetailRoute({ params }: PageProps) {
  const [tasks, setTasks] = useState<AOTask[]>(INITIAL_LIAISON_TASKS);
  
  const { taskId } = React.use(params);
  
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Task not found</h1>
          <p className="text-slate-600 mt-2">The task you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updated: AOTask) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  return <TaskDetailPage task={task} onUpdate={handleUpdate} />;
}
