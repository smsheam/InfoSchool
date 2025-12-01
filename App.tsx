import React, { useState, useEffect } from 'react';
import { SearchResult, UniversityData, RecommendationResult, StudentProfile } from './types';
import { searchGemini, getStudentRecommendations } from './services/geminiService';
import { UniversityView } from './components/UniversityView';
import { RecommendationView } from './components/RecommendationView';
import { Icons } from './components/Icons';
import { supabase } from './supabaseClient';

const DISCIPLINES = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering", 
    "Civil Engineering", "Biomedical Engineering", "Chemical Engineering",
    "Physics", "Mathematics", "Biology", "Chemistry", 
    "Economics", "Psychology", "Business Administration (MBA)", 
    "Public Health", "Medicine", "Law", "Other"
];

type AppMode = 'search' | 'recommend';

function App() {
  const [mode, setMode] = useState<AppMode>('search');
  
  // Search State
  const [data, setData] = useState<SearchResult>(null);
  const [recommendationData, setRecommendationData] = useState<RecommendationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [dbConnected, setDbConnected] = useState<boolean>(!!supabase);

  // Feedback State
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<boolean | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // University Search Input
  const [uniSearch, setUniSearch] = useState({
    name: '',
    level: 'Doctoral Studies (PhD)',
    discipline: 'Computer Science'
  });

  // Profile Search Input
  const [profile, setProfile] = useState<StudentProfile>({
      cgpa: '',
      gre: '',
      toefl: '',
      publications: '',
      major: 'Computer Science',
      interest: ''
  });

  // Load visitor count from Supabase
  useEffect(() => {
    const updateVisitorCount = async () => {
      // If Supabase isn't connected, fallback to local simulation
      if (!supabase) {
        setDbConnected(false);
        const storedVisits = localStorage.getItem('infoSchool_visits');
        let count = storedVisits ? parseInt(storedVisits, 10) : 0;
        count += 1;
        localStorage.setItem('infoSchool_visits', count.toString());
        setVisitorCount(count); 
        return;
      }

      try {
        setDbConnected(true);
        // 1. Get current count (row ID 1)
        const { data: stats, error: fetchError } = await supabase
          .from('site_stats')
          .select('count')
          .eq('id', 1)
          .single();

        if (fetchError) {
             console.warn("Error fetching stats, defaulting to local fallback", fetchError);
             // If table doesn't exist or RLS issue, keep basic count
             setVisitorCount(1);
        } else if (stats) {
             let currentCount = stats.count;

             // 2. Increment if this is a new session
             const sessionVisit = sessionStorage.getItem('infoSchool_session_visit');
             if (!sessionVisit) {
               const newCount = currentCount + 1;
               
               // Upsert logic (Insert if not exists, Update if exists)
               const { error: upsertError } = await supabase
                 .from('site_stats')
                 .upsert({ id: 1, count: newCount });
     
               if (!upsertError) {
                 currentCount = newCount;
                 sessionStorage.setItem('infoSchool_session_visit', 'true');
               }
             }
             setVisitorCount(currentCount);
        }
      } catch (err) {
        console.error("Error updating visitor count:", err);
        setDbConnected(false);
      }
    };

    updateVisitorCount();
  }, []);

  const handleUniversitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniSearch.name) return;
    
    setLoading(true);
    setError(null);
    setData(null);
    setFeedbackStatus('idle');
    setFeedbackText("");
    setFeedbackRating(null);

    const query = `University: ${uniSearch.name}, Level: ${uniSearch.level}, Discipline: ${uniSearch.discipline}`;

    try {
      const result = await searchGemini(query);
      if (!result.university) throw new Error("Invalid format");
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileAnalysis = async (e: React.FormEvent) => {
      e.preventDefault();
      // Basic validation
      if (!profile.cgpa || !profile.gre || !profile.toefl) {
          setError("Please fill in CGPA, GRE, and TOEFL scores.");
          return;
      }

      setLoading(true);
      setError(null);
      setRecommendationData(null);
      setFeedbackStatus('idle');
      setFeedbackText("");
      setFeedbackRating(null);

      try {
          const result = await getStudentRecommendations(profile);
          setRecommendationData(result);
      } catch (err: any) {
          console.error(err);
          setError("Failed to generate recommendations. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  const submitFeedback = async () => {
      if (feedbackRating === null) return;
      
      const isHelpful = feedbackRating;

      if (!supabase) {
          const subject = isHelpful ? "InfoSchool Feedback: Benefited!" : "InfoSchool Feedback: Suggestions";
          const body = `Hi S.M. Sheam,%0D%0A%0D%0AContext: ${mode === 'search' ? uniSearch.name : 'Profile Recommendation'}%0D%0ARating: ${isHelpful ? "Helpful" : "Not Helpful"}%0D%0A%0D%0AComments:%0D%0A${encodeURIComponent(feedbackText)}`;
          window.location.href = `mailto:smsheam1@gmail.com?subject=${subject}&body=${body}`;
          return;
      }

      setFeedbackStatus('sending');
      
      try {
          const { error } = await supabase
              .from('feedbacks')
              .insert([
                  { 
                      message: feedbackText, 
                      is_helpful: isHelpful,
                      search_context: mode === 'search' ? `${uniSearch.name} - ${uniSearch.level}` : `Profile Analysis (${profile.major})` 
                  }
              ]);

          if (error) throw error;
          setFeedbackStatus('sent');
      } catch (err) {
          console.error("Error sending feedback:", err);
          alert("Could not save feedback. Please try again.");
          setFeedbackStatus('idle');
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 shadow-lg shadow-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setData(null); setRecommendationData(null); setUniSearch({...uniSearch, name: ''}); }}>
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <Icons.GraduationCap size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">InfoSchool</h1>
                <p className="text-xs text-slate-500 font-medium">Comprehensive University Details by <span className="text-slate-300">S.M. Sheam</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 text-xs text-slate-400">
                 <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                 <span>Visits:</span>
                 <span className="bg-slate-900 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                    {visitorCount.toLocaleString()}
                 </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Intro Card (Only on clean state) */}
        {!data && !recommendationData && !loading && (
             <div className="text-center py-16 animate-fade-in">
                 <div className="inline-block p-4 rounded-full bg-slate-900 border border-slate-800 shadow-2xl mb-6">
                     <Icons.GraduationCap className="w-12 h-12 text-blue-500" />
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-2">Welcome to InfoSchool</h2>
                 <p className="text-slate-400 mb-6">Graduate Admissions AI & Profile Evaluator</p>
                 <div className="inline-flex items-center gap-3 text-sm bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                     <span className="text-slate-500">Developed by</span>
                     <span className="font-semibold text-blue-400">S.M. Sheam, B.Sc. (BUET)</span>
                     <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                     <a href="https://sites.google.com/view/samiunmuntasirsheam" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-2">Visit Website</a>
                 </div>
             </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
            <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex gap-2 shadow-lg">
                <button 
                    onClick={() => { setMode('search'); setData(null); setRecommendationData(null); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'search' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Icons.Search className="w-4 h-4" /> University Search
                </button>
                <button 
                    onClick={() => { setMode('recommend'); setData(null); setRecommendationData(null); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'recommend' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Icons.Calculator className="w-4 h-4" /> Profile Assessment
                </button>
            </div>
        </div>

        {/* --- UNIVERSITY SEARCH FORM --- */}
        {mode === 'search' && (
            <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 border border-slate-800 p-6 md:p-8 mb-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                <form onSubmit={handleUniversitySearch} className="relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">University Name</label>
                            <div className="relative group">
                                <Icons.Search className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    value={uniSearch.name}
                                    onChange={(e) => setUniSearch({...uniSearch, name: e.target.value})}
                                    placeholder="e.g. Stanford University"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-200 placeholder-slate-600 shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Level</label>
                            <div className="relative group">
                            <select
                                value={uniSearch.level}
                                onChange={(e) => setUniSearch({...uniSearch, level: e.target.value})}
                                className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-200 appearance-none cursor-pointer shadow-inner"
                            >
                                <option value="Doctoral Studies (PhD)">Doctoral Studies (PhD)</option>
                                <option value="Master of Science (M.Sc.)">Master of Science (M.Sc.)</option>
                                <option value="Undergraduate">Undergraduate</option>
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                <Icons.ArrowRight className="w-4 h-4 rotate-90" />
                            </div>
                            </div>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Discipline</label>
                            <div className="relative group">
                                <select 
                                    value={uniSearch.discipline}
                                    onChange={(e) => setUniSearch({...uniSearch, discipline: e.target.value})}
                                    className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-200 appearance-none cursor-pointer shadow-inner"
                                >
                                    {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                    <Icons.ArrowRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <button 
                            type="submit"
                            disabled={loading || !uniSearch.name}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 font-semibold flex items-center justify-center gap-2 h-[50px] border border-white/10"
                            >
                            {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : "Search"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {/* --- PROFILE ASSESSMENT FORM --- */}
        {mode === 'recommend' && (
            <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 border border-slate-800 p-6 md:p-8 mb-10 relative overflow-hidden animate-fade-in">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                <form onSubmit={handleProfileAnalysis} className="relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Major & Interest</label>
                            <div className="flex gap-2">
                                <select 
                                    value={profile.major}
                                    onChange={(e) => setProfile({...profile, major: e.target.value})}
                                    className="w-1/2 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 outline-none text-slate-200"
                                >
                                    {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input
                                    type="text"
                                    value={profile.interest}
                                    onChange={(e) => setProfile({...profile, interest: e.target.value})}
                                    placeholder="Research Interest (e.g. AI)"
                                    className="w-1/2 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 outline-none text-slate-200"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Stats</label>
                             <div className="flex gap-2">
                                <input type="text" value={profile.cgpa} onChange={(e) => setProfile({...profile, cgpa: e.target.value})} placeholder="CGPA (e.g. 3.8)" className="w-1/2 px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 outline-none text-slate-200 text-center" />
                                <input type="text" value={profile.gre} onChange={(e) => setProfile({...profile, gre: e.target.value})} placeholder="GRE (e.g. 320)" className="w-1/2 px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 outline-none text-slate-200 text-center" />
                             </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">More Stats</label>
                            <div className="flex gap-2">
                                <input type="text" value={profile.toefl} onChange={(e) => setProfile({...profile, toefl: e.target.value})} placeholder="TOEFL" className="w-1/3 px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 outline-none text-slate-200 text-center" />
                                <input type="text" value={profile.publications} onChange={(e) => setProfile({...profile, publications: e.target.value})} placeholder="Publications (No.)" className="w-2/3 px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 outline-none text-slate-200" />
                            </div>
                        </div>

                        <div className="lg:col-span-4 mt-2">
                             <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-xl transition-all shadow-lg shadow-purple-900/40 font-semibold flex items-center justify-center gap-2 h-[50px] border border-white/10"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : "Analyze Profile & Recommend Universities"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )}

        {error && (
            <div className="bg-red-950/20 text-red-400 p-4 rounded-xl border border-red-900/50 text-center flex items-center justify-center gap-2 animate-fade-in mb-8">
                <Icons.Alert size={18} /> {error}
            </div>
        )}

        {/* RESULTS AREA */}
        <div className="animate-fade-in-up pb-10">
            {mode === 'search' && data && (
                <UniversityView 
                    data={data as UniversityData} 
                    searchContext={{
                        discipline: uniSearch.discipline,
                        level: uniSearch.level
                    }}
                />
            )}

            {mode === 'recommend' && recommendationData && (
                <RecommendationView data={recommendationData} />
            )}

            {/* SHARED FEEDBACK SECTION */}
            {(data || recommendationData) && (
                <div className="mt-12 text-center animate-fade-in">
                    <div className="inline-block bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl max-w-lg w-full">
                        {feedbackStatus === 'sent' ? (
                            <div className="text-emerald-400 py-8">
                                <Icons.Check className="w-12 h-12 mx-auto mb-3" />
                                <h3 className="text-xl font-bold">Thank You!</h3>
                                <p className="text-slate-400 text-sm mt-2">Your feedback has been saved and sent to S.M. Sheam.</p>
                                <button onClick={() => { setFeedbackStatus('idle'); setFeedbackRating(null); setFeedbackText(""); }} className="mt-6 text-xs text-slate-500 hover:text-white underline">Send another</button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-white font-semibold mb-2">How was your experience?</h3>
                                <p className="text-slate-400 text-xs mb-4">Select an option and submit your thoughts.</p>
                                
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Write your suggestions on how to improve the site..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500/50 outline-none resize-none h-24 mb-4"
                                />

                                <div className="flex gap-4 justify-center mb-4">
                                    <button 
                                        onClick={() => setFeedbackRating(true)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border ${feedbackRating === true ? 'bg-green-600 text-white border-green-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                    >
                                        <Icons.ThumbsUp className="w-4 h-4" /> Benefited
                                    </button>
                                    <button 
                                        onClick={() => setFeedbackRating(false)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border ${feedbackRating === false ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
                                    >
                                        <Icons.ThumbsDown className="w-4 h-4" /> Not Helpful
                                    </button>
                                </div>

                                <button 
                                    onClick={submitFeedback}
                                    disabled={feedbackRating === null || feedbackStatus === 'sending'}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {feedbackStatus === 'sending' ? 'Sending...' : (
                                        <>Submit Feedback <Icons.Send className="w-4 h-4" /></>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

      </main>

      <footer className="fixed bottom-0 w-full bg-slate-900/90 backdrop-blur border-t border-slate-800 py-3 z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-xs text-slate-500">
             <p>Developed by <span className="text-slate-300 font-medium tracking-wide">S.M. SHEAM</span></p>
             <span className="hidden md:inline text-slate-700">|</span>
             <p>InfoSchool AI Engine</p>
             <span className="hidden md:inline text-slate-700">|</span>
             <p className={dbConnected ? "text-green-500/70" : "text-red-500/70"}>
                {dbConnected ? "● Live Database" : "○ Offline Mode"}
             </p>
          </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-up {
            animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default App;