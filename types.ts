export interface NewsItem {
  source: string; // "TechCrunch", "University News", "AI Blog", "LinkedIn"
  headline: string;
  summary: string; // Brief AI-generated summary of the topic
  date: string;
}

export interface UniversityData {
  university: {
    name: string;
    country: string;
    location: string;
    rankings: {
      us_news_national: string;
      us_news_program: string;
    };
    acceptance_rate: string;
    minimum_gpa: string;
    application_fee: string;
    requirements: {
      gre: string;
      toefl: string;
      ielts: string;
      additional_tests: string;
    };
    deadlines: {
      fall: string;
      spring: string;
      summer: string;
    };
    costs: {
      tuition: string;
      living: string;
    };
    funding: {
      type: string; // "Centrally Managed", "Professor Managed", "Both", "Unknown"
      description: string;
    };
    departments: string[];
    program_requirements: {
      sop: string;
      lor: string;
      resume: string;
      writing_sample: string;
      portfolio: string;
    };
    official_links: {
      university_page: string;
      program_page: string;
      faculty_page: string;
      application_portal: string;
    };
    news: NewsItem[];
  };
}

export interface SavedUniversity extends UniversityData {
  id: string;
  savedAt: string;
  userNotes: string;
  searchLevel: string;
  searchDiscipline: string;
}

export interface Professor {
  name: string;
  designation: string;
  university: string;
  department: string;
  lab_name: string;
  research_interests: string[];
  email: string;
  webpage: string;
  google_scholar: string;
  linkedin: string;
  current_projects: string[];
}

export interface ProfessorData {
  professors: Professor[];
}

export type SearchResult = UniversityData | null;