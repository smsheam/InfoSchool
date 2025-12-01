import React from 'react';
import { RecommendationResult, RecommendedUni } from '../types';
import { Icons } from './Icons';

interface Props {
    data: RecommendationResult;
}

interface UniCardProps {
    uni: RecommendedUni;
    type: 'ambitious' | 'target' | 'safe';
}

const UniCard: React.FC<UniCardProps> = ({ uni, type }) => {
    const styles = {
        ambitious: { border: 'border-purple-500/30', bg: 'bg-purple-900/10', text: 'text-purple-400', icon: Icons.Zap, label: 'Ambitious' },
        target: { border: 'border-blue-500/30', bg: 'bg-blue-900/10', text: 'text-blue-400', icon: Icons.Target, label: 'Target' },
        safe: { border: 'border-emerald-500/30', bg: 'bg-emerald-900/10', text: 'text-emerald-400', icon: Icons.Shield, label: 'Safe' }
    }[type];

    const Icon = styles.icon;

    return (
        <div className={`p-4 rounded-xl border ${styles.border} ${styles.bg} hover:border-opacity-100 transition-all group`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-200 group-hover:text-white">{uni.name}</h4>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-900 ${styles.text}`}>
                    {styles.label}
                </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <Icons.MapPin className="w-3 h-3" /> {uni.location}
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed border-l-2 border-slate-700 pl-3">
                {uni.reason}
            </p>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500 font-medium uppercase">Adm. Chance</span>
                <span className={`text-sm font-bold ${styles.text}`}>{uni.chance}</span>
            </div>
        </div>
    );
};

export const RecommendationView: React.FC<Props> = ({ data }) => {
    return (
        <div className="space-y-8 animate-fade-in pb-12">
            
            {/* Analysis Header */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Icons.Brain className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Profile Analysis</h2>
                </div>
                <p className="text-slate-300 leading-relaxed">
                    {data.analysis}
                </p>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Ambitious Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <Icons.Zap className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Ambitious</h3>
                    </div>
                    {data.recommendations.ambitious.map((uni, i) => (
                        <UniCard key={i} uni={uni} type="ambitious" />
                    ))}
                </div>

                {/* Target Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Icons.Target className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Target Matches</h3>
                    </div>
                    {data.recommendations.target.map((uni, i) => (
                        <UniCard key={i} uni={uni} type="target" />
                    ))}
                </div>

                {/* Safe Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <Icons.Shield className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Safe Options</h3>
                    </div>
                    {data.recommendations.safe.map((uni, i) => (
                        <UniCard key={i} uni={uni} type="safe" />
                    ))}
                </div>

            </div>
        </div>
    );
};