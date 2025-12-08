import React, { useState } from 'react';
import { Send, ChevronRight } from 'lucide-react';

const CORRECT_WORD = "gemini";

const VictoryScreen = ({ onRestart }) => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono text-slate-200 relative overflow-hidden animate-in fade-in duration-1000">
        <div className="text-center space-y-8">
            <h2 className="text-4xl font-bold text-emerald-400 tracking-widest">CHALLENGE COMPLETE</h2>
            <p className="text-slate-300 text-lg">You have successfully guessed the word and completed the final challenge.</p>
            <div className="flex flex-col items-center gap-2">
                <div className="w-48 h-48 flex items-center justify-center bg-emerald-900/30 border-2 border-emerald-500 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                    <span className="text-8xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">I</span>
                </div>
            </div>
            <button onClick={onRestart} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600/90 font-mono rounded-lg hover:bg-blue-500 hover:shadow-lg backdrop-blur-sm">
                <span className="mr-2 text-lg">RESTART</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    </div>
);


const GeminiRoom = ({ onComplete, onRestart, collectedLetters = [] }) => {
    const [guess, setGuess] = useState('');
    const [attempts, setAttempts] = useState(3);
    const [message, setMessage] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const [victory, setVictory] = useState(false);

    const wordHint = "G E M I N I".split(' ').map(letter => collectedLetters.includes(letter) ? letter : '_').join(' ');

    const handleGuess = (e) => {
        e.preventDefault();
        if (gameOver || victory) return;

        if (guess.toLowerCase() === CORRECT_WORD) {
            setMessage('Correct! You have completed the final challenge.');
            setVictory(true);
            // Call the onComplete prop if you need to notify the parent component
            if(onComplete) onComplete();
        } else {
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);
            if (newAttempts > 0) {
                setMessage(`Incorrect guess. Please try again.`);
            } else {
                setMessage('You have run out of attempts. Game over.');
                setGameOver(true);
            }
        }
        setGuess('');
    };
    
    if (victory) {
        return <VictoryScreen onRestart={onRestart}/>;
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-mono text-slate-200">
             <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
                <source src="/assets/gemini-room-background.mp4" type="video/mp4" />
            </video>
            <div className="relative z-10 w-full max-w-2xl bg-slate-800/80 border border-purple-500/30 rounded-lg p-8 shadow-2xl backdrop-blur-sm animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold text-center mb-4 text-purple-400 tracking-wider">The Final Challenge</h1>
                <p className="text-center text-slate-300 mb-8">Can you guess the final word?</p>

                <div className="text-center my-10">
                    <p className="text-5xl font-extrabold tracking-[1.5rem] text-white uppercase">{wordHint}</p>
                </div>

                <form onSubmit={handleGuess} className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Enter your guess"
                        className="flex-grow bg-slate-950/50 text-white border border-slate-700 rounded-md py-4 px-5 focus:outline-none focus:border-purple-500 text-lg"
                        disabled={gameOver || victory}
                    />
                    <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-md flex items-center justify-center gap-2 text-lg transition-all duration-300 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        disabled={gameOver || victory || !guess}
                    >
                        <Send size={18} />
                        Submit Guess
                    </button>
                </form>

                <div className="text-center mt-6 h-8">
                    <p className={`text-lg ${gameOver ? 'text-red-400' : 'text-slate-400'} transition-colors`}>
                        {message || `Attempts remaining: ${attempts}`}
                    </p>
                </div>
                 {gameOver && (
                    <div className="text-center mt-4">
                        <button onClick={onRestart} className="text-blue-400 hover:text-blue-300">
                            Restart
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeminiRoom;
