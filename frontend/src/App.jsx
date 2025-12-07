import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MapPin, Terminal, MonitorPlay, Database, Activity, Cloud, Users, ChevronRight } from 'lucide-react';

const API_BASE_URL = "http://localhost:8080";

// --- Components ---

const HomeScreen = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono text-slate-200 relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      >
        <source src="/assets/home_page_background.mp4" type="video/mp4" />
      </video>

      {/* Content Overlay */}
      <div className="max-w-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight drop-shadow-lg">
            QBR4 ESCAPE ROOM
          </h1>
          <p className="text-xl text-slate-200 drop-shadow-md">
            Enter the Data Ops environment. Solve the puzzles. Escape the silo.
          </p>
        </div>
        
        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600/90 font-mono rounded-lg hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 backdrop-blur-sm"
        >
          <span className="mr-2 text-lg">INITIALIZE SEQUENCE</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="pt-12 flex justify-center gap-8 text-slate-300 text-sm font-semibold drop-shadow-sm">
          <div className="flex items-center gap-2">
            <Terminal size={16} />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud size={16} />
            <span>Cloud Native</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={16} />
            <span>Real-time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthScreen = ({ onTeamSelect }) => {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch existing teams
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/teams`);
        if (!res.ok) throw new Error("Failed to fetch teams");
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error(err);
        setError("Could not connect to the server.");
      }
    };
    fetchTeams();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setError("");
    try {
      const formData = new FormData();
      formData.append('name', newTeamName);
      
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Registration failed");
      }
      
      const newTeam = await res.json();
      onTeamSelect(newTeam);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-mono text-slate-200">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-400">ESCAPE ROOM</h1>
        <p className="text-slate-400 text-center mb-6">Team Registration</p>
        
        {error && <p className="bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-md mb-4 text-sm">{error}</p>}

        {/* Existing Teams */}
        <div className="mb-6">
          <h2 className="text-slate-300 font-bold mb-3 flex items-center gap-2"><Users size={16} /> Select a Team</h2>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {teams.length > 0 ? (
              teams.map(team => (
                <button 
                  key={team.id}
                  onClick={() => onTeamSelect(team)}
                  className="w-full text-left flex justify-between items-center bg-slate-700/50 hover:bg-slate-700 p-3 rounded-md transition-colors"
                >
                  <span>{team.name}</span>
                  <ChevronRight size={18} />
                </button>
              ))
            ) : (
              <p className="text-slate-500 text-sm p-3 bg-slate-900/50 rounded-md">No teams found. Create one!</p>
            )}
          </div>
        </div>

        {/* Create New Team */}
        <form onSubmit={handleRegister}>
          <h2 className="text-slate-300 font-bold mb-3">Create New Team</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name..."
              className="flex-grow bg-slate-950/50 text-white border border-slate-700 rounded-md py-3 px-4 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ICON_MAP = {
  Cloud,
  Terminal,
  Database,
  Activity,
  MonitorPlay,
  Users,
  ChevronRight,
  X,
  Send,
  MapPin,
};

const getIcon = (name) => ICON_MAP[name] || Cloud;

const Inventory = ({ items }) => {
  // Always render the container to maintain layout stability
  return (
    <div className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 shadow-lg flex flex-col mb-4">
      <h3 className="text-xs font-bold text-slate-400 mb-2 tracking-wider uppercase">Inventory</h3>
      
      {items.length === 0 ? (
        <div className="text-slate-600 text-sm italic py-2">Empty...</div>
      ) : (
        <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {items.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded p-2 min-w-[140px] cursor-help hover:bg-slate-700 transition-colors shrink-0"
              title={item.name}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm text-slate-300 truncate font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);
  const [currentRoom, setCurrentRoom] = useState("databricks-room");
  const [roomConfig, setRoomConfig] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Item Interaction State
  const [selectedItem, setSelectedItem] = useState(null);
  const [messages, setMessages] = useState([]); // Item chat
  
  // Coordinator State
  const [isCoordinatorOpen, setIsCoordinatorOpen] = useState(false);
  const [coordinatorMessages, setCoordinatorMessages] = useState([{ role: 'ai', text: "Mission Control online. Signal strength: 100%. I am here to guide you through the migration. Over." }]);
  const [coordinatorInput, setCoordinatorInput] = useState("");

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  
  // Room Completion State
  const [isRoomCompleted, setIsRoomCompleted] = useState(false);
  
  // Debug Drawing State
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const chatEndRef = useRef(null);
  const coordinatorEndRef = useRef(null);

  // Fetch room config
  useEffect(() => {
    const fetchRoomConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/room/${currentRoom}`);
        if (!res.ok) throw new Error(`Failed to fetch room config for ${currentRoom}`);
        const data = await res.json();
        console.log("Fetched room config:", data);
        setRoomConfig(data);
      } catch (err) {
        console.error(err);
        // Handle error, maybe show a message to the user
      }
    };
    fetchRoomConfig();
  }, [currentRoom]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedItem]);

  // Auto-scroll coordinator
  useEffect(() => {
    coordinatorEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coordinatorMessages, isCoordinatorOpen]);

  // --- Debug: Draw Box Logic ---

  const getRelativeCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (!debugMode) return;
    const coords = getRelativeCoords(e);
    setDrawStart(coords);
    setDrawCurrent(coords);
  };

  const handleMouseMove = (e) => {
    if (!debugMode || !drawStart) return;
    setDrawCurrent(getRelativeCoords(e));
  };

  const handleMouseUp = () => {
    if (!debugMode || !drawStart || !drawCurrent) return;
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Calculate dimensions
    const rawX = Math.min(drawStart.x, drawCurrent.x);
    const rawY = Math.min(drawStart.y, drawCurrent.y);
    const rawW = Math.abs(drawCurrent.x - drawStart.x);
    const rawH = Math.abs(drawCurrent.y - drawStart.y);

    // Convert to percentages
    const left = ((rawX / rect.width) * 100).toFixed(1) + "%";
    const top = ((rawY / rect.height) * 100).toFixed(1) + "%";
    const width = ((rawW / rect.width) * 100).toFixed(1) + "%";
    const height = ((rawH / rect.height) * 100).toFixed(1) + "%";

    const output = `{ id: "new_item", label: "New Item", style: { left: "${left}", top: "${top}", width: "${width}", height: "${height}" } },`;
    console.log("✂️ ZONE COPIED TO CONSOLE:");
    console.log(output);
    alert(`Zone Config Logged to Console:\n${output}`);

    setDrawStart(null);
    setDrawCurrent(null);
  };

  // Open Modal
  const handleZoneClick = (item) => {
    if (debugMode) return;
    setSelectedItem(item);
    if (item.id === 'terminal') {
      setMessages([
        { role: 'ai', text: "SYSTEM ALERT: Governance Lock Active.\nProprietary Lock-in Protocol 4.0 engaged.\nPlease identify yourself. Enter authorized Username:" }
      ]);
    } else if (item.id === 'books') {
      setMessages([
        { role: 'ai', text: "A heavy stack of documentation. It looks like it hasn't been moved in years." }
      ]);
    } else if (item.id === 'poster') {
        setMessages([
          { role: 'ai', text: "A glossy poster is stuck to the wall." }
        ]);
    } else {
      setMessages([{ role: 'ai', text: `Accessing ${item.label}... System Ready.` }]);
    }
  };

  // Close Modal
  const closeModal = () => {
    setSelectedItem(null);
    setInputText("");
  };

  // Send Message to API
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clicked_item: selectedItem.id,
          user_query: userMsg.text,
          team_id: activeTeam.id
        })
      });

      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      
      // Update Frontend State from Backend
      if (data.inventory) {
        setInventory(data.inventory);
      }

      if (data.room_completed) {
        console.log("Room completed!");
        setSelectedItem(null); // Close modal
        setIsRoomCompleted(true);
      } else if (data.current_room && data.current_room !== currentRoom) {
         // Fallback for auto-updates if any
         setCurrentRoom(data.current_room);
      }
      
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Coordinator Handler
  const handleCoordinatorSend = async (e) => {
    e.preventDefault();
    if (!coordinatorInput.trim()) return;

    const userMsg = { role: 'user', text: coordinatorInput };
    setCoordinatorMessages(prev => [...prev, userMsg]);
    setCoordinatorInput("");
    
    try {
      const res = await fetch(`${API_BASE_URL}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clicked_item: "coordinator", // Special ID
          user_query: userMsg.text,
          team_id: activeTeam.id
        })
      });

      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setCoordinatorMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      
    } catch (error) {
      setCoordinatorMessages(prev => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
    }
  };

  const handleTeamSelect = (team) => {
    setActiveTeam(team);
    setInventory(team.inventory || []);
    if (team.game_state) {
        setCurrentRoom(team.game_state.current_room || "databricks-room");
        setIsRoomCompleted(team.game_state.room_completed || false);
    }
    setGameStarted(true);
  };

  const handleReset = async () => {
    if (!activeTeam) return;
    if (!window.confirm("Are you sure you want to reset your progress? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/reset-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: activeTeam.id })
      });

      if (!res.ok) throw new Error("Failed to reset progress");
      
      const data = await res.json();
      setMessages([]);
      setInventory([]);
      setCoordinatorMessages([{ role: 'ai', text: "Mission Control online. System reset confirmed." }]);
      setCurrentRoom(data.current_room);
      setIsRoomCompleted(false);
      alert("Progress has been reset.");
    } catch (error) {
      console.error(error);
      alert("Error resetting progress.");
    }
  };

  const handleNextRoom = async () => {
    if (!activeTeam) return;
    try {
        const res = await fetch(`${API_BASE_URL}/next-room`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team_id: activeTeam.id })
        });

        if (!res.ok) throw new Error("Failed to advance room");
        const data = await res.json();
        
        setCurrentRoom(data.current_room);
        setIsRoomCompleted(false); // Reset completion flag for the new room
        
    } catch (error) {
        console.error(error);
        alert("Error advancing to next room.");
    }
  };

  // Render Logic
  if (!gameStarted) {
    return <HomeScreen onStart={() => setGameStarted(true)} />;
  }

  if (!activeTeam) {
    return <AuthScreen onTeamSelect={handleTeamSelect} />;
  }

  if (!roomConfig) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 font-mono text-white">Loading room...</div>;
  }
  
  const currentTheme = roomConfig.theme || { name: "Unknown Room", filter: "none", icon: "Cloud", color: "text-gray-400" };
  const CurrentIcon = getIcon(currentTheme.icon);
  const roomZones = roomConfig.zones || [];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 font-mono relative">
      
      <div className="flex-1 flex flex-col items-center justify-center h-full w-full max-w-6xl">
          {/* Header */}
          <header className="w-full mb-4 flex justify-between items-center z-10">
            <div className={`flex items-center gap-2 ${currentTheme.color}`}>
              <CurrentIcon size={24} />
              <h1 className="text-xl font-bold tracking-wider">{currentTheme.name.toUpperCase()}</h1>
            </div>
            <div className="flex gap-2">
              {/* Next Room Button - Only visible when room is completed */}
              {isRoomCompleted && (
                  <button 
                      onClick={handleNextRoom}
                      className="px-4 py-2 rounded text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors animate-pulse"
                  >
                      NEXT ROOM &gt;&gt;
                  </button>
              )}

              <button 
                onClick={() => setIsCoordinatorOpen(!isCoordinatorOpen)}
                className={`px-4 py-2 rounded text-sm font-bold transition-colors ${ 
                    isCoordinatorOpen ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-emerald-400 hover:bg-slate-600'
                }`}
              >
                MISSION CONTROL
              </button>
              <button 
                onClick={handleReset}
                className="px-4 py-2 rounded text-sm font-bold bg-red-600/80 text-white hover:bg-red-500 transition-colors"
              >
                RESET
              </button>
              <button 
                onClick={() => setDebugMode(!debugMode)}
                className={`px-4 py-2 rounded text-sm font-bold transition-colors ${ 
                  debugMode ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {debugMode ? 'DEBUG: ON' : 'DEBUG: OFF'}
              </button>
            </div>
          </header>

          {/* Inventory Bar */}
          <Inventory items={inventory} />

          {/* Main Game Area */}
          <div className="relative w-full border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black">
            {/* The Room Image or Video */}
            <div 
                ref={containerRef}
                className={`relative w-full h-full ${debugMode ? 'cursor-crosshair' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setDrawStart(null)} // Cancel if leaving area
            >
                {/* Visual Effect Layer */}
                {currentRoom === "databricks-room" ? (
                  // Conditional rendering for Room 1
                  isRoomCompleted ? (
                      <video
                        key="end-video" // Key forces remount on change
                        src="/assets/databricks-room-end.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-auto object-contain select-none transition-all duration-1000 pointer-events-none"
                        style={{ filter: currentTheme.filter }}
                      />
                  ) : (
                      <video
                        key="bg-video"
                        ref={imgRef}
                        src="/assets/databricks-room-background.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-auto object-contain select-none transition-all duration-1000 pointer-events-none" // Disable pointer events on video to let container handle clicks
                        style={{ filter: currentTheme.filter }}
                      />
                  )
                ) : (
                  <img 
                    ref={imgRef}
                    src={`/assets/${currentRoom}.png`}
                    alt="Escape Room" 
                    className="w-full h-auto object-contain select-none transition-all duration-1000 pointer-events-none"
                    style={{ filter: currentTheme.filter }}
                    onError={(e) => { e.target.src = "/assets/databricks-room.png" }} // Fallback
                  />
                )}

                {/* Debug Drawing Box */}
                {debugMode && drawStart && drawCurrent && (
                    <div 
                        className="absolute border-2 border-red-500 bg-red-500/30 pointer-events-none z-50"
                        style={{
                            left: Math.min(drawStart.x, drawCurrent.x),
                            top: Math.min(drawStart.y, drawCurrent.y),
                            width: Math.abs(drawCurrent.x - drawStart.x),
                            height: Math.abs(drawCurrent.y - drawStart.y),
                        }}
                    />
                )}

                {/* Clickable Zones */}
                {!debugMode && roomZones.map((zone) => (
                  <div
                    key={zone.id}
                    onClick={() => handleZoneClick(zone)}
                    className={`absolute cursor-pointer hover:bg-white/10 border border-transparent transition-all duration-300 group hover:border-current`}
                    style={zone.style}
                  >
                    {/* Tooltip on Hover */}
                    <div className={`opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 ${currentTheme.color} text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none border border-current/30`}>
                      {zone.label}
                    </div>
                  </div>
                ))}
            </div>

            {/* Debug Overlay */}
            {debugMode && (
              <div className="absolute top-4 left-4 bg-yellow-500/90 text-black px-4 py-2 rounded shadow-lg font-bold pointer-events-none">
                <MapPin className="inline w-4 h-4 mr-2"/>
                Room {currentRoom} Debug Mode
              </div>
            )}
          </div>
        </div>
      
      {/* Coordinator Chat Interface (Right Sidebar) */}
      {isCoordinatorOpen && (
        <div className="fixed right-8 bottom-8 w-80 h-[500px] bg-slate-900/95 border border-emerald-500/50 rounded-lg shadow-2xl flex flex-col overflow-hidden backdrop-blur-md z-40 transition-all">
            <div className="bg-emerald-900/30 p-3 border-b border-emerald-500/30 flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Activity size={16} className="animate-pulse" />
                    <span>MISSION CONTROL</span>
                </div>
                <button onClick={() => setIsCoordinatorOpen(false)} className="text-emerald-400/70 hover:text-emerald-400">
                    <X size={18} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-900/50">
                {coordinatorMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded p-2 text-xs leading-relaxed ${ 
                            msg.role === 'user' 
                            ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30' 
                            : 'text-emerald-300'
                        }`}> 
                            {msg.role === 'ai' && <span className="font-bold mr-1 block text-[10px] opacity-70">CONTROL:</span>}
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={coordinatorEndRef} />
            </div>

            <form onSubmit={handleCoordinatorSend} className="p-3 bg-black/20 border-t border-emerald-500/20">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={coordinatorInput}
                        onChange={(e) => setCoordinatorInput(e.target.value)}
                        placeholder="Request support..."
                        className="w-full bg-slate-950/50 text-emerald-100 border border-emerald-500/30 rounded py-2 pl-3 pr-10 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-emerald-700"
                    />
                    <button 
                        type="submit" 
                        className="absolute right-1 p-1 text-emerald-500 hover:text-emerald-300 transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* Item Interaction Modal (Existing) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg bg-slate-800/90 border rounded-lg shadow-2xl flex flex-col overflow-hidden h-[600px] backdrop-blur-md ${currentTheme.color.replace('text', 'border')}/30`}>
            
            {/* Modal Header */}
            <div className={`bg-slate-900/50 p-4 border-b flex justify-between items-center ${currentTheme.color.replace('text', 'border')}/20`}>
              <div>
                <h2 className={`${currentTheme.color} font-bold text-lg flex items-center gap-2`}>
                   <Terminal size={18} />
                   {selectedItem.label.toUpperCase()}
                </h2>
                <p className="text-slate-400 text-xs">Secure Connection Established</p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${ 
                    msg.role === 'user' 
                      ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' 
                      : `bg-slate-700/50 text-slate-100 border ${currentTheme.color.replace('text', 'border')}/30`
                  }`}> 
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className={`bg-slate-700/50 ${currentTheme.color} border ${currentTheme.color.replace('text', 'border')}/30 rounded-lg p-3 text-sm animate-pulse`}>
                      Processing...
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className={`p-4 bg-slate-900/50 border-t ${currentTheme.color.replace('text', 'border')}/20`}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type command..."
                  className="w-full bg-slate-950/50 text-white border border-slate-700 rounded-md py-3 pl-4 pr-12 focus:outline-none focus:border-current focus:ring-1 focus:ring-current transition-all placeholder:text-slate-600"
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`absolute right-2 p-2 hover:opacity-80 disabled:opacity-50 transition-colors ${currentTheme.color}`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}

export default App