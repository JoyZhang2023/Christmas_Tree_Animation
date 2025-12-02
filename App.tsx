import React, { useState } from 'react';
import ChristmasTree from './components/ChristmasTree';

const App: React.FC = () => {
  const [showGreeting, setShowGreeting] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleReplay = () => {
    setShowGreeting(false);
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] overflow-hidden">
      
      {/* Pop-out Merry Christmas Message */}
      <div 
        className={`absolute bottom-32 left-0 right-0 z-20 pointer-events-none text-center transition-all duration-1000 ease-out transform ${
          showGreeting ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'
        }`}
      >
        <h1 
          className="text-6xl md:text-8xl text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Merry Christmas
        </h1>
        <p className="mt-2 text-white/90 text-2xl md:text-3xl font-light tracking-widest drop-shadow-md font-sans">
          圣诞快乐
        </p>
      </div>

      {/* Main Canvas with Callback - Key change forces complete re-render/reset */}
      <ChristmasTree key={resetKey} onAnimationComplete={() => setShowGreeting(true)} />

      {/* Replay Button - Visible only when animation finishes */}
      <div className={`absolute bottom-16 left-0 right-0 z-30 text-center transition-opacity duration-1000 ${showGreeting ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={handleReplay}
          className="px-8 py-2 border border-[#FFD700]/50 text-[#FFD700] rounded-full hover:bg-[#FFD700] hover:text-[#020205] transition-all duration-300 font-mono text-sm uppercase tracking-widest backdrop-blur-sm shadow-[0_0_10px_rgba(255,215,0,0.2)] hover:shadow-[0_0_20px_rgba(255,215,0,0.6)]"
        >
          Replay
        </button>
      </div>

      {/* Footer/Credit */}
      <div className="absolute bottom-4 left-0 right-0 z-10 text-center pointer-events-none">
        <p className="text-white/20 text-xs font-mono">
          Christmas Tree Animation
        </p>
      </div>
    </div>
  );
};

export default App;