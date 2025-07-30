"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { addCourseForUser, fetchCoursesForUser } from '@/lib/firestore'; // adjust the path
import { TimeSlot, timeSlotSchedule } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { generateSyllabus } from "@/lib/gemini";
import { auth } from '@/lib/firebase';

// Define types for structured syllabus
interface SyllabusTopic {
  id: string;
  title: string;
  subtopics: string[];
  expanded: boolean;
}

type Syllabus = SyllabusTopic[];

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCourseDialog({ open, onOpenChange }: AddCourseDialogProps) {
  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot | ''>('');
  const [credits, setCredits] = useState('');
  const [enableAiSyllabus, setEnableAiSyllabus] = useState(false);
  const [syllabus, setSyllabus] = useState<Syllabus>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (loading) return; // optional double-click guard
    setLoading(true);
  if (!courseId || !courseName || !timeSlot || !credits || syllabus.length === 0) {
    toast("Error",  {
      description: 'Please fill in all required fields',
    });
    return;
  }

  try {
    const courseData = {
      docId: '', // Use Firestore doc ID as unique identifier
      id: courseId,
      name: courseName,
      timeSlot,
      credits: Number(credits),
      syllabus,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignments: [],
      resources: [],
    };

    // Get userId safely (from auth or however you're managing auth)
    const userId = auth?.currentUser?.uid; // or useAuth()?.user?.uid

    if (typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    await addCourseForUser(userId, courseData);

    toast("Success", {
      description: 'Course added successfully',
    });
    await fetchCoursesForUser(userId)
    onOpenChange(false);
    resetForm();
    window.location.reload(); // Refresh the page to show new course
  } catch (_error) {
    console.error('Error adding course:', _error);
    toast("Error", {
      description: 'Failed to add course',
    });
  }
};

  const resetForm = () => {
    setCourseId('');
    setCourseName('');
    setTimeSlot('');
    setCredits('');
    setEnableAiSyllabus(false);
    setSyllabus([]);
  };

  const handleAiSyllabusToggle = async (checked: boolean) => {
    setEnableAiSyllabus(checked);
    if (checked && courseName && credits) {
      setIsGenerating(true);
      try {
        const generatedSyllabus = await generateSyllabus(courseName, Number(credits));
        console.log("Generated Syllabus:", generatedSyllabus);
        const parsedSyllabus = parseSyllabus(generatedSyllabus);
        setSyllabus(parsedSyllabus);
      } catch (_error) {
        console.error('Error generating syllabus:', _error);
        toast("Error", {
          description: 'Failed to generate syllabus',
        });
      }
      setIsGenerating(false);
    } else {
      setSyllabus([]);
    }
  };

  // Parse AI-generated syllabus into structured format
   const parseSyllabus = (text: string): Syllabus => {
  // Remove any ```json or ``` wrapping
  const cleanedText = text
    .replace(/^```json\s*/i, '') // remove starting ```json
    .replace(/^```\s*/i, '')     // or just ```
    .replace(/```$/, '')         // remove ending ```
    .trim();

  // Try JSON parsing
  try {
    const parsed = JSON.parse(cleanedText);
    if (Array.isArray(parsed)) {
      return parsed.map((topic, index) => ({
        id: `topic-${index}`,
        title: topic["Main Topic"] || `Topic ${index + 1}`,
        subtopics: Array.isArray(topic.Subtopics) ? topic.Subtopics : [],
        expanded: true
      }));
    }
  } catch {
    // Fallback to markdown-like parsing
  }

  // Markdown fallback
  const lines = cleanedText.split('\n');
  const topics: Syllabus = [];
  let currentTopic: SyllabusTopic | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      if (currentTopic) topics.push(currentTopic);
      currentTopic = {
        id: `topic-${topics.length}`,
        title: trimmed.slice(3).trim(),
        subtopics: [],
        expanded: true
      };
    } else if (trimmed.startsWith('- ') && currentTopic) {
      currentTopic.subtopics.push(trimmed.slice(2).trim());
    }
  }

  if (currentTopic) topics.push(currentTopic);
  return topics;
};

  // Topic manipulation functions
  const addTopic = () => {
    setSyllabus([
      ...syllabus,
      {
        id: `topic-${Date.now()}`,
        title: `Topic ${syllabus.length + 1}`,
        subtopics: [''],
        expanded: true
      }
    ]);
  };

  const removeTopic = (topicId: string) => {
    setSyllabus(syllabus.filter(topic => topic.id !== topicId));
  };

  const updateTopicTitle = (topicId: string, title: string) => {
    setSyllabus(
      syllabus.map(topic => 
        topic.id === topicId ? { ...topic, title } : topic
      )
    );
  };

  const toggleTopic = (topicId: string) => {
    setSyllabus(
      syllabus.map(topic => 
        topic.id === topicId ? { ...topic, expanded: !topic.expanded } : topic
      )
    );
  };

  const addSubtopic = (topicId: string) => {
    setSyllabus(
      syllabus.map(topic => 
        topic.id === topicId 
          ? { ...topic, subtopics: [...topic.subtopics, ''] } 
          : topic
      )
    );
  };

  const removeSubtopic = (topicId: string, index: number) => {
    setSyllabus(
      syllabus.map(topic => 
        topic.id === topicId 
          ? { 
              ...topic, 
              subtopics: topic.subtopics.filter((_, i) => i !== index) 
            } 
          : topic
      )
    );
  };

  const updateSubtopic = (topicId: string, index: number, value: string) => {
    setSyllabus(
      syllabus.map(topic => {
        if (topic.id === topicId) {
          const newSubtopics = [...topic.subtopics];
          newSubtopics[index] = value;
          return { ...topic, subtopics: newSubtopics };
        }
        return topic;
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 ">
          <div className='grid grid-cols-2 gap-4 ' >
            <div className="space-y-2">
              <Label htmlFor="courseId">Course ID</Label>
              <Input
                id="courseId"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="e.g., CS101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <Input
                id="courseName"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Introduction to Programming"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot</Label>
            <Select value={timeSlot} onValueChange={(value) => setTimeSlot(value as TimeSlot)} >
              <SelectTrigger className="w-100">
                <SelectValue placeholder="Select time slot" className="w-100"/>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeSlotSchedule).map(([slot, times]) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}: {times.join(', ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              min="1"
              max="6"
              required
            />
          </div>
          
          
          <div className="flex items-center space-x-2">
            <Switch
              id="aisyllabus"
              checked={enableAiSyllabus}
              onCheckedChange={handleAiSyllabusToggle}
            />
            <Label htmlFor="aisyllabus">Generate AI Syllabus</Label>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Syllabus</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addTopic}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Topic
              </Button>
            </div>
            
            {isGenerating ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Generating syllabus...</span>
              </div>
            ) : syllabus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {enableAiSyllabus 
                  ? "AI syllabus will appear here" 
                  : "Add topics to build your syllabus"}
              </div>
            ) : (
              <div className="max-h-[20vh]  space-y-2 pr-2 overflow-y-auto">
                {syllabus.map((topic) => (
                  <div key={topic.id} className="border rounded-md overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTopic(topic.id)}
                        >
                          {topic.expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Input
                          value={topic.title}
                          onChange={(e) => updateTopicTitle(topic.id, e.target.value)}
                          placeholder="Topic title"
                          className="border-none bg-transparent font-medium"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTopic(topic.id)}
                      >
                        <Minus className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    {topic.expanded && (
                      <div className="p-3 space-y-2">
                        <div className="space-y-2">
                          {topic.subtopics.map((subtopic, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={subtopic}
                                onChange={(e) => updateSubtopic(topic.id, index, e.target.value)}
                                placeholder={`Subtopic ${index + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSubtopic(topic.id, index)}
                              >
                                <Minus className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSubtopic(topic.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Subtopic
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full">
{loading ? 'AddingCourse...' : 'Add Course'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}