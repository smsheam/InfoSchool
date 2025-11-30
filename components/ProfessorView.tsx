import React from 'react';
import { ProfessorData } from '../types';
import { Icons } from './Icons';

interface Props {
  data: ProfessorData;
}

export const ProfessorView: React.FC<Props> = ({ data }) => {
  const { professors } = data;

  if (!professors || professors.length === 0) {
    return (
        <div className="text-center p-16 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.User className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Professors Found</h3>
            <p className="text-sm mt-2 max-w-xs mx-auto">
                No professors matched your specific criteria. Try refining your search or checking the official university website.
            </p>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {professors.map((prof, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all p-6 flex flex-col h-full group">
            
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{prof.name}</h3>
                    <p className="text-slate-500 text-sm font-medium truncate">{prof.designation}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-full border border-slate-100 group-hover:bg-blue-50 transition-colors shrink-0">
                    <Icons.User className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
            </div>

            <div className="mb-4">
                 {prof.university !== 'unknown' && (
                     <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-1">
                        <Icons.GraduationCap className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{prof.university}</span>
                     </div>
                 )}
                 <div className="flex items-center gap-1.5 text-sm text-accent font-medium">
                    <Icons.BookOpen className="w-4 h-4 opacity-70" />
                    <span className="truncate">{prof.department}</span>
                 </div>
            </div>

            {prof.lab_name !== 'unknown' && (
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <Icons.Lab className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-medium truncate">{prof.lab_name}</span>
                </div>
            )}

            <div className="mb-4 flex-grow">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                   Research Interests
                </p>
                <div className="flex flex-wrap gap-2">
                    {prof.research_interests.map((interest, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 font-medium">
                            {interest}
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                 {prof.email !== 'unknown' && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Icons.Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <a href={`mailto:${prof.email}`} className="hover:text-accent truncate transition-colors font-medium">{prof.email}</a>
                    </div>
                 )}
                 <div className="flex flex-wrap gap-2 mt-2">
                    {prof.webpage !== 'unknown' && (
                        <a href={prof.webpage} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 hover:text-accent transition-colors border border-slate-200">
                            <Icons.Globe className="w-3 h-3" /> Website
                        </a>
                    )}
                     {prof.google_scholar !== 'unknown' && (
                        <a href={prof.google_scholar} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 hover:text-accent transition-colors border border-slate-200">
                            <Icons.BookOpen className="w-3 h-3" /> Scholar
                        </a>
                    )}
                    {prof.linkedin !== 'unknown' && prof.linkedin && (
                        <a href={prof.linkedin} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5] bg-opacity-10 text-[#0077b5] rounded-lg text-xs font-medium hover:bg-opacity-20 transition-colors border border-transparent">
                            <Icons.Linkedin className="w-3 h-3" /> LinkedIn
                        </a>
                    )}
                 </div>
            </div>
            
            {(prof.current_projects.length > 0 && prof.current_projects[0] !== 'unknown') && (
                 <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active Projects</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                        {prof.current_projects.slice(0, 2).map((proj, i) => (
                             <li key={i} className="flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5 text-[10px]">•</span>
                                <span className="line-clamp-1">{proj}</span>
                             </li>
                        ))}
                    </ul>
                 </div>
            )}

        </div>
      ))}
    </div>
  );
};