import { useState, useEffect } from 'react';
import './index.css';
import { api } from './services/api';
import Loading from './components/Loading';

// Import all backgrounds
import bg1 from './assets/background/3d-rendering-cartoon-welcome-door.avif';
import bg2 from './assets/background/anime-moon-landscape-2.avif';
import bg3 from './assets/background/anime-moon-landscape.avif';
import bg4 from './assets/background/anime-style-cozy-home-interior-with-furnishings.avif';
import bg5 from './assets/background/beautiful-office-space-cartoon-style-2.avif';
import bg6 from './assets/background/cityscape-anime-inspired-urban-area.avif';
import bg7 from './assets/background/still-life-yoga-equipment.avif';

const backgrounds = [bg1, bg2, bg3, bg4, bg5, bg6, bg7];

function App() {
    const [bgIndex, setBgIndex] = useState(0);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [user, setUser] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSession, setCurrentSession] = useState(null);
    const [stats, setStats] = useState({ totalMinutes: 0, sessionCount: 0 });
    const [inRoom, setInRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // Initialize app
    useEffect(() => {
        initApp();

        // Cleanup on unmount
        return () => {
            if (currentSession) {
                handleLeaveRoom();
            }
        };
    }, []);

    // Auto-refresh rooms every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!inRoom) {
                loadRooms();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [inRoom]);

    // Poll messages when in room
    useEffect(() => {
        if (inRoom && selectedRoom) {
            const interval = setInterval(() => {
                loadMessages(selectedRoom.room_id);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [inRoom, selectedRoom]);

    // Initialize
    async function initApp() {
        try {
            const userData = await api.getCurrentUser();
            if (userData.success) {
                setUser(userData);
                await loadRooms();
                await loadStats();
            } else {
                alert('Authentication failed: ' + userData.message);
            }
        } catch (e) {
            console.error('Error initializing app:', e);
        } finally {
            setLoading(false);
        }
    }

    // Load rooms
    async function loadRooms() {
        try {
            const roomsData = await api.getRooms();
            setRooms(roomsData);
        } catch (e) {
            console.error('Error loading rooms:', e);
        }
    }

    // Load user stats
    async function loadStats() {
        try {
            const statsData = await api.getUserStats();
            if (statsData.success) {
                setStats(statsData);
            }
        } catch (e) {
            console.error('Error loading stats:', e);
        }
    }

    // Join room
    async function handleJoinRoom() {
        if (!selectedRoom) return;

        try {
            const result = await api.joinRoom(selectedRoom.room_id);

            if (result.success) {
                setCurrentSession(result.sessionId);
                setInRoom(true);

                // Open Google Meet in new tab
                window.open(result.meetLink, '_blank');

                // Load initial messages
                await loadMessages(selectedRoom.room_id);
            } else {
                alert('Failed to join room: ' + result.message);
            }
        } catch (e) {
            console.error('Error joining room:', e);
            alert('Error joining room');
        }
    }

    // Leave room
    async function handleLeaveRoom() {
        if (!currentSession) return;

        try {
            const result = await api.leaveRoom(currentSession);

            if (result.success) {
                alert(`You studied for ${result.duration} minutes!`);
                setInRoom(false);
                setCurrentSession(null);
                setSelectedRoom(null);
                setMessages([]);
                await loadStats();
                await loadRooms();
            }
        } catch (e) {
            console.error('Error leaving room:', e);
        }
    }

    // Load messages
    async function loadMessages(roomId) {
        try {
            const msgs = await api.getMessages(roomId, 50);
            setMessages(msgs);
        } catch (e) {
            console.error('Error loading messages:', e);
        }
    }

    // Send message
    async function handleSendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom) return;

        try {
            const result = await api.sendMessage(selectedRoom.room_id, newMessage.trim());

            if (result.success) {
                setNewMessage('');
                await loadMessages(selectedRoom.room_id);
            }
        } catch (e) {
            console.error('Error sending message:', e);
        }
    }

    const changeBg = () => {
        setBgIndex((prev) => (prev + 1) % backgrounds.length);
    };

    const currentBg = backgrounds[bgIndex];

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
                <Loading text="Loading..." className="lottie-loading--fullscreen" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen overflow-hidden text-white font-sans transition-all duration-500 ease-in-out">
            {/* Dynamic Background */}
            <div
                className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 z-0"
                style={{ backgroundImage: `url(${currentBg})` }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full h-full flex flex-col">

                {/* Header */}
                <header className="flex justify-between items-center p-6 glass-panel mx-4 mt-4 !bg-opacity-20 !backdrop-blur-md rounded-2xl animate-fade-in">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Adine" className="h-9 w-auto max-w-[140px] object-contain" onError={(e) => { e.target.style.display = 'none'; if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'block'; }} />
                        <span className="text-2xl font-bold tracking-tight text-white drop-shadow-lg" style={{ display: 'none' }}>Adine</span>
                    </div>

                    <div className="flex gap-4 items-center">
                        {!inRoom && (
                            <button
                                onClick={changeBg}
                                className="glass-btn hover:text-violet-300"
                                title="Change Background"
                            >
                                🎨 Theme
                            </button>
                        )}
                        <div className="flex items-center gap-2 glass-panel px-4 py-2 !rounded-full text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span>{rooms.reduce((acc, r) => acc + r.count, 0)} Online</span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">

                    {!inRoom ? (
                        <>
                            {/* Dashboard / Room List */}
                            <section className="flex-1 overflow-y-auto glass-panel p-6 rounded-3xl animate-fade-in custom-scrollbar">
                                <div className="mb-6">
                                    <h2 className="text-3xl font-semibold mb-2 drop-shadow-md">Choose Your Space</h2>
                                    <p className="opacity-80">Join a virtual room to boost your productivity.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {rooms.map((room) => (
                                        <div
                                            key={room.room_id}
                                            onClick={() => setSelectedRoom(room)}
                                            className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 group border border-white/10
                    ${selectedRoom?.room_id === room.room_id ? 'bg-violet-600/60 ring-2 ring-violet-400' : 'bg-white/5 hover:bg-white/10'}
                  `}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-medium px-2 py-1 rounded bg-white/10 text-white/80 border border-white/5">
                                                    {room.type}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-green-300 font-mono bg-green-900/40 px-2 py-1 rounded-full">
                                                    ● {room.count}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-1 truncate group-hover:text-violet-200 transition-colors">
                                                {room.room_name}
                                            </h3>
                                            <p className="text-xs opacity-60">ID: {room.room_id}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Panel if Room Selected */}
                                {selectedRoom && (
                                    <div className="mt-8 p-6 bg-gradient-to-r from-violet-900/80 to-indigo-900/80 rounded-2xl border border-white/10 animate-fade-in flex justify-between items-center shadow-2xl">
                                        <div>
                                            <h3 className="text-xl font-bold">Ready to join {selectedRoom.room_name}?</h3>
                                            <p className="text-sm opacity-80 mt-1">Make sure your camera is off before entering.</p>
                                        </div>
                                        <button
                                            className="bg-white text-violet-900 font-bold py-3 px-8 rounded-xl hover:bg-violet-100 hover:shadow-lg hover:shadow-violet-500/20 transition-all active:scale-95"
                                            onClick={handleJoinRoom}
                                        >
                                            Join Room →
                                        </button>
                                    </div>
                                )}
                            </section>

                            {/* Sidebar - Stats */}
                            <aside className="w-full md:w-80 glass-panel p-6 rounded-3xl animate-fade-in hidden md:flex flex-col gap-6">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-violet-600 p-[2px] mb-3 shadow-lg">
                                        <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
                                            <span className="text-2xl">👋</span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold">{user?.name || 'Guest'}</h3>
                                    <p className="text-xs text-gray-400">{user?.role || 'Student'}</p>
                                </div>

                                <div className="flex-1 bg-white/5 rounded-xl p-4 overflow-y-auto">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Study Stats</h4>
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400">Total Time</p>
                                            <p className="text-2xl font-bold text-violet-400">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400">Sessions</p>
                                            <p className="text-2xl font-bold text-green-400">{stats.sessionCount}</p>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </>
                    ) : (
                        /* In Room View */
                        <div className="flex-1 flex flex-col gap-6">
                            {/* Room Header */}
                            <div className="glass-panel p-6 rounded-2xl animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedRoom?.room_name}</h2>
                                        <p className="text-sm opacity-70">You're currently studying</p>
                                    </div>
                                    <button
                                        onClick={handleLeaveRoom}
                                        className="bg-red-500/80 hover:bg-red-600 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                                    >
                                        Leave Room
                                    </button>
                                </div>
                            </div>

                            {/* Chat Section */}
                            <div className="flex-1 glass-panel p-6 rounded-2xl animate-fade-in flex flex-col">
                                <h3 className="text-xl font-bold mb-4">Chat Room</h3>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar">
                                    {messages.length === 0 ? (
                                        <p className="text-center opacity-50 py-8">No messages yet. Say hi! 👋</p>
                                    ) : (
                                        messages.map((msg, idx) => (
                                            <div key={idx} className={`p-3 rounded-lg ${msg.email === user?.email ? 'bg-violet-600/40 ml-auto max-w-[80%]' : 'bg-white/5 mr-auto max-w-[80%]'}`}>
                                                <p className="text-xs opacity-60 mb-1">{msg.email}</p>
                                                <p className="text-sm">{msg.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}

export default App;

