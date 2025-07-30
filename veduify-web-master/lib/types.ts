export interface Course {
  docId: string; // Unique document ID for the course
  id: string;
  name: string;
  timeSlot: TimeSlot;
  credits: number;
  syllabus: SyllabusTopic[];
  //assignments: Assignment[];
  //resources: Resource[];
  createdAt: Date;
  updatedAt: Date;
}

/*export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  grade?: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link';
  url: string;
}*/

export type TimeSlot =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'FN1'
  | 'FN2'
  | 'FN3'
  | 'FN4'
  | 'FN5'
  | 'AN1'
  | 'AN2'
  | 'AN4'
  | 'AN5';

export const timeSlotSchedule = {
  A: ['Monday 09:00-09:55', 'Wednesday 11:00-11:55', 'Thursday 10:00-10:55'],
  B: ['Monday 10:00-10:55', 'Wednesday 09:00-09:55', 'Thursday 11:00-11:55'],
  C: ['Monday 11:00-11:55', 'Wednesday 10:00-10:55', 'Thursday 09:00-09:55'],
  D: ['Monday 12:00-12:55', 'Tuesday 09:00-9:55', 'Friday 11:00-11:55'],
  E: ['Tuesday 10:00-10:55', 'Thursday 12:00-12:55', 'Friday 09:00-09:55'],
  F: ['Tuesday 11:00-11:55', 'Wednesday 14:30-15:25', 'Friday 10:00-10:55'],
  G: ['Tuesday 12:00-12:55', 'Wednesday 12:00-12:55', 'Friday 12:00-12:55'],
  P: ['Monday 14:30-15:55', 'Thursday 16:00-17:25'],
  Q: ['Monday 16:30-17:25', 'Thursday 14:30-15:55'],
  R: ['Tuesday 14:30-15:55', 'Friday 16:00-17:25'],
  S: ['Tuesday 16:30-17:25', 'Friday 14:30-15:55'],
  FN1: ['Monday 09:00-11:55'],
  FN2: ['Tuesday 09:00-11:55'],
  FN3: ['Wednesday 09:00-11:55'],
  FN4: ['Thursday 09:00-11:55'],
  FN5: ['Friday 09:00-11:55'],
  AN1: ['Monday 14:30-17:25'],
  AN2: ['Tuesday 14:30-17:25'],
  AN4: ['Thursday 14:30-17:25'],
  AN5: ['Friday 14:30-17:25'],
} as const;


export interface SyllabusTopic {
  id: string;
  title: string;
  subtopics: string[];
  expanded: boolean;
}