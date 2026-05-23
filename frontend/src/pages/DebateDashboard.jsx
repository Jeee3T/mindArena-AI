import React, { useState, useEffect, useRef } from 'react';
import { 
  sendMessage, 
  getVerdict 
} from '../services/api';
import { 
  GraduationCap, 
  Cpu, 
  BookOpen, 
  Scale, 
  RotateCcw,
  ArrowLeftRight,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function DebateDashboard({ topic, setTopic }) {
  const [inputTopic, setInputTopic] = useState("");
  const [history, setHistory] = useState([]);
  const [activePersona, setActivePersona] = useState(null); // 'teacher' | 'founder' | 'student' | 'moderator' | null
  const [error, setError] = useState("");

  const chatContainerRef = useRef(null);

  // Smooth scroll the chat container to the bottom when chat updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history, activePersona, topic]);

  const handleStartDebate = (selectedTopic) => {
    if (!selectedTopic.trim() || selectedTopic.trim().length < 5) {
      setError("Please enter a valid debate topic (at least 5 characters).");
      return;
    }
    setTopic(selectedTopic.trim());
    setHistory([]);
    setError("");
  };

  const handlePersonaClick = async (persona) => {
    if (activePersona || !topic) return;
    
    setActivePersona(persona);
    setError("");
    
    const apiHistory = history.map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    try {
      const responseText = await sendMessage(topic, persona, apiHistory);
      
      setHistory(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          sender: persona, 
          text: responseText 
        }
      ]);
    } catch (err) {
      setError(err.message || `Failed to generate a response from the ${persona}.`);
    } finally {
      setActivePersona(null);
    }
  };

  const handleModeratorVerdict = async () => {
    if (activePersona || !topic || history.length === 0) return;
    
    setActivePersona('moderator');
    setError("");

    const apiHistory = history.map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    try {
      const responseText = await getVerdict(topic, apiHistory);
      
      setHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'moderator',
          text: responseText
        }
      ]);
    } catch (err) {
      setError(err.message || "Failed to generate the moderator verdict.");
    } finally {
      setActivePersona(null);
    }
  };

  const handleClearChat = () => {
    setHistory([]);
    setError("");
  };

  const handleResetTopic = () => {
    setTopic("");
    setHistory([]);
    setError("");
    setInputTopic("");
  };

  const hasVerdict = history.some(msg => msg.sender === 'moderator');

  // Determine which card is currently active (speaking or spoke last)
  const lastMessage = history.length > 0 ? history[history.length - 1] : null;
  
  const isTeacherActive = activePersona === 'teacher' || (lastMessage && lastMessage.sender === 'teacher');
  const isFounderActive = activePersona === 'founder' || (lastMessage && lastMessage.sender === 'founder');
  const isStudentActive = activePersona === 'student' || (lastMessage && lastMessage.sender === 'student');

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col space-y-6 flex-grow">
      
      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-sm flex gap-3 items-start animate-fade-in z-10">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <h5 className="font-bold">System Alert</h5>
            <p className="leading-relaxed font-light">{error}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: SETUP TOPIC (WELCOME PAGE) */}
      {!topic ? (
        <div className="space-y-8 py-12 animate-slide-up flex-grow flex flex-col justify-center">
          
          {/* Hero Typography */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Synthesize Truth <span className="text-slate-500 font-light italic">from</span> Tension
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-light max-w-lg mx-auto leading-relaxed">
              High-fidelity, multi-perspective AI debates designed to challenge assumptions and reveal nuance.
            </p>
          </div>

          {/* DEBATE INPUT CARD */}
          <div className="w-full max-w-xl mx-auto glass-panel rounded-xl p-5 border border-white/5 shadow-2xl flex flex-col space-y-4 bg-[#0a0a12]/30 backdrop-blur-lg">
            
            {/* Pill-shaped search bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleStartDebate(inputTopic); }}
              className="w-full flex items-center bg-[#05050b]/80 border border-slate-800/80 rounded-full p-1.5 focus-within:border-slate-700/80 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.02)] transition-all"
            >
              <input 
                type="text" 
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                placeholder="Should AI replace traditional classrooms?"
                className="flex-grow bg-transparent border-0 outline-none text-sm text-slate-200 placeholder-slate-600 px-4 py-1.5 focus:ring-0"
              />
              <button 
                type="submit"
                className="px-5 py-1.5 rounded-full bg-white hover:bg-slate-200 text-black text-[10px] font-bold uppercase tracking-wider transition active:scale-95 shrink-0"
              >
                Simulate
              </button>
            </form>

            {/* Suggestions row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-900/60 text-xs">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Suggestions</span>
              <div className="flex gap-2">
                {[
                  { display: "Remote work", full: "Should remote work become permanent?" },
                  { display: "AI Copyright", full: "Can AI-generated art be copyrighted?" },
                  { display: "UBI", full: "Should Universal Basic Income (UBI) be implemented?" }
                ].map((sugg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStartDebate(sugg.full)}
                    className="px-3 py-1 rounded-full border border-slate-850 bg-slate-950/40 hover:bg-slate-900/80 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition duration-150 active:scale-95"
                  >
                    {sugg.display}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: ACTIVE GROUP CHAT */
        <div className="flex-grow flex flex-col space-y-8 animate-fade-in pb-12">
          
          {/* ONGOING DEBATE TOPIC CARD WITH IMAGE 1 STYLING AND GLOW */}
          <div className="rounded-2xl p-5 border border-teal-500/10 bg-[#070c0f]/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_50px_rgba(20,184,166,0.06)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-950/30 border border-teal-500/20 text-teal-400 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.15)] flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-teal-400 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase font-semibold">Ongoing Debate Topic</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-200 mt-1">"{topic}"</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800/80 bg-[#070c0f]/60 hover:bg-slate-900 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-250 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Chat</span>
              </button>
              <button
                onClick={handleResetTopic}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800/80 bg-[#070c0f]/60 hover:bg-slate-900 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-250 transition active:scale-[0.98]"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Topic</span>
              </button>
            </div>
          </div>

          {/* PERSPECTIVE BUTTON PANEL */}
          <div className="grid grid-cols-3 gap-3">
            
            {/* TEACHER CARD (ANAND) */}
            <button
              onClick={() => handlePersonaClick('teacher')}
              disabled={!!activePersona || hasVerdict}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-2.5 active:scale-[0.97]
                ${activePersona || hasVerdict 
                  ? 'border-slate-900 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50' 
                  : isTeacherActive
                    ? 'border-teal-500 bg-slate-900/60 text-teal-400 shadow-[0_0_20px_rgba(13,148,136,0.15)]'
                    : 'border-slate-900 bg-slate-950 hover:bg-slate-900/60 hover:border-teal-500/40 text-teal-400'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border bg-slate-950/40 transition-colors
                ${isTeacherActive ? 'border-teal-400 text-teal-400' : 'border-slate-800 text-teal-500'}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className={`text-[10px] font-mono tracking-widest uppercase transition-colors
                  ${isTeacherActive ? 'text-teal-400' : 'text-teal-500/80'}`}>Prof. Vasundhara Sen</div>
                <div className="text-sm font-bold text-slate-100 mt-1">Teacher</div>
              </div>
            </button>

            {/* FOUNDER CARD (NEHA) */}
            <button
              onClick={() => handlePersonaClick('founder')}
              disabled={!!activePersona || hasVerdict}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-2.5 active:scale-[0.97]
                ${activePersona || hasVerdict 
                  ? 'border-slate-900 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50' 
                  : isFounderActive
                    ? 'border-emerald-500 bg-slate-900/60 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'border-slate-900 bg-slate-950 hover:bg-slate-900/60 hover:border-emerald-500/40 text-emerald-400'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border bg-slate-950/40 transition-colors
                ${isFounderActive ? 'border-emerald-400 text-emerald-400' : 'border-slate-800 text-emerald-500'}`}>
                <Cpu className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className={`text-[10px] font-mono tracking-widest uppercase transition-colors
                  ${isFounderActive ? 'text-emerald-400' : 'text-emerald-500/80'}`}>Devendra Singhania</div>
                <div className="text-sm font-bold text-slate-100 mt-1">Founder</div>
              </div>
            </button>

            {/* STUDENT CARD (ROHAN) */}
            <button
              onClick={() => handlePersonaClick('student')}
              disabled={!!activePersona || hasVerdict}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-2.5 active:scale-[0.97]
                ${activePersona || hasVerdict 
                  ? 'border-slate-900 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50' 
                  : isStudentActive
                    ? 'border-indigo-500 bg-slate-900/60 text-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.15)]'
                    : 'border-slate-900 bg-slate-950 hover:bg-slate-900/60 hover:border-indigo-500/40 text-indigo-400'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border bg-slate-950/40 transition-colors
                ${isStudentActive ? 'border-indigo-400 text-indigo-400' : 'border-slate-800 text-indigo-500'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-center">
                <div className={`text-[10px] font-mono tracking-widest uppercase transition-colors
                  ${isStudentActive ? 'text-indigo-400' : 'text-indigo-500/80'}`}>Ananya Roy</div>
                <div className="text-sm font-bold text-slate-100 mt-1">Student</div>
              </div>
            </button>
          </div>

          {/* CHAT CHRONOLOGICAL WORKSPACE */}
          <div 
            ref={chatContainerRef}
            className="w-full h-[480px] overflow-y-auto no-scrollbar flex flex-col space-y-8 py-4 px-2"
          >
            {history.length === 0 && !activePersona ? (
              <div className="flex flex-col items-center justify-center text-center space-y-2 py-16 text-slate-600 font-light glass-panel rounded-2xl border border-slate-900/80 p-6 bg-slate-900/10">
                <MessageSquare className="w-8 h-8 text-slate-700 mb-1" />
                <p className="text-sm">The debate chat is empty.</p>
                <p className="text-xs max-w-xs leading-relaxed text-slate-650">
                  Tap any of the perspective buttons above to generate a short, natural opinion from that persona.
                </p>
              </div>
            ) : (
              <>
                {history.map((msg) => {
                  let bubbleStyle = "";
                  let iconBg = "";
                  let iconColor = "";
                  let nameLabel = "";
                  let titleLabel = "";
                  let alignStyle = ""; // left ('mr-auto self-start') vs right ('ml-auto self-end flex-row-reverse')
                  let headerAlignStyle = "";
                  let AvatarIcon = GraduationCap;
                  let tags = [];

                  if (msg.sender === 'teacher') {
                    bubbleStyle = "rounded-2xl rounded-tr-none border-teal-500/20 bg-[#070d10]/40 text-teal-100 shadow-[0_0_15px_rgba(13,148,136,0.02)]";
                    iconBg = "bg-teal-500/10 border-teal-500/20";
                    iconColor = "text-teal-400";
                    nameLabel = "PROF. DR. VASUNDHARA SEN";
                    titleLabel = "SENIOR EDUCATOR";
                    AvatarIcon = GraduationCap;
                    alignStyle = "ml-auto self-end flex-row-reverse pl-12";
                    headerAlignStyle = "flex-row-reverse text-right";
                    tags = ["EMPATHY PILLAR", "HUMAN CAPITAL"];
                  } else if (msg.sender === 'founder') {
                    bubbleStyle = "rounded-2xl rounded-tl-none border-emerald-500/20 bg-[#07100b]/40 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.02)]";
                    iconBg = "bg-emerald-500/10 border-emerald-500/20";
                    iconColor = "text-emerald-400";
                    nameLabel = "DEVENDRA SINGHANIA";
                    titleLabel = "VC & TECH FOUNDER";
                    AvatarIcon = Cpu;
                    alignStyle = "mr-auto self-start pr-12";
                    headerAlignStyle = "";
                    tags = ["EFFICIENCY FOCUS", "DATA METRIC"];
                  } else if (msg.sender === 'student') {
                    bubbleStyle = "rounded-2xl rounded-tr-none border-indigo-500/20 bg-[#0a0710]/40 text-indigo-100 shadow-[0_0_15px_rgba(129,140,248,0.02)] italic";
                    iconBg = "bg-indigo-500/10 border-indigo-500/20";
                    iconColor = "text-indigo-400";
                    nameLabel = "ANANYA ROY";
                    titleLabel = "RESEARCH FELLOW";
                    AvatarIcon = BookOpen;
                    alignStyle = "mr-auto self-start pr-12";
                    headerAlignStyle = "";
                    tags = ["STUDENT VOICE", "PRACTICAL UTILITY"];
                  } else if (msg.sender === 'moderator') {
                    bubbleStyle = "rounded-2xl border-slate-100/20 bg-white/[0.03] text-slate-100 shadow-[0_0_25px_rgba(255,255,255,0.05)] max-w-2xl mx-auto border-dashed";
                    iconBg = "bg-white/10 border-white/20";
                    iconColor = "text-slate-100";
                    nameLabel = "DR. SHEKHAR RAGHAVAN";
                    titleLabel = "MODERATOR VERDICT";
                    AvatarIcon = Scale;
                    alignStyle = "mx-auto w-full";
                    headerAlignStyle = "justify-center";
                    tags = [];
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-4 items-start animate-slide-up max-w-[85%] w-full ${alignStyle}`}
                    >
                      <div className={`p-2.5 rounded-full border flex-shrink-0 ${iconBg} ${iconColor}`}>
                        <AvatarIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5 flex-grow">
                        <div className={`flex items-center gap-1.5 text-[10px] font-mono tracking-widest ${headerAlignStyle}`}>
                          <span className={`font-bold ${iconColor}`}>{nameLabel}</span>
                          <span className="text-slate-650">•</span>
                          <span className="text-slate-500">{titleLabel}</span>
                        </div>
                        <div className={`p-5 border text-sm sm:text-base leading-relaxed ${bubbleStyle}`}>
                          <div className="text-slate-200">“{msg.text}”</div>
                          
                          {/* Inside-bubble capsule tags */}
                          {tags.length > 0 && (
                            <div className={`flex gap-1.5 mt-3 ${msg.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                              {tags.map((tag, tIdx) => (
                                <span 
                                  key={tIdx} 
                                  className="px-2.5 py-0.5 rounded border border-slate-800 bg-[#0f172a]/20 text-[9px] font-mono tracking-widest text-slate-500"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* ACTIVE PERSONA TYPING INDICATOR */}
                {activePersona && (
                  <div className={`flex gap-4 items-start animate-fade-in max-w-[85%] w-full
                    ${activePersona === 'teacher' ? 'ml-auto self-end flex-row-reverse pl-12' : 'mr-auto self-start pr-12'}`}
                  >
                    {(() => {
                      let iconBg = "";
                      let iconColor = "";
                      let nameLabel = "";
                      let AvatarIcon = GraduationCap;

                      if (activePersona === 'teacher') {
                        iconBg = "bg-teal-500/10 border-teal-500/20";
                        iconColor = "text-teal-400";
                        nameLabel = "Prof. Vasundhara Sen is replying...";
                        AvatarIcon = GraduationCap;
                      } else if (activePersona === 'founder') {
                        iconBg = "bg-emerald-500/10 border-emerald-500/20";
                        iconColor = "text-emerald-400";
                        nameLabel = "Devendra Singhania is replying...";
                        AvatarIcon = Cpu;
                      } else if (activePersona === 'student') {
                        iconBg = "bg-indigo-500/10 border-indigo-500/20";
                        iconColor = "text-indigo-400";
                        nameLabel = "Ananya Roy is replying...";
                        AvatarIcon = BookOpen;
                      } else if (activePersona === 'moderator') {
                        iconBg = "bg-white/10 border-white/20";
                        iconColor = "text-slate-100";
                        nameLabel = "Dr. Shekhar Raghavan is writing verdict...";
                        AvatarIcon = Scale;
                      }

                      return (
                        <>
                          <div className={`p-2.5 rounded-full border flex-shrink-0 ${iconBg} ${iconColor}`}>
                            <AvatarIcon className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-slate-500">{nameLabel}</div>
                            <div className={`p-3 px-4 rounded-2xl rounded-tl-none border bg-slate-900/50 border-slate-800/80 flex items-center space-x-1.5 ${iconColor}`}>
                              <span className="w-2.5 h-2.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-2.5 h-2.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-2.5 h-2.5 rounded-full bg-current animate-bounce" />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* STICKY MODERATOR ACTION FOOTER */}
          <div className="flex justify-center pt-8">
            <button
              onClick={handleModeratorVerdict}
              disabled={!!activePersona || history.length === 0 || hasVerdict}
              className={`flex items-center justify-center gap-2.5 px-8 py-4 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-lg
                ${(activePersona || history.length === 0 || hasVerdict)
                  ? 'border-slate-900 bg-slate-950 text-slate-600 cursor-not-allowed opacity-50 shadow-none'
                  : 'border-[#34d399]/40 bg-[#0f172a]/20 text-slate-100 hover:text-white hover:border-[#34d399] hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]'
                }`}
            >
              <Scale className="w-4 h-4 text-[#34d399]" />
              <span>Generate Moderator Verdict</span>
              <ArrowRight className="w-4 h-4 ml-1 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
