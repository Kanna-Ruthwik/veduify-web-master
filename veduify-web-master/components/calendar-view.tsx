'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarDays, GraduationCap } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  limit,
  DocumentData,
} from 'firebase/firestore';
import { timeSlotSchedule } from '@/lib/types';
import { onAuthStateChanged } from 'firebase/auth';

type TimeSlot = keyof typeof timeSlotSchedule;

interface Course {
  id: string;
  name: string;
  timeSlot: TimeSlot;
}

interface StudySession {
  id: string;
  date: string;
  duration: number;
  notes?: string;
  startTime: string;
}

export function CalendarView() {
  const [date, setDate] = useState<Date>(new Date());
  const [courses, setCourses] = useState<Course[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Track auth state safely
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // Fetch courses on date or user change
  const fetchCourses = useCallback(async () => {
    if (!userId) return;
    const courseRef = collection(db, 'users', userId, 'courses');
    const snapshot = await getDocs(courseRef);
    const courseData = snapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        name: data.name,
        timeSlot: data.timeSlot as TimeSlot,
      };
    });

    const filtered = courseData.filter((course) => {
      const slots = timeSlotSchedule[course.timeSlot] || [];
      return slots.some((slot) => slot.startsWith(format(date, 'EEEE')));
    });

    setCourses(filtered);
  }, [userId, date]);

  // Fetch study sessions
  const fetchStudySessions = useCallback(async () => {
    if (!userId) return;
    const sessionQuery = query(
      collection(db, 'users', userId, 'studySessions'),
      limit(100)
    );
    const snapshot = await getDocs(sessionQuery);
    const sessionData = snapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        date: data.date,
        duration: data.duration,
        notes: data.notes,
        startTime: data.startTime,
      } as StudySession;
    });

    setStudySessions(sessionData);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchCourses();
      fetchStudySessions();
    }
  }, [userId, date, fetchCourses, fetchStudySessions]);

  // Get events for a given day
  const getDayEvents = (date: Date) => {
    const dayOfWeek = format(date, 'EEEE');

    const classEvents = courses.flatMap((course) => {
      const slots = timeSlotSchedule[course.timeSlot] || [];
      return slots
        .filter((slot) => slot.startsWith(dayOfWeek))
        .map((slot) => ({
          type: 'class' as const,
          course,
          time: slot.split(' ')[1],
        }));
    });

    const studyEvents = studySessions
      .filter(
        (session) =>
          format(new Date(session.date), 'yyyy-MM-dd') ===
          format(date, 'yyyy-MM-dd')
      )
      .map((session) => ({
        type: 'study' as const,
        session,
      }));

    const allEvents = [...classEvents, ...studyEvents];

    allEvents.sort((a, b) => {
      const timeA = 'time' in a ? a.time : a.session.startTime;
      const timeB = 'time' in b ? b.time : b.session.startTime;
      return timeA.localeCompare(timeB);
    });

    return allEvents;
  };

  const selectedDayEvents = getDayEvents(date);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && setDate(date)}
          className="rounded-md border"
        />
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold mb-4">
          Events for {format(date, 'MMMM d, yyyy')}
        </h3>
        <div className="space-y-4">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-3 rounded-lg border"
              >
                {event.type === 'class' ? (
                  <>
                    <GraduationCap className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">{event.course.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.time}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">Study Session</p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {event.session.duration} minutes
                      </p>
                      {event.session.notes && (
                        <p className="text-sm mt-1">{event.session.notes}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No events scheduled for this day
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
