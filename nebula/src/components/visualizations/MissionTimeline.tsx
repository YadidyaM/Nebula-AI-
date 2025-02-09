import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Timer, AlertTriangle, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle, RotateCcw } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  duration: number;
  priority: string;
  status: string;
  startTime: number;
  totalDuration: number;
  dependencies?: string[];
  description?: string;
  assignee?: string;
  lastUpdated?: string;
}

interface SortableTaskProps {
  task: Task;
  isOverlay?: boolean;
}

const TaskCard: React.FC<SortableTaskProps> = ({ task, isOverlay }) => {
  const getProgressColor = (duration: number, priority: string) => {
    if (duration <= 5) return 'bg-red-500';
    if (priority === 'High') return 'bg-purple-500';
    if (priority === 'Medium') return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'delayed':
        return <RotateCcw className="h-5 w-5 text-yellow-500" />;
      case 'ahead':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'behind':
        return <ArrowDownCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Timer className="h-5 w-5 text-blue-500" />;
    }
  };

  // Calculate elapsed time and progress
  const now = Date.now();
  const elapsedTime = now - task.startTime;
  const elapsedMinutes = Math.floor(elapsedTime / 60000);
  const progressPercentage = Math.min(
    (elapsedMinutes / task.totalDuration) * 100,
    100
  );

  const timeRemaining = Math.max(0, task.totalDuration - elapsedMinutes);
  const isNearCompletion = timeRemaining <= 5;

  return (
    <div className={`
      bg-white rounded-lg p-4 mb-3
      ${isOverlay ? 'shadow-2xl scale-105' : 'shadow-md hover:shadow-lg'}
      transition-all duration-200 ease-in-out
      border-l-4 ${
        task.priority === 'High' ? 'border-purple-500' :
        task.priority === 'Medium' ? 'border-blue-500' :
        'border-green-500'
      }
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon(task.status)}
          <div>
            <h4 className="font-medium text-gray-900">{task.name}</h4>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            task.priority === 'High' ? 'bg-purple-100 text-purple-800' :
            task.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {task.priority}
          </span>
          <span className="text-xs text-gray-500">
            {task.lastUpdated && `Updated: ${new Date(task.lastUpdated).toLocaleTimeString()}`}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${
              getProgressColor(timeRemaining, task.priority)
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Timer className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {timeRemaining} min remaining
          </span>
        </div>
        {task.assignee && (
          <span className="text-sm text-gray-500">
            Assigned to: {task.assignee}
          </span>
        )}
      </div>

      {isNearCompletion && (
        <div className="mt-2 flex items-center text-red-600 text-sm animate-pulse">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>Task completing soon</span>
        </div>
      )}

      {task.dependencies && task.dependencies.length > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          <span className="font-medium">Dependencies:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {task.dependencies.map((dep) => (
              <span
                key={dep}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SortableTask: React.FC<SortableTaskProps> = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move touch-none"
    >
      <TaskCard task={task} />
    </div>
  );
};

interface MissionTimelineProps {
  tasks: Task[];
  onTasksReorder?: (tasks: Task[]) => void;
}

const MissionTimeline: React.FC<MissionTimelineProps> = ({ tasks, onTasksReorder }) => {
  const [items, setItems] = useState(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [timelineStats, setTimelineStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    criticalTasks: 0,
    averageCompletion: 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  useEffect(() => {
    const stats = {
      totalTasks: items.length,
      completedTasks: items.filter(task => task.status === 'success').length,
      criticalTasks: items.filter(task => task.priority === 'High').length,
      averageCompletion: items.reduce((acc, task) => {
        const elapsed = Date.now() - task.startTime;
        const progress = Math.min((elapsed / (task.totalDuration * 60000)) * 100, 100);
        return acc + progress;
      }, 0) / Math.max(1, items.length)
    };
    setTimelineStats(stats);
  }, [items]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        if (onTasksReorder) {
          onTasksReorder(newItems);
        }
        return newItems;
      });
    }
  };

  const activeTask = activeId ? items.find(task => task.id === activeId) : null;

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Mission Timeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Tasks</div>
            <div className="text-2xl font-semibold">{timelineStats.totalTasks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-semibold text-green-600">
              {timelineStats.completedTasks}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Critical Tasks</div>
            <div className="text-2xl font-semibold text-purple-600">
              {timelineStats.criticalTasks}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Average Progress</div>
            <div className="text-2xl font-semibold text-blue-600">
              {timelineStats.averageCompletion.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((task) => (
              <SortableTask key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default MissionTimeline;