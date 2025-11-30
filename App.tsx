
import React, { useState, useEffect } from 'react';
import { SearchResult, UniversityData, SavedUniversity } from './types';
import { searchGemini } from './services/geminiService';
import { supabase } from './supabaseClient';
import { UniversityView } from './components/UniversityView';
import { Icons } from './components/Icons';

const DISCIPLINES = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering", 
    "Civil Engineering", "Biomedical Engineering", "Chemical Engineering",
    "Physics", "Mathematics", "Biology", "Chemistry", 
    "Economics", "Psychology", "Business Administration (MBA)", 
    "Public Health", "Medicine", "Law", "Other"
];

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [data, setData] = useState<SearchResult>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Saved List State
  const [savedList, setSavedList] = useState<SavedUniversity[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Search State
  const [uniSearch, setUniSearch] = useState({
    name: '',
    level: 'Doctoral Studies (PhD)',
    discipline: 'Computer Science'
  });

  // Load saved data on mount from Supabase
  useEffect(() => {
    fetchSavedUniversities();
  }, []);

  const fetchSavedUniversities = async () => {
    if (!supabase) return; // Guard clause if DB is not configured

    setLoadingSaved(true);
    try {
        const { data: records, error } = await supabase
            .from('saved_universities')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        if (records) {
            const formatted: SavedUniversity[] = records.map(record => ({
                id: record.id,
                university: record.university_data,
                userNotes: record.user_notes,
                searchLevel: record.search_level,
                searchDiscipline: record.search_discipline,
                savedAt: new Date(record.created_at).toLocaleDateString()
            }));
            setSavedList(formatted);
        }
    } catch (err) {
        console.error('Error fetching saved universities:', err);
    } finally {
        setLoadingSaved(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniSearch.name) return;
    
    // Construct Query
    const query = `University: ${uniSearch.name}, Level: ${uniSearch.level}, Discipline: ${uniSearch.discipline}`;

    setLoading(true);
    setError(null);
    setData(null);

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

  const handleSave = async (notes: string) => {
      if (!data || !data.university) return;
      
      if (!supabase) {
        alert("Database connection is not configured (Supabase URL/Key missing). Cannot save.");
        return;
      }

      try {
          const { error } = await supabase
              .from('saved_universities')
              .insert([
                  { 
                      university_data: data.university,
                      user_notes: notes,
                      search_level: uniSearch.level,
                      search_discipline: uniSearch.discipline
                  }
              ]);

          if (error) throw error;

          // Refresh list
          fetchSavedUniversities();
          alert("University saved to database!");
      } catch (err) {
          console.error('Error saving university:', err);
          alert("Failed to save to database.");
      }
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this record?")) return;
      
      if (!supabase) {
         alert("Database connection is not configured.");
         return;
      }

      try {
          const { error } = await supabase
              .from('saved_universities')
              .delete()
              .eq('id', id);
          
          if (error) throw error;

          // Optimistic update or refresh
          setSavedList(prev => prev.filter(item => item.id !== id));
      } catch (err) {
          console.error('Error deleting record:', err);
          alert("Failed to delete record.");
      }
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 shadow-lg shadow-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('search')}>
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <Icons.GraduationCap size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">InfoSchool</h1>
                <p className="text-xs text-slate-500 font-medium">Comprehensive University Details by <span className="text-slate-300">S.M. Sheam</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                <button 
                    onClick={() => setActiveTab('search')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'search' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Icons.Search className="w-4 h-4" /> Search
                </button>
                <button 
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'saved' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Icons.Table className="w-4 h-4" /> Saved Database <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">{savedList.length}</span>
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Intro Card (Only on clean state) */}
        {!data && activeTab === 'search' && !loading && (
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
        {activeTab === 'search' && (
            <>
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
                            onSave={handleSave} 
                            searchContext={{
                                discipline: uniSearch.discipline,
                                level: uniSearch.level
                            }}
                        />
                    </div>
                )}
            </>
        )}

        {/* Saved Database View */}
        {activeTab === 'saved' && (
            <div className="animate-fade-in space-y-6">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icons.Table className="text-blue-500" /> Saved University Database
                        </h2>
                        <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                            {loadingSaved ? "..." : savedList.length} records
                        </span>
                    </div>
                    
                    {!supabase && (
                        <div className="p-4 bg-yellow-900/20 text-yellow-500 text-center text-sm border-b border-yellow-500/10">
                            Database connection not configured. Please set SUPABASE_URL and SUPABASE_KEY.
                        </div>
                    )}

                    {loadingSaved ? (
                         <div className="p-12 text-center text-slate-500">
                            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p>Loading your database...</p>
                         </div>
                    ) : savedList.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Icons.Table className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No saved records found. Search and save universities to build your database.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-200 font-semibold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">University Name</th>
                                        <th className="px-6 py-4">Discipline</th>
                                        <th className="px-6 py-4">Level</th>
                                        <th className="px-6 py-4">Saved At</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {savedList.map((item) => (
                                        <React.Fragment key={item.id}>
                                            <tr className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-white">{item.university.name}</td>
                                                <td className="px-6 py-4 text-blue-400">{item.searchDiscipline}</td>
                                                <td className="px-6 py-4">{item.searchLevel}</td>
                                                <td className="px-6 py-4 text-slate-500">{item.savedAt}</td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                        className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                                                        title="View Details"
                                                    >
                                                        {expandedId === item.id ? <Icons.ArrowRight className="w-4 h-4 -rotate-90" /> : <Icons.ArrowRight className="w-4 h-4 rotate-90" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 hover:bg-red-900/20 rounded-lg text-red-500 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Icons.Trash className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedId === item.id && (
                                                <tr>
                                                    <td colSpan={5} className="px-0 bg-slate-950/50 border-y border-blue-900/30">
                                                        <div className="p-6">
                                                            <UniversityView 
                                                                data={item} 
                                                                isSavedMode={true} 
                                                                searchContext={{
                                                                    discipline: item.searchDiscipline,
                                                                    level: item.searchLevel
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
