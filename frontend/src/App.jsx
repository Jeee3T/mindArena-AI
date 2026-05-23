import React, { useState } from 'react';
import DebateDashboard from './pages/DebateDashboard';
import { Brain } from 'lucide-react';

export default function App() {
  const [topic, setTopic] = useState("");
  const [resetCounter, setResetCounter] = useState(0);

  const handleLogoClick = () => {
    setTopic("");
    setResetCounter(prev => prev + 1);
  };

  return (
    <div className="min-h-screen w-full bg-[#030307] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-white selection:text-black">
      
      {/* Radial green/teal glow at the top center matching Image 1 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />

      {/* Floating Capsule Header - Rendered conditionally when a topic is active */}
      {topic && (
        <div className="w-full flex justify-center pt-6 px-4 z-50 animate-fade-in">
          <div className="w-full max-w-xl glass-panel rounded-full px-6 py-2.5 flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/5 backdrop-blur-md">
            <button 
              onClick={handleLogoClick}
              className="text-sm font-semibold text-slate-200 hover:text-white transition flex items-center gap-2.5 active:scale-98 font-sans"
            >
              <div className="p-1.5 bg-cyan-400/20 border border-cyan-400/30 rounded-lg text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <Brain className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-0.5 text-sm font-bold tracking-wide">
                <span className="text-cyan-300">mind</span>
                <span className="text-violet-300">Arena</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="flex-grow flex flex-col justify-center">
        <DebateDashboard 
          key={resetCounter} 
          topic={topic} 
          setTopic={setTopic} 
        />
      </div>

      {/* Minimalist Footer */}
      <footer className="w-full max-w-7xl mx-auto py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-600 font-mono tracking-widest uppercase bg-[#030307] mt-12 border-t border-slate-950/40">
        <div className="text-cyan-400 font-bold tracking-widest">MINDARENA</div>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:text-slate-400 transition">Privacy</a>
          <a href="#terms" className="hover:text-slate-400 transition">Terms</a>
          <a href="#api" className="hover:text-slate-400 transition">API</a>
          <a href="#support" className="hover:text-slate-400 transition">Support</a>
        </div>
        <div>&copy; {new Date().getFullYear()} MINDARENA</div>
      </footer>
    </div>
  );
}
