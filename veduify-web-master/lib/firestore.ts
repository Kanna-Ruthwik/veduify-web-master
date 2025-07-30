import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Course } from './types'; // Adjust the import based on your types file

export const addCourseForUser = async (
  userId: string,
  course: Course
): Promise<string> => {
  const userCoursesRef = collection(db, 'users', userId, 'courses');

  // Add the document without docId initially
  const newCourseRef = await addDoc(userCoursesRef, {
    ...course,
    createdAt: new Date(),
  });

  // Update the doc to include its own ID
  await updateDoc(newCourseRef, {
    docId: newCourseRef.id,
  });

  return newCourseRef.id;
};

// Add a course
//export const addCourseToFirestore = async (course: Course): Promise<string> => {
//  const docRef = await addDoc(collection(db, 'courses'), course);
//  return docRef.id; // Return the ID of the newly created course
//};

// Update a course
//export const updateCourseInFirestore = async (courseId: string, updatedCourse: Partial<Course>): Promise<void> => {
//  const courseRef = doc(db, 'courses', courseId);
//  await updateDoc(courseRef, updatedCourse);
//};

export const updateCourseForUser = async (
  userId: string,
  courseId: string,
  updatedCourse: Partial<Course>
): Promise<void> => {
  const courseRef = doc(db, 'users', userId, 'courses', courseId);
  await updateDoc(courseRef, updatedCourse);
};


// Delete a course
//export const deleteCourseFromFirestore = async (courseId: string): Promise<void> => {
//  const courseRef = doc(db, 'courses', courseId);
//  await deleteDoc(courseRef);
//};

export const deleteCourseForUser = async (
  userId: string,
  courseId: string
): Promise<void> => {
  const courseRef = doc(db, 'users', userId, 'courses', courseId);
  await deleteDoc(courseRef);
};

// Fetch all courses
//export const fetchCoursesFromFirestore = async (): Promise<Course[]> => {
//  const querySnapshot = await getDocs(collection(db, 'courses'));
//  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
//};

export const fetchCoursesForUser = async (userId?: string): Promise<Course[]> => {
  if (!userId) return [];
  const userCoursesRef = collection(db, 'users', userId, 'courses');
  const querySnapshot = await getDocs(userCoursesRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};
