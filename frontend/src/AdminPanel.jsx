import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, SkipForward, RotateCcw, CheckSquare, Square, Search, Award } from 'lucide-react';

const API_BASE_URL = "http://34.68.148.178:8080";

const EARNABLE_ITEMS = [
    { name: "BigQuery Keycard", icon: "💳" },
    { name: "Corporate Credit Card", icon: "💳" },
    { name: "Flat Rate Shield", icon: "🛡️" }
];

const AdminPanel = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedItemToGrant, setSelectedItemToGrant] = useState("");

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

  const handleAction = async (action, endpoint, method = 'POST', body = null) => {
    const actionName = action.toLowerCase();
    if (!window.confirm(`Are you sure you want to ${actionName} for ${selectedTeams.size} selected teams?`)) return;

    setLoading(true);
    try {
      for (const id of selectedTeams) {
        const url = endpoint.replace('{team_id}', id);
        const options = { 
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body(id));
        } else if (method !== 'GET' && method !== 'DELETE') {
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
  
  const handleGrantItem = () => {
    if (!selectedItemToGrant) {
        alert("Please select an item to grant.");
        return;
    }
    const item = EARNABLE_ITEMS.find(i => i.name === selectedItemToGrant);
    handleAction(
        `GRANT ITEM: ${item.name}`,
        `${API_BASE_URL}/admin/teams/{team_id}/inventory`,
        'POST',
        (team_id) => ({ name: item.name, icon: item.icon })
    );
  };


  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-mono p-8">
      <div className="max-w-7xl mx-auto">
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
            <div className="flex items-center gap-4 flex-wrap">
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
            <div className="flex gap-2 flex-wrap">
                {/* Grant Item Section */}
                <div className="flex items-center gap-2">
                    <select
                        value={selectedItemToGrant}
                        onChange={e => setSelectedItemToGrant(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        disabled={selectedTeams.size === 0 || loading}
                    >
                        <option value="">-- Select Item to Grant --</option>
                        {EARNABLE_ITEMS.map(item => <option key={item.name} value={item.name}>{item.icon} {item.name}</option>)}
                    </select>
                    <button
                        onClick={handleGrantItem}
                        disabled={selectedTeams.size === 0 || loading || !selectedItemToGrant}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Award size={16} /> Grant
                    </button>
                </div>
                <div className="w-px bg-slate-700 h-8"></div>
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
                        <th className="p-4">Team Name</th>
                        <th className="p-4">Current Room</th>
                        <th className="p-4">Letters</th>
                        <th className="p-4">Inventory</th>
                        <th className="p-4 text-right">Game State</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {filteredTeams.map(team => (
                        <tr key={team.id} className={`hover:bg-slate-700/30 transition-colors ${selectedTeams.has(team.id) ? 'bg-blue-900/10' : ''}`}>
                            <td className="p-4 text-center cursor-pointer" onClick={() => toggleSelect(team.id)}>
                                {selectedTeams.has(team.id) ? <CheckSquare size={18} className="text-blue-400" /> : <Square size={18} className="text-slate-600" />}
                            </td>
                            <td className="p-4 font-bold text-white align-top">
                                #{team.id}: {team.name}
                            </td>
                            <td className="p-4 align-top">
                                <span className="px-2 py-1 bg-slate-900 rounded text-sm border border-slate-600">
                                    {team.game_state?.current_room || "N/A"}
                                </span>
                            </td>
                             <td className="p-4 align-top">
                                <div className="flex gap-1">
                                {(team.game_state?.collected_letters || []).map((letter, i) => (
                                    <span key={i} className="flex items-center justify-center w-6 h-6 bg-green-900/50 text-green-400 rounded-full font-bold text-xs border border-green-700">
                                        {letter}
                                    </span>
                                ))}
                                </div>
                            </td>
                            <td className="p-4 align-top">
                                <div className="flex flex-col gap-1.5">
                                {(team.inventory || []).map(item => (
                                    <div key={item.name} className="flex items-center gap-2 text-xs">
                                        <span className="text-base">{item.icon}</span>
                                        <span>{item.name}</span>
                                    </div>
                                ))}
                                </div>
                            </td>
                            <td className="p-4 text-right align-top">
                                <pre className="text-[10px] text-slate-500 max-w-[200px] overflow-auto whitespace-pre-wrap break-all inline-block text-left">
                                    {JSON.stringify(team.game_state, null, 2)}
                                </pre>
                            </td>
                        </tr>
                    ))}
                    {filteredTeams.length === 0 && (
                        <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-500 italic">No teams found.</td>
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
