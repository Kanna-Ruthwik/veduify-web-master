"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Course, timeSlotSchedule } from '@/lib/types';
import { Clock, CalendarDays, GraduationCap, Book } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { deleteCourseForUser } from '@/lib/firestore';

interface CourseCardProps {
  course: Course;
  userId: string;
  onDelete?: (id: string) => void; // callback to update UI
}

export function CourseCard({ course, userId }: CourseCardProps) {
  const router = useRouter();
  const timeSlot = course.timeSlot;
  const times = timeSlotSchedule[timeSlot];
  const nextClass = `${times.join(', ')}`;
  //const pendingAssignments = course.assignments?.filter(a => !a.completed).length || 0;

  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleLongPress = async () => {
    const confirmDelete = window.confirm(`Do you want to delete "${course.name}"?`);
    if (!confirmDelete) return;

    try {
      await deleteCourseForUser(userId,course.docId);
      window.location.reload(); // Refresh the page to reflect changes
      } catch (err) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleMouseDown = () => {
    const timer = setTimeout(() => handleLongPress(), 1000); // 1 sec
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  return (
    <Card
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className="hover:shadow-lg transition-shadow select-none"
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{course.name}</span>
          <span className="text-sm font-normal text-muted-foreground">{course.id}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <GraduationCap className="mr-2 h-4 w-4" />
            <span>{course.credits} Credits</span>
          </div>
          <div className="flex items-center text-sm">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Slot : {timeSlot}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4" />
            <span>{nextClass}</span>
          </div>
          {/*<div className="flex items-center text-sm">
            <FileText className="mr-2 h-4 w-4" />
            <span>{pendingAssignments} pending assignments</span>
          </div>*/}
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('dashboard/course/' + course.id)}>
              View Details
            </Button>
            {course.syllabus && (
              <Button variant="ghost" size="sm">
                <Book className="h-4 w-4 mr-2" />
                Syllabus
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
