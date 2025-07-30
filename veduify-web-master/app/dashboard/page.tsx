'use client';

import { useEffect, useState } from 'react';
import { Plus, User, Settings} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
//import { useStore } from '@/lib/store';
import { CourseCard } from '@/components/course-card';
import { AddCourseDialog } from '@/components/add-course-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarView } from '@/components/calendar-view';
import { SettingsDialog } from '@/components/settings-dialog';
import { useAuth } from '@/contexts/AuthContext'; // Importing the useAuth hook
import { useRouter } from 'next/navigation';
import Image from "next/image"; // Ensure this import is correct
import { fetchCoursesForUser } from '@/lib/firestore'; // update path if needed
import { Course } from '@/lib/types';

const Dashboard = () => {
  const router = useRouter();
  const { user, logout } = useAuth(); // Use useAuth hook to get user and logout function
  const isAuthenticated = Boolean(user); // Check if user is logged in

  // If not authenticated, redirect to login page
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login'); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  //const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  //const { courses, searchCourses } = useStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState(courses);

  useEffect(() => {
    const loadCourses = async () => {
      if (user?.uid) {
        const userCourses = await fetchCoursesForUser(user.uid);
        setCourses(userCourses);
        setFilteredCourses(userCourses);
      }
    };

    if (isAuthenticated) {
      loadCourses();
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    setFilteredCourses(
      searchQuery
        ? courses.filter(course =>
          course.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : courses
    );
  }, [searchQuery, courses]);

  if (!isAuthenticated) {
    return null; // Optionally show a loading spinner while checking auth status
  }

  

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            className="dark:invert"
            src="/logo.png"
            alt="logo"
            width={150}
            height={50}
            priority
          />
          <div className="flex items-center space-x-2">
            {/*<Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
            </Button>*/}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/profile')} // Correct method for navigation
            >
              <User className="h-5 w-5" />
            </Button>
            {/*<Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/whiteboard')} // Correct method for navigation
            >
              <Edit3 className="h-5 w-5" />
            </Button>*/}
            <Button onClick={logout}>Logout</Button> {/* Logout button */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="courses" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </div>
            <div className="flex items-center space-x-2">
              <div className="w-50">
                <Input
                  type="search"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={() => setIsAddCourseOpen(true)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            
          </div>

          <TabsContent value="courses" className="mt-6">
            {user?.uid ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      userId={user.uid}
                      course={course}
                      onDelete={(id) => {
                        setCourses((prev) => prev.filter((c) => c.id !== id));
                        setFilteredCourses((prev) => prev.filter((c) => c.id !== id));
                      }}
                    />
                  ))}
                </div>
                {filteredCourses.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No courses found.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading user...</p>
              </div>
            )}
          </TabsContent>


          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </main>

      <AddCourseDialog
        open={isAddCourseOpen}
        onOpenChange={setIsAddCourseOpen}
      />
      
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
};

export default Dashboard;
