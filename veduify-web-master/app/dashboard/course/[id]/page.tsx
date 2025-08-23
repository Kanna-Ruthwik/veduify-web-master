"use client"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VeduMarkRenderer } from "@/components/VeduMarkRenderer";
import { parseVeduMark } from "@/lib/vedumark-parser"; import { generateTopicContent } from "@/lib/gemini"
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Code,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  FileText,
  Loader2,
  Search,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Download,
  Share2,
} from "lucide-react"


interface SyllabusTopic {
  id: string
  title: string
  subtopics: string[]
  expanded: boolean
}

interface Resource {
  type: string
  url: string
  title: string
  // add more fields as needed
}

interface StaticCourse {
  name: string
  credits: number
  timeSlot: string
  resources: Resource[]
  syllabus: SyllabusTopic[]
}

interface CoursePageProps {
  params: Promise<{
    id: string;
  }>
}

import { use } from "react"

export default function CoursePage({ params: paramsPromise }: CoursePageProps) {
  const params = use(paramsPromise); // 👈 unwrap the Promise
  const [course, setCourse] = useState<StaticCourse | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null)
  const [aiContent, setAiContent] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [completedSubtopics, setCompletedSubtopics] = useState<Set<string>>(new Set())
  const [bookmarkedSubtopics, setBookmarkedSubtopics] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [syllabus, setSyllabus] = useState<SyllabusTopic[]>(course?.syllabus || [])
  const [practiceProblems, setPracticeProblems] = useState<string[]>([])
  const [showPractice, setShowPractice] = useState(false)


  useEffect(() => {
    const fetchCourse = async (userId: string) => {
      try {
        const q = query(collection(db, 'users', userId, 'courses'), where("id", "==", params.id))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0]
          const data = docSnap.data() as StaticCourse
          setCourse(data)
          setSyllabus(data.syllabus)
        } else {
          console.error("No course found with id:", params.id)
        }
      } catch (error) {
        console.error("Error fetching course:", error)
      } finally {
        setLoadingCourse(false)
      }
    }

    const userId = auth?.currentUser?.uid; // or useAuth()?.user?.uid
    if (!userId) {
      console.error("User not authenticated")
      setLoadingCourse(false)
      return
    }
    fetchCourse(userId)
  }, [params.id])

  const generatePracticeProblems = async () => {
    //setIsGenerating(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const problems = [
        "Write a Python program to calculate the factorial of a number using recursion.",
        "Create a function that checks if a given string is a palindrome.",
        "Implement a simple calculator that can perform basic arithmetic operations.",
        "Write a program to find the largest element in a list without using built-in functions.",
        "Create a class to represent a bank account with deposit and withdrawal methods.",
      ]
      setPracticeProblems(problems)
      setShowPractice(true)
    } catch (error) {
      console.error("Error generating practice problems:", error)
    } finally {
      //setIsGenerating(false)
    }
  }

  const toggleTopicExpansion = (topicId: string) => {
    setSyllabus((prev) => prev.map((topic) => (topic.id === topicId ? { ...topic, expanded: !topic.expanded } : topic)))
  }


  const handleSubtopicClick = async (subtopic: string) => {
    setSelectedSubtopic(subtopic)
    setIsGenerating(true)

    try {
      const docRef = doc(db, "aiContents", subtopic)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        // Load cached content
        const cachedContent = docSnap.data().content
        setAiContent(cachedContent)
      } else {
        // Generate new content and store it
        const content = await generateTopicContent(subtopic)
        await setDoc(docRef, { content, updatedAt: Date.now() })
        setAiContent(content)
      }
    } catch (error) {
      console.error("Error fetching or generating content:", error)
      setAiContent("Error loading content. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  /*const handleSubtopicClick = (subtopic: string) => {
    setSelectedSubtopic(subtopic)
    generateContent(subtopic)
  }*/

  const toggleSubtopicCompletion = (subtopic: string) => {
    setCompletedSubtopics((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subtopic)) {
        newSet.delete(subtopic)
      } else {
        newSet.add(subtopic)
      }
      return newSet
    })
  }

  const toggleBookmark = (subtopic: string) => {
    setBookmarkedSubtopics((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subtopic)) {
        newSet.delete(subtopic)
      } else {
        newSet.add(subtopic)
      }
      return newSet
    })
  }

  const getTotalSubtopics = () => {
    return syllabus.reduce((total, topic) => total + topic.subtopics.length, 0)
  }

  const getCompletionPercentage = () => {
    const total = getTotalSubtopics()
    return total > 0 ? (completedSubtopics.size / total) * 100 : 0
  }

  const filteredSyllabus = syllabus
    .map((topic) => ({
      ...topic,
      subtopics: topic.subtopics.filter((subtopic) => subtopic.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((topic) => topic.subtopics.length > 0 || !searchQuery)

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading course...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Course Not Found</h3>
              <p className="text-muted-foreground">The requested course could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  else {
    const blocks = parseVeduMark(aiContent);

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{course.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary">{course.credits} Credits</Badge>
                  <Badge variant="outline">Time Slot {course.timeSlot}</Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {completedSubtopics.size}/{getTotalSubtopics()} Completed
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Course Progress</span>
                <span>{Math.round(getCompletionPercentage())}%</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-2" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Course Navigation */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Outline
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredSyllabus.map((topic) => (
                        <div key={topic.id} className="space-y-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start p-2 h-auto"
                            onClick={() => toggleTopicExpansion(topic.id)}
                          >
                            {topic.expanded ? (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            ) : (
                              <ChevronRight className="h-4 w-4 mr-2" />
                            )}
                            <span className="font-medium text-left flex-1">{topic.title}</span>
                          </Button>

                          {topic.expanded && (
                            <div className="ml-6 space-y-1">
                              {topic.subtopics.map((subtopic, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${selectedSubtopic === subtopic
                                    ? "bg-primary/10 border border-primary/20"
                                    : "hover:bg-muted"
                                    }`}
                                  onClick={() => handleSubtopicClick(subtopic)}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleSubtopicCompletion(subtopic)
                                    }}
                                  >
                                    {completedSubtopics.has(subtopic) ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <div className="h-4 w-4 border-2 border-muted-foreground rounded-full" />
                                    )}
                                  </Button>
                                  <span className="text-sm flex-1">{subtopic}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleBookmark(subtopic)
                                    }}
                                  >
                                    {bookmarkedSubtopics.has(subtopic) ? (
                                      <BookmarkCheck className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Bookmark className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Content Display */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {selectedSubtopic || "Select a topic to begin"}
                      </CardTitle>
                      {selectedSubtopic && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!selectedSubtopic) return
                              setIsGenerating(true)
                              try {
                                const content = await generateTopicContent(selectedSubtopic)
                                await setDoc(doc(db, "aiContents", selectedSubtopic), {
                                  content,
                                  updatedAt: Date.now(),
                                })
                                setAiContent(content)
                              } catch (error) {
                                console.error("Error regenerating content:", error)
                                setAiContent("Error regenerating content.")
                              } finally {
                                setIsGenerating(false)
                              }
                            }}
                            disabled={isGenerating}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                            Regenerate
                          </Button>

                          <Button variant="outline" size="sm" onClick={generatePracticeProblems} disabled={isGenerating}>
                            <Code className="h-4 w-4 mr-2" />
                            Practice
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (params.id) {
                                window.location.href = `/course_edit/${params.id}`;
                              }
                            }}
                            disabled={isGenerating}
                          >
                            Edit
                          </Button>

                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedSubtopic ? (
                      <div className="text-center py-12">
                        <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Ready to Learn?</h3>
                        <p className="text-muted-foreground">
                          Select a subtopic from the course outline to view AI-generated notes and explanations.
                        </p>
                      </div>
                    ) : isGenerating ? (
                      <div className="text-center py-12">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Generating Content...</h3>
                        <p className="text-muted-foreground">Creating personalized notes for this topic.</p>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <VeduMarkRenderer doc={blocks} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Practice Problems Dialog */}
                <Dialog open={showPractice} onOpenChange={setShowPractice}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Practice Problems</DialogTitle>
                      <DialogDescription>Test your understanding with these practice exercises.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-4">
                        {practiceProblems.map((problem, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">
                                  {index + 1}
                                </Badge>
                                <p className="flex-1">{problem}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold">{completedSubtopics.size}</p>
                          <p className="text-sm text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <BookmarkCheck className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold">{bookmarkedSubtopics.size}</p>
                          <p className="text-sm text-muted-foreground">Bookmarked</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-2xl font-bold">{getTotalSubtopics() - completedSubtopics.size}</p>
                          <p className="text-sm text-muted-foreground">Remaining</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
