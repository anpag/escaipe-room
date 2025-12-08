import React, { useState, useEffect } from 'react';
import { Award, Zap, ChevronRight } from 'lucide-react';

const API_BASE_URL = "http://localhost:8080";

const Leaderboard = ({ onRestart, currentTeam }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/teams`);
                const data = await res.json();
                const sortedTeams = data
                    .filter(team => team.completion_time)
                    .sort((a, b) => new Date(a.completion_time) - new Date(b.completion_time));
                setTeams(sortedTeams);
            } catch (err) {
                console.error("Failed to fetch teams for leaderboard", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const getRankColor = (rank) => {
        if (rank === 0) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
        if (rank === 1) return "bg-slate-400/20 text-slate-300 border-slate-400/50";
        if (rank === 2) return "bg-orange-600/20 text-orange-500 border-orange-600/50";
        return "bg-slate-700/50 text-slate-400 border-slate-700";
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-mono text-slate-200">
            <div className="w-full max-w-2xl bg-slate-800/80 border border-purple-500/30 rounded-lg p-8 shadow-2xl backdrop-blur-sm animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold text-center mb-2 text-purple-400 tracking-wider flex items-center justify-center gap-3"><Award size={30} />LEADERBOARD</h1>
                <p className="text-center text-slate-300 mb-8">Congratulations to all teams who completed the challenge!</p>

                {loading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : (
                    <div className="space-y-3">
                        {teams.map((team, index) => (
                            <div
                                key={team.id}
                                className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(index)} ${team.id === currentTeam?.id ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-lg w-6">{index + 1}</span>
                                    <span className="font-bold text-white text-lg">{team.name}</span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    {new Date(team.completion_time).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 <div className="text-center mt-10">
                    <button onClick={onRestart} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600/90 font-mono rounded-lg hover:bg-blue-500 hover:shadow-lg backdrop-blur-sm">
                        <span className="mr-2 text-lg">PLAY AGAIN</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
