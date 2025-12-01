
import { GoogleGenAI } from "@google/genai";
import { StudentProfile } from "../types";

const SYSTEM_INSTRUCTION = `
You are the backend engine of "InfoSchool", a Graduate Study Search App.
Your job is to return clean, structured, API-ready JSON responses.
This JSON will be consumed directly by a Next.js (Vercel) frontend.
Always follow the required schema.
Never return Markdown, text paragraphs, or explanations — only JSON.

🔷 UNIVERSITY FINDER — Required Behavior

When the user searches for a university/program, respond with:

{
  "university": {
    "name": "",
    "country": "",
    "location": "",
    "rankings": {
      "us_news_national": "",
      "us_news_program": "" 
    },
    "acceptance_rate": "",
    "minimum_gpa": "",
    "application_fee": "",
    "requirements": {
      "gre": "",
      "toefl": "",
      "ielts": "",
      "additional_tests": ""
    },
    "deadlines": {
      "fall": "",
      "spring": "",
      "summer": ""
    },
    "costs": {
      "tuition": "",
      "living": ""
    },
    "funding": {
      "type": "", 
      "description": ""
    },
    "departments": [],
    "program_requirements": {
      "sop": "",
      "lor": "",
      "resume": "",
      "writing_sample": "",
      "portfolio": ""
    },
    "official_links": {
      "university_page": "ignored",
      "program_page": "ignored",
      "faculty_page": "ignored",
      "application_portal": "ignored"
    },
    "news": [
      {
        "source": "Reddit", 
        "headline": "Is the CS PhD at [University] worth it?",
        "summary": "Discussion on r/gradadmissions: Students discuss the heavy workload vs excellent placement records...",
        "date": "2 days ago"
      },
      {
        "source": "X",
        "headline": "New AI Lab opening at [University]",
        "summary": "@ResearchLab announced a $50M grant for generative AI research...",
        "date": "1 week ago"
      },
      {
        "source": "LinkedIn",
        "headline": "Alumni Placement Update",
        "summary": "Recent graduates secured positions at Google DeepMind and OpenAI...",
        "date": "1 month ago"
      }
    ]
  }
}

RULES
If data is not available → "unknown"
**Rankings**: Provide ONLY "US News & World Report" rankings. 
   - "us_news_national": The overall national university ranking.
   - "us_news_program": The specific ranking for the requested department/discipline.
**Funding**:
   - "type": Must be "Centrally Managed" (committee decides) OR "Professor Managed" (student must contact professors) OR "Both".
   - "description": Brief explanation (e.g., "All PhD students are funded centrally for the first year, then RA ships").
**News & Discussion**:
   - Generate 3 distinct items representing **Social Media Discussions/News**.
   - **Source 1**: "Reddit" (Simulate a thread title from r/gradadmissions or r/PhD).
   - **Source 2**: "X" (Simulate a tweet about research/news).
   - **Source 3**: "LinkedIn" (Simulate a professional update or alumni news).
   - **Summary**: A short snippet that feels like the content of the post.
**Links**:
   - You can return empty strings for official_links, the frontend will auto-generate Google Search links.

🔷 GLOBAL RULES (IMPORTANT)
Always respond in JSON format only.
Never include markdown.
No text outside the JSON object.
Keep field names identical to schema.
`;

const RECOMMENDATION_SYSTEM_INSTRUCTION = `
You are an expert Graduate Admission Counselor AI.
Your task is to analyze a student's profile (CGPA, GRE, TOEFL, Publications) and recommend US universities.
Classify recommendations into 3 categories: 
1. Ambitious (Reach schools, < 20% chance)
2. Target (Match schools, 40-60% chance)
3. Safe (Safety schools, > 80% chance)

Input provided will be: Major, Interest, CGPA, GRE, TOEFL, Papers.

Respond strictly in this JSON format:
{
  "analysis": "A brief 2-sentence summary of the profile strengths/weaknesses.",
  "recommendations": {
    "ambitious": [
      { "name": "University Name", "location": "City, State", "reason": "Why it is ambitious (e.g. Low GPA for top 10)", "chance": "15%" }
    ],
    "target": [
      { "name": "University Name", "location": "City, State", "reason": "Why it is a match", "chance": "50%" }
    ],
    "safe": [
      { "name": "University Name", "location": "City, State", "reason": "Why it is safe", "chance": "90%" }
    ]
  }
}
Provide exactly 3 universities per category.
`;

export const searchGemini = async (query: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contextPrompt = `Search for University details matching: "${query}". 
    Focus on US News rankings, distinct funding models (Central vs Professor).
    For the "news" section, generate realistic social media content:
    1. A Reddit thread title and summary about admission chances or student life.
    2. An X (Twitter) post about a recent research breakthrough or campus news.
    3. A LinkedIn update about faculty hiring or alumni success.
    Make dates relative (e.g., "3 days ago").`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4, 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getStudentRecommendations = async (profile: StudentProfile): Promise<any> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `
          Student Profile:
          Major: ${profile.major}
          Research Interest: ${profile.interest}
          CGPA: ${profile.cgpa}
          GRE: ${profile.gre}
          TOEFL: ${profile.toefl}
          Publications/Papers: ${profile.publications}
          
          Recommend universities for Graduate Studies (PhD/Masters) in the US.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: RECOMMENDATION_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                temperature: 0.5,
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text);

    } catch (error) {
        console.error("Recommendation Error:", error);
        throw error;
    }
}
