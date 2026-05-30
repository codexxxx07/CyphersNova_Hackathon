const ROADMAPS = {
  coding: {
    title: 'Web Development Roadmap',
    keywords: ['coding', 'code', 'programming', 'developer', 'web dev', 'software'],
    steps: [
      { title: 'Learn HTML & CSS Basics', description: 'Build static pages and understand layout, typography, and responsive design fundamentals.' },
      { title: 'Master JavaScript', description: 'Learn variables, functions, DOM manipulation, and async concepts like fetch and promises.' },
      { title: 'Pick a Framework', description: 'Start with React or Vue. Build small projects like a todo app or portfolio site.' },
      { title: 'Backend Basics', description: 'Learn Node.js or Python. Understand APIs, databases, and authentication.' },
      { title: 'Build Real Projects', description: 'Create 2–3 portfolio projects. Deploy them on GitHub Pages or Vercel.' },
      { title: 'Apply & Intern', description: 'Contribute to open source, apply for internships, and keep learning new tools.' },
    ],
  },
  neet: {
    title: 'Medical (NEET) Prep Roadmap',
    keywords: ['neet', 'medical', 'doctor', 'mbbs', 'biology', 'pcb'],
    steps: [
      { title: 'NCERT Foundation', description: 'Complete NCERT for Physics, Chemistry, and Biology. Read every line carefully.' },
      { title: 'Concept Clarity', description: 'Use reference books for tough topics. Focus on understanding, not memorizing.' },
      { title: 'Daily Practice', description: 'Solve 50–100 MCQs daily. Track weak areas and revise them weekly.' },
      { title: 'Mock Tests', description: 'Take full-length mock tests every week. Analyze mistakes and improve speed.' },
      { title: 'Revision Cycle', description: 'Create short notes and flashcards. Revise entire syllabus at least 3 times.' },
      { title: 'Exam Strategy', description: 'Practice time management. Focus on accuracy over attempting every question.' },
    ],
  },
  business: {
    title: 'Entrepreneurship Roadmap',
    keywords: ['business', 'startup', 'entrepreneur', 'founder', 'company'],
    steps: [
      { title: 'Find a Problem', description: 'Identify real problems people face. Talk to potential customers before building.' },
      { title: 'Validate Your Idea', description: 'Create a simple landing page or MVP. Get feedback from at least 20 people.' },
      { title: 'Learn Business Basics', description: 'Understand revenue models, pricing, marketing, and basic finance.' },
      { title: 'Build Your MVP', description: 'Launch the smallest version of your product. Ship fast and iterate.' },
      { title: 'Grow & Market', description: 'Use social media, content marketing, and word-of-mouth to find users.' },
      { title: 'Scale Smart', description: 'Reinvest profits, build a team, and focus on what works. Stay lean early on.' },
    ],
  },
  default: {
    title: 'General Study Roadmap',
    keywords: [],
    steps: [
      { title: 'Define Your Goal', description: 'Write down exactly what you want to achieve and by when. Be specific.' },
      { title: 'Break It Down', description: 'Split your goal into weekly milestones. Small wins keep you motivated.' },
      { title: 'Create a Schedule', description: 'Block 1–2 hours daily for focused study. Consistency beats cramming.' },
      { title: 'Find Resources', description: 'Pick 2–3 quality resources (books, videos, courses). Avoid resource hopping.' },
      { title: 'Track Progress', description: 'Use a planner to check off tasks daily. Review what you learned each week.' },
      { title: 'Stay Accountable', description: 'Join a study group or find a buddy. Share progress and ask for help when stuck.' },
    ],
  },
};

const CHAT_RESPONSES = [
  {
    keywords: ['start coding', 'begin coding', 'learn coding', 'how to code'],
    reply: 'Great choice! Start with HTML & CSS (1–2 weeks), then JavaScript (3–4 weeks). Build a simple portfolio site as your first project. Use free resources like freeCodeCamp or The Odin Project.',
  },
  {
    keywords: ['time table', 'timetable', 'schedule', 'daily plan'],
    reply: 'A solid study timetable: Morning (2 hrs) – hardest subject. Afternoon (1 hr) – revision. Evening (1 hr) – practice problems. Take 10-min breaks every 45 mins. Sleep 7–8 hours — rest is part of studying!',
  },
  {
    keywords: ['neet', 'medical', 'biology'],
    reply: 'For NEET prep: Prioritize NCERT Biology (it covers ~90% of questions). Do 100 MCQs daily. Revise weak chapters every Sunday. Take one full mock test per week and analyze every mistake.',
  },
  {
    keywords: ['motivation', 'demotivated', 'give up', 'stressed'],
    reply: 'Feeling stuck is normal. Break your task into something tiny (just 15 mins). Progress > perfection. Remember why you started. Talk to a friend or mentor — you don\'t have to do this alone.',
  },
  {
    keywords: ['exam', 'test', 'preparation'],
    reply: 'Exam prep tips: Start with past papers to understand the pattern. Focus 70% on weak areas, 30% on revision. Night before: light revision only, no new topics. Stay calm — you\'ve prepared for this.',
  },
  {
    keywords: ['business', 'startup', 'entrepreneur'],
    reply: 'Start by solving one real problem for real people. Validate before building. Read "The Lean Startup" and follow indie hackers on Twitter/X. Your first goal: get 10 people to pay for something.',
  },
];

const DEFAULT_CHAT_REPLY =
  'I\'m here to help! Try asking about "start coding", "time table", "NEET prep", "exam tips", or "motivation". Be specific and I\'ll give you actionable advice.';
