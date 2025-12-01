import React, { useState, useEffect } from 'react';
import { SearchResult, UniversityData } from './types';
import { searchGemini } from './services/geminiService';
import { UniversityView } from './components/UniversityView';
import { Icons } from './components/Icons';
import { supabase } from './supabaseClient';

const DISCIPLINES = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering", 
    "Civil Engineering", "Biomedical Engineering", "Chemical Engineering",
    "Physics", "Mathematics", "Biology", "Chemistry", 
    "Economics", "Psychology", "Business Administration (MBA)", 
    "Public Health", "Medicine", "Law", "Other"
];

function App() {
  const [data, setData] = useState<SearchResult>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  // Feedback State
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Search State
  const [uniSearch, setUniSearch] = useState({
    name: '',
    level: 'Doctoral Studies (PhD)',
    discipline: 'Computer Science'
  });

  // Load visitor count from Supabase
  useEffect(() => {
    const updateVisitorCount = async () => {
      // If Supabase isn't connected, fallback to local simulation
      if (!supabase) {
        const storedVisits = localStorage.getItem('infoSchool_visits');
        let count = storedVisits ? parseInt(storedVisits, 10) : 0;
        count += 1;
        localStorage.setItem('infoSchool_visits', count.toString());
        setVisitorCount(10420 + count);
        return;
      }

      try {
        // 1. Get current count
        const { data: stats, error: fetchError } = await supabase
          .from('site_stats')
          .select('count')
          .eq('id', 1)
          .single();

        if (fetchError) throw fetchError;

        let currentCount = stats?.count || 0;

        // 2. Increment if this is a new session
        const sessionVisit = sessionStorage.getItem('infoSchool_session_visit');
        if (!sessionVisit) {
          const newCount = currentCount + 1;
          const { error: updateError } = await supabase
            .from('site_stats')
            .update({ count: newCount })
            .eq('id', 1);

          if (!updateError) {
            currentCount = newCount;
            sessionStorage.setItem('infoSchool_session_visit', 'true');
          }
        }

        setVisitorCount(currentCount);

      } catch (err) {
        console.error("Error updating visitor count:", err);
        // Fallback to showing 0 or a placeholder if DB fails
      }
    };

    updateVisitorCount();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniSearch.name) return;
    
    // Construct Query
    const query = `University: ${uniSearch.name}, Level: ${uniSearch.level}, Discipline: ${uniSearch.discipline}`;

    setLoading(true);
    setError(null);
    setData(null);
    setFeedbackStatus('idle'); // Reset feedback on new search
    setFeedbackText("");

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

  const submitFeedback = async (isHelpful: boolean) => {
      if (!supabase) {
          // Fallback to mailto if database not configured
          const subject = isHelpful ? "InfoSchool Feedback: Benefited!" : "InfoSchool Feedback: Suggestions";
          const body = `Hi S.M. Sheam,%0D%0A%0D%0AI searched for ${uniSearch.name} (${uniSearch.level}).%0D%0AResult was ${isHelpful ? "helpful" : "not helpful"}.%0D%0A%0D%0AComments:%0D%0A${encodeURIComponent(feedbackText)}`;
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
                      search_context: `${uniSearch.name} - ${uniSearch.level}` 
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
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setData(null); setUniSearch({...uniSearch, name: ''}); }}>
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <Icons.GraduationCap size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">InfoSchool</h1>
                <p className="text-xs text-slate-500 font-medium">Comprehensive University Details by <span className="text-slate-300">S.M. Sheam</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 text-xs text-slate-400">
                 <span>Total Site Visits:</span>
                 <span className="bg-slate-900 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                    {visitorCount > 0 ? visitorCount.toLocaleString() : "..."}
                 </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Intro Card (Only on clean state) */}
        {!data && !loading && (
             <div className="text-center py-16 animate-fade-in">
                 <div className="inline-block p-4 rounded-full bg-slate-900 border border-slate-800 shadow-2xl mb-6">
                     <Icons.GraduationCap className="w-12 h-12 text-blue-500" />
                 </div>
                 <h2 className="text-3xl font-bold text-white mb-2">Welcome to InfoSchool</h2>
                 <p className="text-slate-400 mb-6">Comprehensive University Details for Admissions</p>
                 <div className="inline-flex items-center gap-3 text-sm bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                     <span className="text-slate-500">Developed by</span>
                     <span className="font-semibold text-blue-400">S.M. Sheam, B.Sc. (BUET)</span>
                     <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                     <a href="https://sites.google.com/view/samiunmuntasirsheam" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-2">Visit Website</a>
                 </div>
             </div>
        )}

        {/* Search View */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 border border-slate-800 p-6 md:p-8 mb-10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>

            <form onSubmit={handleSearch} className="relative z-10">
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

        {error && (
            <div className="bg-red-950/20 text-red-400 p-4 rounded-xl border border-red-900/50 text-center flex items-center justify-center gap-2 animate-fade-in mb-8">
                <Icons.Alert size={18} /> {error}
            </div>
        )}

        {data && (
            <div className="animate-fade-in-up pb-10">
                <UniversityView 
                    data={data as UniversityData} 
                    searchContext={{
                        discipline: uniSearch.discipline,
                        level: uniSearch.level
                    }}
                />

                {/* Feedback Section */}
                <div className="mt-12 text-center animate-fade-in">
                    <div className="inline-block bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl max-w-lg w-full">
                        {feedbackStatus === 'sent' ? (
                            <div className="text-emerald-400 py-8">
                                <Icons.Check className="w-12 h-12 mx-auto mb-3" />
                                <h3 className="text-xl font-bold">Thank You!</h3>
                                <p className="text-slate-400 text-sm mt-2">Your feedback has been saved and sent to S.M. Sheam.</p>
                                <button onClick={() => setFeedbackStatus('idle')} className="mt-6 text-xs text-slate-500 hover:text-white underline">Send another</button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-white font-semibold mb-2">Was this result helpful?</h3>
                                <p className="text-slate-400 text-xs mb-4">Your suggestions help improve the AI engine.</p>
                                
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Write your suggestions on how to improve the site..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500/50 outline-none resize-none h-24 mb-4"
                                />

                                <div className="flex gap-4 justify-center">
                                    <button 
                                        onClick={() => submitFeedback(true)}
                                        disabled={feedbackStatus === 'sending'}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-900/20 hover:bg-green-900/30 text-green-400 border border-green-900/50 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                                    >
                                        <Icons.ThumbsUp className="w-4 h-4" /> Benefited
                                    </button>
                                    <button 
                                        onClick={() => submitFeedback(false)}
                                        disabled={feedbackStatus === 'sending'}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                                    >
                                        <Icons.ThumbsDown className="w-4 h-4" /> Not Helpful
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

      </main>

      <footer className="fixed bottom-0 w-full bg-slate-950/90 backdrop-blur border-t border-slate-800 py-3 z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-xs text-slate-500">
             <p>Developed by <span className="text-slate-300 font-medium tracking-wide">S.M. SHEAM</span></p>
             <span className="hidden md:inline text-slate-700">|</span>
             <p>InfoSchool AI Engine</p>
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