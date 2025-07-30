import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function generateSyllabus(courseName: string, credits: number): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Generate a brief and structured course syllabus for ${courseName} day-wise for ${credits} course. 
            The output should be in JSON array format without any extra text, which consists of Main Topic, Subtopics. 
            Example format: 
            [
                { "Main Topic": "<topic name>", "Subtopics": ["<subtopic1>", "<subtopic2>", ...] }
            ] `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('Syllabus generation response:', response);
    return response.text();
  } catch (error) {
    console.error('Error generating syllabus:', error);
    return '';
  }
}

export async function generateCourseResources(courseName: string, syllabus: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Based on the following course syllabus for "${courseName}", generate:
    1. A list of relevant YouTube videos and playlists (with actual URLs)
    2. Recommended PDF resources and study materials
    3. A concise formula sheet (if applicable)
    4. Interactive practice problems with:
       - Problem statement
       - Multiple choice options
       - Correct answer
       - Detailed explanation
    
    Format the response in JSON with the following structure:
    {
      "videos": [{"title": "", "url": "", "description": ""}],
      "pdfs": [{"title": "", "url": "", "description": ""}],
      "formulaSheet": "markdown formatted text",
      "practiceProblems": [{
        "question": "",
        "options": [],
        "correctAnswer": "",
        "explanation": ""
      }]
    }
    
    Syllabus:
    ${syllabus}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return {
        videos: [],
        pdfs: [],
        formulaSheet: '',
        practiceProblems: []
      };
    }
  } catch (error) {
    console.error('Error generating course resources:', error);
    return {
      videos: [],
      pdfs: [],
      formulaSheet: '',
      practiceProblems: []
    };
  }
}

export async function generateResources(course: {
  courseName: string;
  credits: number;
  syllabus: string;
}): Promise<{
  pdfs: string[];
  links: string[];
  videos: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Based on this course: ${course.courseName} (${course.credits} credits), suggest learning resources in this format:
    PDFs:
    - [list 5 relevant PDFs/documents]
    Links:
    - [list 5 relevant web resources]
    Videos:
    - [list 5 relevant video topics]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    const sections = content.split('\n');
    const pdfs = sections.filter(line => line.includes('PDF') || line.includes('document')).slice(0, 5);
    const links = sections.filter(line => line.includes('http')).slice(0, 5);
    const videos = sections.filter(line => line.includes('video') || line.includes('lecture')).slice(0, 5);

    return { pdfs, links, videos };
  } catch (error) {
    console.error('Error generating resources:', error);
    return { pdfs: [], links: [], videos: [] };
  }
}

export async function generateTopicContent(subtopic: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Write a structured and detailed explanation for the ${subtopic}.
Each subtopic should include:
- Clear explanation
- Code example (if applicable)
- tables (if applicable)
- Use the below given kind of formatting only no any extra text :
# The Wonders of Photosynthesis

Photosynthesis is the process by which green plants synthesize food from carbon dioxide and water in the presence of sunlight.

[math: A = \\pi r^2]
[math: F = ma]
[math: \\frac{d}{dx} e^x = e^x]

[chem: 6CO2 + 6H2O → C6H12O6 + 6O2]

[hint]
This process occurs in the **chloroplasts** of plant cells.

## The Reaction in Code

Let's represent this reaction in Python:

[code:python]
def photosynthesis():
    carbon_dioxide = 6
    water = 6
    glucose = 1
    oxygen = 6
    return f"{carbon_dioxide}CO2 + {water}H2O -> {glucose}C6H12O6 + {oxygen}O2"
[/code]

## Component Comparison

[table]
| Component     | Role                        |
| Sunlight      | Provides energy             |
| Water (H2O)   | Source of electrons         |
| Carbon Dioxide| Carbon source for glucose   |
| Chlorophyll   | Absorbs light energy        |
[/table]

## Quick Quiz

[quiz:single] Which molecule is the main product of photosynthesis?
- [ ] Oxygen
- [x] Glucose
- [ ] Carbon Dioxide

## Monthly CO2 Uptake (Simulated)

[chart:
type=bar;
x=label;
y=value;
data=[
  {"label": "Jan", "value": 40},
  {"label": "Feb", "value": 60},
  {"label": "Mar", "value": 45},
  {"label": "Apr", "value": 70}
]
[/chart]

## Watch and Learn

[video:src="https://www.youtube.com/embed/UPBMG5EYydo"]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating content for topic:", error);
    return "Error generating content.";
  }
}
