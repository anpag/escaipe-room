import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, SkipForward, RotateCcw, CheckSquare, Square, Search } from 'lucide-react';

const API_BASE_URL = "http://localhost:8080";

const AdminPanel = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/teams`);
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTeams(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTeams.size === teams.length) setSelectedTeams(new Set());
    else setSelectedTeams(new Set(teams.map(t => t.id)));
  };

  const handleAction = async (action, endpoint, method = 'POST') => {
    if (!window.confirm(`Are you sure you want to ${action} for ${selectedTeams.size} teams?`)) return;
    
    setLoading(true);
    try {
      // Execute sequentially to avoid overwhelming server if many
      for (const id of selectedTeams) {
        const url = endpoint.replace('{team_id}', id);
        const options = { method };
        if (method === 'POST') {
             options.headers = { 'Content-Type': 'application/json' };
             options.body = JSON.stringify({ team_id: id });
        }
        await fetch(url, options);
      }
      await fetchTeams();
      setSelectedTeams(new Set());
    } catch (err) {
      alert(`Error during ${action}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-mono p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            ADMIN PANEL
          </h1>
          <div className="flex gap-4">
             <button onClick={fetchTeams} className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
             </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search teams..." 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-64"
                    />
                </div>
                <span className="text-sm text-slate-400">{selectedTeams.size} selected</span>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => handleAction("RESET", `${API_BASE_URL}/reset-progress`)} 
                    disabled={selectedTeams.size === 0 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 rounded hover:bg-yellow-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RotateCcw size={16} /> Reset
                </button>
                <button 
                    onClick={() => handleAction("SKIP ROOM", `${API_BASE_URL}/next-room`)}
                    disabled={selectedTeams.size === 0 || loading} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SkipForward size={16} /> Complete Room
                </button>
                <button 
                    onClick={() => handleAction("DELETE", `${API_BASE_URL}/admin/teams/{team_id}`, 'DELETE')}
                    disabled={selectedTeams.size === 0 || loading} 
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-500 border border-red-600/50 rounded hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={16} /> Delete
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider border-b border-slate-700">
                        <th className="p-4 w-12 text-center cursor-pointer" onClick={toggleSelectAll}>
                            {teams.length > 0 && selectedTeams.size === teams.length ? <CheckSquare size={18} /> : <Square size={18} />}
                        </th>
                        <th className="p-4">ID</th>
                        <th className="p-4">Team Name</th>
                        <th className="p-4">Current Room</th>
                        <th className="p-4 text-center">Completed?</th>
                        <th className="p-4 text-center">Items</th>
                        <th className="p-4 text-right">Game State</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {filteredTeams.map(team => (
                        <tr key={team.id} className={`hover:bg-slate-700/30 transition-colors ${selectedTeams.has(team.id) ? 'bg-blue-900/10' : ''}`}>
                            <td className="p-4 text-center cursor-pointer" onClick={() => toggleSelect(team.id)}>
                                {selectedTeams.has(team.id) ? <CheckSquare size={18} className="text-blue-400" /> : <Square size={18} className="text-slate-600" />}
                            </td>
                            <td className="p-4 font-mono text-slate-500">#{team.id}</td>
                            <td className="p-4 font-bold text-white">{team.name}</td>
                            <td className="p-4">
                                <span className="px-2 py-1 bg-slate-900 rounded text-sm border border-slate-600">
                                    {team.game_state?.current_room || "N/A"}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                {team.game_state?.room_completed ? 
                                    <span className="text-emerald-400 font-bold">YES</span> : 
                                    <span className="text-slate-600">NO</span>}
                            </td>
                            <td className="p-4 text-center">
                                {(team.inventory || []).length}
                            </td>
                            <td className="p-4 text-right">
                                <pre className="text-[10px] text-slate-500 max-w-[200px] overflow-hidden truncate inline-block align-middle">
                                    {JSON.stringify(team.game_state)}
                                </pre>
                            </td>
                        </tr>
                    ))}
                    {filteredTeams.length === 0 && (
                        <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-500 italic">No teams found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
