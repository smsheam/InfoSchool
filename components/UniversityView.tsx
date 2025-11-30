import React, { useState } from 'react';
import { UniversityData, SavedUniversity } from '../types';
import { Icons } from './Icons';

interface Props {
  data: UniversityData | SavedUniversity;
  onSave?: (notes: string) => void;
  isSavedMode?: boolean;
  searchContext?: {
    discipline: string;
    level: string;
  };
}

const InfoCard = ({ icon: Icon, title, children, accentColor = "blue" }: { icon: any, title: string, children?: React.ReactNode, accentColor?: string }) => {
  const accentClass = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }[accentColor] || "text-blue-400 bg-blue-500/10 border-blue-500/20";

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all duration-300 h-full">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className={`p-2 rounded-lg ${accentClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-slate-200 font-semibold tracking-wide text-sm uppercase">{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-start py-1.5 border-b border-slate-800/50 last:border-0 group">
    <span className="text-slate-500 font-medium shrink-0 mr-4 text-xs uppercase tracking-wider pt-0.5 group-hover:text-slate-400 transition-colors">{label}</span>
    <span className="text-slate-300 text-right font-medium leading-tight">{value === 'unknown' ? 'N/A' : value}</span>
  </div>
);

export const UniversityView: React.FC<Props> = ({ data, onSave, isSavedMode = false, searchContext }) => {
  const { university } = data;
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  if (!university) return null;

  const discipline = searchContext?.discipline || "Graduate";
  const level = searchContext?.level || "Admission";

  const getGoogleSearchUrl = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const getLinkedInSearchUrl = (query: string) => `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`;

  const handleSave = () => {
    if (onSave) {
      onSave(notes);
      setSaved(true);
    }
  };

  // Helper for Social Media styling
  const getSocialStyle = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('reddit')) return {
        bg: 'bg-[#FF4500]/5', border: 'border-[#FF4500]/20', icon: <Icons.MessageSquare className="w-4 h-4 text-[#FF4500]" />, text: 'text-[#FF4500]', label: 'r/gradadmissions'
    };
    if (s.includes('x') || s.includes('twitter')) return {
        bg: 'bg-black/40', border: 'border-slate-700', icon: <Icons.Twitter className="w-4 h-4 text-white" />, text: 'text-white', label: '@UniversityUpdate'
    };
    if (s.includes('linkedin')) return {
        bg: 'bg-[#0077b5]/5', border: 'border-[#0077b5]/20', icon: <Icons.Linkedin className="w-4 h-4 text-[#0077b5]" />, text: 'text-[#0077b5]', label: 'LinkedIn Post'
    };
    return {
        bg: 'bg-slate-800/50', border: 'border-slate-700', icon: <Icons.Hash className="w-4 h-4 text-slate-400" />, text: 'text-slate-400', label: 'News Update'
    };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Section */}
      <div className="relative bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none -mt-20 -mr-20"></div>
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none -mb-10 -ml-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                <Icons.MapPin className="w-3 h-3" /> {university.location}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {university.name}
            </h2>
            <p className="text-slate-400 text-lg flex items-center gap-2">
              <span className="text-slate-600">|</span> {university.country}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-4 rounded-2xl text-center min-w-[100px]">
                <div className="text-2xl font-bold text-white mb-1">{university.rankings.us_news_national || 'N/A'}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">National</div>
            </div>
             <div className="bg-blue-900/20 backdrop-blur border border-blue-500/30 p-4 rounded-2xl text-center min-w-[100px]">
                <div className="text-2xl font-bold text-blue-400 mb-1">{university.rankings.us_news_program || 'N/A'}</div>
                <div className="text-[10px] text-blue-300/70 uppercase font-bold tracking-wider">Program</div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Smart Google Search Triggers */}
        <div className="mt-8 flex flex-wrap gap-3">
             <a href={getGoogleSearchUrl(`${university.name} official website`)} target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-black/20 group">
                <Icons.Building className="w-4 h-4 text-blue-400 group-hover:text-blue-300"/> University
             </a>
             
             <a href={getGoogleSearchUrl(`${university.name} ${discipline} graduate program`)} target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-black/20 group">
                <Icons.BookOpen className="w-4 h-4 text-purple-400 group-hover:text-purple-300"/> Program
             </a>
             
             <a href={getGoogleSearchUrl(`${university.name} ${discipline} faculty`)} target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-black/20 group">
                <Icons.Users className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300"/> Faculty
             </a>

             <a href={getGoogleSearchUrl(`${university.name} ${level} application portal`)} target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-900/50 ml-auto">
                Apply Now <Icons.ExternalLink className="w-4 h-4"/>
             </a>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <InfoCard icon={Icons.Calendar} title="Application Deadlines" accentColor="purple">
          <DetailRow label="Fall Intake" value={university.deadlines.fall} />
          <DetailRow label="Spring Intake" value={university.deadlines.spring} />
          <DetailRow label="Summer Intake" value={university.deadlines.summer} />
          <div className="mt-4 pt-3 border-t border-slate-800">
             <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">
                <Icons.Alert className="w-3 h-3 text-purple-400" /> Verify on official site
             </div>
          </div>
        </InfoCard>

        <InfoCard icon={Icons.DollarSign} title="Costs & Funding" accentColor="emerald">
          <DetailRow label="Tuition / Year" value={university.costs.tuition} />
          <DetailRow label="Est. Living" value={university.costs.living} />
          <DetailRow label="App Fee" value={university.application_fee} />
          
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                 Funding Model (Central or Professor)
            </p>
            <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-xl">
                 <div className="text-emerald-300 font-bold text-sm mb-1">
                    {university.funding.type}
                 </div>
                 <p className="text-xs text-emerald-400/70 leading-relaxed">
                    {university.funding.description}
                 </p>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={Icons.GraduationCap} title="Admission Stats" accentColor="amber">
          <DetailRow label="Acceptance Rate" value={university.acceptance_rate} />
          <DetailRow label="Min GPA" value={university.minimum_gpa} />
          <div className="pt-4 mt-2">
             <div className="grid grid-cols-2 gap-3 text-xs">
                 <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center flex flex-col justify-center">
                    <span className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">GRE</span>
                    <span className="text-slate-200 font-semibold truncate w-full">{university.requirements.gre}</span>
                 </div>
                 <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center flex flex-col justify-center">
                    <span className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">TOEFL</span>
                    <span className="text-slate-200 font-semibold truncate w-full">{university.requirements.toefl}</span>
                 </div>
             </div>
             <div className="mt-3 text-xs text-slate-400 flex justify-between items-center px-1">
                <span>IELTS Requirement:</span>
                <span className="text-slate-200 font-medium">{university.requirements.ielts}</span>
             </div>
          </div>
        </InfoCard>

        <InfoCard icon={Icons.FileText} title="Document Requirements" accentColor="rose">
            <DetailRow label="SOP" value={university.program_requirements.sop} />
            <DetailRow label="LORs" value={university.program_requirements.lor} />
            <DetailRow label="Resume" value={university.program_requirements.resume} />
            <DetailRow label="Writing Sample" value={university.program_requirements.writing_sample} />
        </InfoCard>

        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <Icons.BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-slate-200 font-semibold tracking-wide text-sm uppercase">Research Areas & Departments</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
            {university.departments.map((dept, idx) => (
                <span key={idx} className="bg-slate-950 text-slate-300 border border-slate-700 hover:border-indigo-500/50 hover:text-indigo-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-default shadow-sm">
                    {dept}
                </span>
            ))}
            </div>
        </div>
      </div>
    
      {/* News and Discussion Section */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
                    <Icons.MessageSquare className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-slate-200 font-bold text-lg">News and Discussion</h3>
                    <p className="text-xs text-slate-500">Trending topics on Reddit, X, and LinkedIn.</p>
                </div>
             </div>
             
             {/* LinkedIn Integrated Button */}
             <a 
               href={getLinkedInSearchUrl(`${university.name} ${discipline} research`)}
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-lg text-xs font-bold hover:bg-[#006097] transition-colors shadow-lg shadow-blue-900/20"
             >
               <Icons.Linkedin className="w-4 h-4" /> View LinkedIn Posts
             </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {university.news && university.news.length > 0 ? (
                  university.news.map((news, idx) => {
                      const style = getSocialStyle(news.source);
                      return (
                        <a key={idx} href={getGoogleSearchUrl(`${university.name} ${news.headline} ${news.source}`)} target="_blank" rel="noopener noreferrer" className="block group h-full">
                          <div className={`p-5 rounded-xl border transition-all h-full flex flex-col hover:shadow-lg ${style.bg} ${style.border}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {style.icon}
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                                            {style.label}
                                        </span>
                                    </div>
                                    <span className="text-slate-500 text-[10px]">{news.date}</span>
                                </div>
                                <h4 className="text-slate-200 font-semibold mb-2 text-sm leading-snug group-hover:text-blue-400 transition-colors">
                                    {news.headline}
                                </h4>
                                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-grow">
                                    {news.summary}
                                </p>
                                <div className="pt-3 border-t border-slate-700/30 flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-slate-300 font-medium transition-colors">
                                    View Discussion <Icons.ArrowRight className="w-3 h-3" />
                                </div>
                          </div>
                        </a>
                      );
                  })
              ) : (
                  <div className="col-span-3 text-center text-slate-500 text-sm py-8 bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
                      No social discussions found. Try the LinkedIn search button above.
                  </div>
              )}
          </div>
      </div>

      {/* Action Footer (Save & Notes) */}
      {!isSavedMode && (
          <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800 shadow-inner">
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-grow w-full">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Icons.StickyNote className="w-4 h-4"/> Personal Notes
                    </label>
                    <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none transition-colors min-h-[80px]"
                        placeholder="Add notes about professors, deadlines, or questions to ask..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
                <div className="md:self-end">
                    <button 
                        onClick={handleSave}
                        disabled={saved}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                            saved 
                            ? "bg-green-600/20 text-green-400 border border-green-500/30 cursor-default"
                            : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30"
                        }`}
                    >
                        {saved ? <><Icons.Check className="w-4 h-4"/> Saved to Database</> : <><Icons.Save className="w-4 h-4"/> Save Result</>}
                    </button>
                </div>
            </div>
          </div>
      )}
      
      {isSavedMode && (data as SavedUniversity).userNotes && (
         <div className="bg-yellow-900/10 border border-yellow-500/20 p-4 rounded-xl">
             <h4 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Icons.StickyNote className="w-4 h-4"/> Saved Notes
             </h4>
             <p className="text-slate-300 text-sm whitespace-pre-wrap">{(data as SavedUniversity).userNotes}</p>
         </div>
      )}

    </div>
  );
};