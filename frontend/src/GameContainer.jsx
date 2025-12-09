import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MapPin, Terminal, MonitorPlay, Database, Activity, Cloud, Users, ChevronRight, RotateCcw, Bug } from 'lucide-react';

const API_BASE_URL = "http://34.68.148.178:8080";
const WS_BASE_URL = "ws://34.68.148.178:8080"; // WebSocket Base URL

// --- Components ---

const VictoryScreen = ({ letter, onNextRoom }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono text-slate-200 relative overflow-hidden animate-in fade-in duration-1000">
    <div className="text-center space-y-8">
      <h2 className="text-4xl font-bold text-emerald-400 tracking-widest">ROOM CLEARED</h2>
      <div className="flex flex-col items-center gap-2">
        <span className="text-slate-300 text-sm uppercase tracking-widest">Data Fragment Recovered</span>
        <div className="w-32 h-32 flex items-center justify-center bg-emerald-900/30 border-2 border-emerald-500 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.5)]">
          <span className="text-8xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{letter || "?"}</span>
        </div>
      </div>
      <button onClick={onNextRoom} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600/90 font-mono rounded-lg hover:bg-blue-500 hover:shadow-lg backdrop-blur-sm">
        <span className="mr-2 text-lg">NEXT ROOM</span>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

const HomeScreen = ({ onStart }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-mono text-slate-200">
    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60">
        <source src="/assets/home_page_background.mp4" type="video/mp4" />
    </video>
    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight drop-shadow-lg">
        QBR4 ESCAPE ROOM
      </h1>
      <button onClick={onStart} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600/90 font-mono rounded-lg hover:bg-blue-500 hover:shadow-lg backdrop-blur-sm">
        <span className="mr-2 text-lg">INITIALIZE SEQUENCE</span>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

const AuthScreen = ({ onTeamSelect }) => {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/teams`);
        if (!res.ok) throw new Error("Failed to fetch teams");
        setTeams(await res.json());
      } catch (err) { setError("Could not connect to the server."); }
    };
    fetchTeams();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const formData = new FormData();
      formData.append('name', newTeamName);
      const res = await fetch(`${API_BASE_URL}/register`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Registration failed");
      onTeamSelect(await res.json());
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-mono text-slate-200">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-400">ESCAPE ROOM</h1>
        <div className="mb-6">
            <h2 className="text-slate-300 font-bold mb-3 flex items-center gap-2"><Users size={16} /> Select a Team</h2>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {teams.map(team => (
                    <button key={team.id} onClick={() => onTeamSelect(team)} className="w-full text-left flex justify-between items-center bg-slate-700/50 hover:bg-slate-700 p-3 rounded-md transition-colors">
                        <span>{team.name}</span> <ChevronRight size={18} />
                    </button>
                ))}
            </div>
        </div>
        <form onSubmit={handleRegister} className="flex gap-2">
          <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="New team name..." className="flex-grow bg-slate-950/50 text-white border border-slate-700 rounded-md py-3 px-4 focus:outline-none focus:border-blue-500" />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-md">Create</button>
        </form>
      </div>
    </div>
  );
};

const ICON_MAP = { Cloud, Terminal, Database, Activity, MonitorPlay, Users, ChevronRight, X, Send, MapPin };
const getIcon = (name) => ICON_MAP[name] || Cloud;

const Inventory = ({ items }) => (
  <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-hide">
    {items.length === 0 ? <div className="text-slate-400 text-sm italic py-2 pl-2">Inventory Empty...</div> : items.map((item, index) => (
      <div key={index} className="flex items-center gap-2 bg-slate-800/80 border border-slate-600/50 rounded p-2 min-w-[140px] shrink-0 backdrop-blur-sm hover:bg-slate-700/80 transition-colors" title={item.name}>
        <span className="text-2xl">{item.icon}</span>
        <span className="text-sm text-slate-200 truncate font-medium">{item.name}</span>
      </div>
    ))}
  </div>
);

import GeminiRoom from './GeminiRoom';
import Leaderboard from './Leaderboard';

function GameContainer() {
  const [gameStarted, setGameStarted] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);
  const [currentRoom, setCurrentRoom] = useState("databricks-room");
  const [roomConfig, setRoomConfig] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  
  // Initialize Debug Mode from URL params
  const [debugMode, setDebugMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("debug") === "true" || params.get("debug") === "1";
  });
  
  // Interaction State
  const [selectedItem, setSelectedItem] = useState(null);
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState("");
  const [inventory, setInventory] = useState([]);
  const [isRoomCompleted, setIsRoomCompleted] = useState(false);
  const [gameState, setGameState] = useState({}); // Track full custom game state
  const [victoryState, setVictoryState] = useState("none"); // "none", "playing_video", "show_summary"
  const [snowflakeMeltingState, setSnowflakeMeltingState] = useState('frozen'); // frozen, melting, melted
  
  // Coordinator State
  const [coordinatorMessages, setCoordinatorMessages] = useState([{ role: 'ai', text: "Mission Control online. Signal strength: 100%. I am here to guide you." }]);
  const [coordinatorInput, setCoordinatorInput] = useState("");

  // Refs for WebSockets
  const itemSocket = useRef(null);
  const coordinatorSocket = useRef(null);
  const containerRef = useRef(null);
  const chatEndRef = useRef(null);
  const coordinatorEndRef = useRef(null);
  const videoRef = useRef(null);

  // Background Selection Logic
  const getBackgroundSource = () => {
      // Special Snowflake room logic takes precedence
      if (currentRoom === 'snowflake-room') {
          if (snowflakeMeltingState === 'melting') return roomConfig.background_melted;
          // After melting, show the 'end' background even before room is complete
          if (snowflakeMeltingState === 'melted') return roomConfig.background_completed;
      }

      // For all other rooms, or if snowflake hasn't melted yet
      if (isRoomCompleted && roomConfig?.background_completed) return roomConfig.background_completed;
      if (roomConfig?.background) return roomConfig.background;
      
      // Fallback image
      return `/assets/${currentRoom}.png`;
  };
  const bgSource = getBackgroundSource();

  // Debug Drawing
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);

  useEffect(() => {
    // Force reload and play on video source change
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.error("Video autoplay was prevented:", error);
      });
    }
  }, [bgSource]);

  useEffect(() => {
    if (!currentRoom) return;
    fetch(`${API_BASE_URL}/api/room/${currentRoom}`).then(res => res.json()).then(setRoomConfig).catch(console.error);
    
    // Reset special state when room changes
    setSnowflakeMeltingState('frozen');
  }, [currentRoom]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, selectedItem]);
  useEffect(() => { coordinatorEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [coordinatorMessages]);

  // --- Auto-Sequence Logic: Room Completion ---
  useEffect(() => {
    if (isRoomCompleted) {
      setSelectedItem(null); // Close any open modals
      setVictoryState('playing_video');

      const timer = setTimeout(() => {
        setVictoryState('show_summary');
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isRoomCompleted]);

  // --- Auto-Sequence Logic: Snowflake Melting Trigger ---
  useEffect(() => {
    if (currentRoom === 'snowflake-room' && gameState.snowman_stopped && snowflakeMeltingState === 'frozen') {
      closeModal(); // Close any open interaction windows
      setSnowflakeMeltingState('melting');
    }
  }, [gameState, currentRoom]);

  const handleVideoEnded = () => {
    if (snowflakeMeltingState === 'melting') {
      setSnowflakeMeltingState('melted');
    }
  };

  // --- WebSocket Logic: Item Interaction ---
  useEffect(() => {
    if (selectedItem && activeTeam) {
        const ws = new WebSocket(`${WS_BASE_URL}/ws/${activeTeam.id}/${selectedItem.id}`);
        
        ws.onopen = () => console.log("Item WS Connected");
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.history) {
                // Prepend the history to the initial description message
                setMessages(prev => [...prev, ...data.history]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'ai', text: `Error: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
                if (data.inventory) setInventory(data.inventory);
                if (data.room_completed) setIsRoomCompleted(true);
                if (data.game_state) setGameState(data.game_state);
            }
        };
        ws.onclose = () => console.log("Item WS Closed");
        itemSocket.current = ws;
        return () => ws.close();
    }
  }, [selectedItem, activeTeam]);

  // --- WebSocket Logic: Coordinator (ALWAYS CONNECTED) ---
  useEffect(() => {
    if (activeTeam) {
        // Connect to coordinator immediately when team is active
        const ws = new WebSocket(`${WS_BASE_URL}/ws/${activeTeam.id}/coordinator`);
        
        ws.onopen = () => console.log("Coordinator WS Connected");
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.history) {
                setCoordinatorMessages(data.history);
            } else {
                setCoordinatorMessages(prev => [...prev, { role: 'ai', text: data.response }]);
            }
        };
        
        coordinatorSocket.current = ws;
        return () => ws.close();
    }
  }, [activeTeam, currentRoom]); // Re-connect if activeTeam or room changes


  // Debug Draw Handlers
  const getRelativeCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const handleMouseDown = (e) => { if (debugMode) { const c = getRelativeCoords(e); setDrawStart(c); setDrawCurrent(c); }};
  const handleMouseMove = (e) => { if (debugMode && drawStart) setDrawCurrent(getRelativeCoords(e)); };
  const handleMouseUp = () => {
    if (debugMode && drawStart && drawCurrent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = Math.min(drawStart.x, drawCurrent.x), rawY = Math.min(drawStart.y, drawCurrent.y);
      const w = Math.abs(drawCurrent.x - drawStart.x), h = Math.abs(drawCurrent.y - drawStart.y);
      const l = ((rawX/rect.width)*100).toFixed(1)+"%", t = ((rawY/rect.height)*100).toFixed(1)+"%";
      const wd = ((w/rect.width)*100).toFixed(1)+"%", ht = ((h/rect.height)*100).toFixed(1)+"%";
      console.log(`{ id: "new", label: "New", style: { left: "${l}", top: "${t}", width: "${wd}", height: "${ht}" } },`);
      setDrawStart(null); setDrawCurrent(null);
    }
  };

  const handleZoneClick = (zone) => {
    if (debugMode) return;
    
    // Find the item's description from the room config
    const itemConfig = roomConfig?.items?.[zone.id];
    const initialMessage = itemConfig?.description || `Accessing ${zone.label}...`;

    setSelectedItem(zone);
    setMessages([{ role: 'ai', text: initialMessage }]); // Set the initial message
  };

  const closeModal = () => { setSelectedItem(null); setInputText(""); };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !itemSocket.current) return;
    const text = inputText;
    setMessages(prev => [...prev, { role: 'user', text }]);
    itemSocket.current.send(text);
    setInputText("");
  };

  const handleCoordinatorSend = (e) => {
    e.preventDefault();
    if (!coordinatorInput.trim() || !coordinatorSocket.current) return;
    const text = coordinatorInput;
    setCoordinatorMessages(prev => [...prev, { role: 'user', text }]);
    coordinatorSocket.current.send(text);
    setCoordinatorInput("");
  };

  const handleTeamSelect = (team) => {
    setActiveTeam(team);
    setInventory(team.inventory || []);
    if (team.game_state) {
        setGameState(team.game_state);
        setCurrentRoom(team.game_state.current_room || "databricks-room");
        setIsRoomCompleted(team.game_state.room_completed || false);
        setGameState(team.game_state);
        if (team.game_state.game_completed) {
            setGameFinished(true);
        }
    }
    setGameStarted(true);
};

  const handleReset = async () => {
    if (!activeTeam || !window.confirm("Reset progress?")) return;
    await fetch(`${API_BASE_URL}/reset-progress`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ team_id: activeTeam.id }) });
    setInventory([]);
    setMessages([]);
    setCurrentRoom("databricks-room");
    setIsRoomCompleted(false);
    setGameState({});
    setGameFinished(false);
    setVictoryState("none");
    alert("Reset complete. The page will now reload.");
    window.location.reload();
};

  const handleNextRoom = async () => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/next-room`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ team_id: activeTeam.id }) });
    const data = await res.json();
    setCurrentRoom(data.current_room);
    setIsRoomCompleted(false);
    setVictoryState("none");
  };

  const handleCompleteFinalChallenge = async () => {
    if (!activeTeam) return;
    await fetch(`${API_BASE_URL}/complete-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: activeTeam.id }),
    });
    setGameFinished(true);
};

  if (!gameStarted) return <HomeScreen onStart={() => setGameStarted(true)} />;
  if (!activeTeam) return <AuthScreen onTeamSelect={handleTeamSelect} />;

  if (gameFinished) {
    return <Leaderboard onRestart={handleReset} currentTeam={activeTeam} />;
  }
  
  if (currentRoom === 'gemini-room') {
    return <GeminiRoom onComplete={handleCompleteFinalChallenge} onRestart={handleReset} collectedLetters={gameState.collected_letters || []} />;
  }

  if (victoryState === "show_summary") {
    return <VictoryScreen letter={gameState.latest_letter} onNextRoom={handleNextRoom} />;
  }
  if (!roomConfig) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 text-white">Loading...</div>;

  const currentTheme = roomConfig.theme || { name: "Unknown", filter: "none", icon: "Cloud", color: "text-gray-400" };
  const CurrentIcon = getIcon(currentTheme.icon);

  const isVideo = bgSource?.endsWith('.mp4');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-4 font-mono relative gap-4">
      
      {/* --- TOP: MISSION CONTROL (ALWAYS ACTIVE) --- */}
      <div className="w-full h-48 bg-slate-900/95 border border-emerald-500/30 rounded-lg flex flex-col overflow-hidden shadow-lg shrink-0">
          <div className="bg-emerald-900/20 p-2 flex justify-between items-center text-emerald-400 font-bold border-b border-emerald-500/20 px-4">
            <div className="flex items-center gap-2"><Activity size={16} /><span>MISSION CONTROL</span></div>
            <div className="text-xs text-emerald-600 tracking-wider">LIVE FEED</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-emerald-900/50">
              {coordinatorMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded px-3 py-1.5 text-xs ${msg.role === 'user' ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30' : 'text-emerald-300'}`}>{msg.text}</div>
                  </div>
              ))}
              <div ref={coordinatorEndRef} />
          </div>
          <form onSubmit={handleCoordinatorSend} className="p-2 bg-black/30 border-t border-emerald-500/20 flex relative">
              <input type="text" value={coordinatorInput} onChange={(e) => setCoordinatorInput(e.target.value)} placeholder="Request support..." className="w-full bg-slate-950/50 text-emerald-100 border border-emerald-500/30 rounded py-2 pl-3 pr-10 text-xs focus:outline-none focus:border-emerald-500 transition-colors" />
              <button type="submit" className="absolute right-4 top-4 text-emerald-500 hover:text-emerald-400"><Send size={14} /></button>
          </form>
      </div>

      {/* --- CENTER: GAME VIEW & INVENTORY --- */}
      <div className="flex-1 relative w-full border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black min-h-0">
          {/* Header Controls Overlay (Top Right of Game View) */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 backdrop-blur border border-slate-600 ${currentTheme.color} mr-4`}>
                <CurrentIcon size={16} />
                <span className="text-sm font-bold tracking-wider">{currentTheme.name.toUpperCase()}</span>
              </div>

          </div>

          <div ref={containerRef} className={`relative w-full h-full ${debugMode ? 'cursor-crosshair' : ''}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
              {isVideo ? (
                <video ref={videoRef} key={bgSource} src={bgSource} autoPlay loop={snowflakeMeltingState !== 'melting'} muted playsInline onEnded={handleVideoEnded} className="w-full h-full object-contain pointer-events-none" style={{ filter: currentTheme.filter }} />
              ) : (
                <img src={bgSource} alt="Room" className="w-full h-full object-contain pointer-events-none" style={{ filter: currentTheme.filter }} onError={(e) => {e.target.src="/assets/databricks-room.png"}} />
              )}

              {debugMode && drawStart && drawCurrent && <div className="absolute border-2 border-red-500 bg-red-500/30 pointer-events-none z-50" style={{ left: Math.min(drawStart.x, drawCurrent.x), top: Math.min(drawStart.y, drawCurrent.y), width: Math.abs(drawCurrent.x - drawStart.x), height: Math.abs(drawCurrent.y - drawStart.y) }} />}
              {!debugMode && (roomConfig.zones || []).map((zone) => (
                <div key={zone.id} onClick={() => handleZoneClick(zone)} className="absolute cursor-pointer hover:bg-black/30 hover:ring-4 hover:ring-fuchsia-500 hover:shadow-[0_0_20px_rgba(217,70,239,0.7)] transition-all duration-300" style={zone.style} />
              ))}
          </div>

          {/* INVENTORY OVERLAY (Bottom of Game View) */}
          <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-md border-t border-slate-600/30 p-2 z-10">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">Inventory</div>
              <Inventory items={inventory} />
          </div>

      </div>

      {/* --- ITEM INTERACTION MODAL --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg bg-slate-800/90 border rounded-lg shadow-2xl flex flex-col overflow-hidden h-[600px] backdrop-blur-md ${currentTheme.color.replace('text', 'border')}/30`}>
            <div className={`bg-slate-900/50 p-4 border-b flex justify-between items-center ${currentTheme.color.replace('text', 'border')}/20`}>
              <div><h2 className={`${currentTheme.color} font-bold text-lg flex items-center gap-2`}><Terminal size={18} />{selectedItem.label.toUpperCase()}</h2><p className="text-slate-400 text-xs">Secure Connection Established</p></div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : `bg-slate-700/50 text-slate-100 border ${currentTheme.color.replace('text', 'border')}/30`}`} style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 bg-slate-900/50 border-t flex relative">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type command..." className="w-full bg-slate-950/50 text-white border border-slate-700 rounded-md py-3 pl-4 pr-12 focus:outline-none focus:border-current" autoFocus />
              <button type="submit" className={`absolute right-6 top-7 ${currentTheme.color}`}><Send size={20} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameContainer