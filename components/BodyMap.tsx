
import React, { useState } from 'react';
import { ChevronLeft, Target, Crosshair } from 'lucide-react';
import { Language } from '../types';

interface BodyMapProps {
  onSelectPart: (part: string) => void;
  selectedPart: string | null;
  language: Language;
}

export const BodyMap: React.FC<BodyMapProps> = ({ onSelectPart, selectedPart, language }) => {
  const [zoomedPart, setZoomedPart] = useState<string | null>(null);

  const t = (en: string, hi: string) => language === Language.HINDI ? hi : en;

  // Hotspots for the main body view
  const hotspots: {
    id: string;
    name: { en: string; hi: string };
    cx: number;
    cy: number;
    r: number;
    labelX: number;
    labelY: number;
    align: 'start' | 'end';
  }[] = [
    { id: 'head', name: { en: 'Head', hi: 'सिर' }, cx: 150, cy: 55, r: 30, labelX: 230, labelY: 55, align: 'start' },
    { id: 'chest', name: { en: 'Chest', hi: 'छाती' }, cx: 150, cy: 130, r: 35, labelX: 230, labelY: 130, align: 'start' },
    { id: 'stomach', name: { en: 'Stomach', hi: 'पेट' }, cx: 150, cy: 200, r: 30, labelX: 230, labelY: 200, align: 'start' },
    { id: 'arms', name: { en: 'Arms', hi: 'हाथ' }, cx: 80, cy: 160, r: 25, labelX: 30, labelY: 160, align: 'end' },
    { id: 'arms_right', name: { en: 'Arms', hi: 'हाथ' }, cx: 220, cy: 160, r: 25, labelX: 270, labelY: 160, align: 'start' },
    { id: 'legs', name: { en: 'Legs', hi: 'पैर' }, cx: 150, cy: 340, r: 50, labelX: 230, labelY: 340, align: 'start' },
  ];

  const handlePartClick = (id: string) => {
    const targetId = id === 'arms_right' ? 'arms' : id;
    setZoomedPart(targetId);
  };

  const handleSubPartClick = (subId: string) => {
    onSelectPart(subId);
  };

  const renderDetailedView = () => {
    const commonSvgClass = "w-full max-w-[280px] h-auto drop-shadow-2xl animate-scale-in";
    
    switch (zoomedPart) {
      case 'head':
        return (
          <div className="flex flex-col items-center space-y-4">
             <div className="bg-teal-50 px-4 py-2 rounded-full border border-teal-100 mb-2">
                <span className="text-sm font-bold text-teal-700 flex items-center italic">
                  <Target className="w-4 h-4 mr-2" /> {t("Tap the specific area of pain", "दर्द के विशिष्ट क्षेत्र पर टैप करें")}
                </span>
             </div>
             <svg viewBox="0 0 200 200" className={commonSvgClass}>
               <defs>
                 <radialGradient id="gradHead" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                   <stop offset="0%" style={{stopColor:'#f8fafc', stopOpacity:1}} />
                   <stop offset="100%" style={{stopColor:'#e2e8f0', stopOpacity:1}} />
                 </radialGradient>
               </defs>
               <circle cx="100" cy="100" r="95" fill="url(#gradHead)" stroke="#94a3b8" strokeWidth="2" />
               
               <g onClick={() => handleSubPartClick('forehead')} className="group cursor-pointer">
                 <path d="M 40 75 Q 100 20 160 75" fill="transparent" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" className="group-hover:stroke-teal-400 transition-colors" />
                 <rect x="70" y="42" width="60" height="18" rx="9" fill="white" className="shadow-sm opacity-90" />
                 <text x="100" y="55" textAnchor="middle" fontSize="9" className="font-black fill-slate-700 pointer-events-none uppercase tracking-widest">{t("Forehead", "माथा")}</text>
               </g>

               <g onClick={() => handleSubPartClick('eyes')} className="group cursor-pointer">
                 <rect x="50" y="85" width="40" height="20" rx="10" fill="#f1f5f9" className="group-hover:fill-teal-100 transition-colors" />
                 <rect x="110" y="85" width="40" height="20" rx="10" fill="#f1f5f9" className="group-hover:fill-teal-100 transition-colors" />
                 <circle cx="70" cy="95" r="4" fill="#64748b" />
                 <circle cx="130" cy="95" r="4" fill="#64748b" />
                 <text x="100" y="82" textAnchor="middle" fontSize="9" className="font-black fill-slate-500 pointer-events-none uppercase tracking-widest">{t("EYES", "आंखें")}</text>
               </g>

               <g onClick={() => handleSubPartClick('ears')} className="group cursor-pointer">
                 <path d="M 15 80 Q 0 100 15 120" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" className="group-hover:stroke-teal-500 transition-colors" />
                 <path d="M 185 80 Q 200 100 185 120" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" className="group-hover:stroke-teal-500 transition-colors" />
                 <text x="100" y="110" textAnchor="middle" fontSize="9" className="font-black fill-slate-500 pointer-events-none uppercase tracking-widest">{t("EARS", "कान")}</text>
               </g>

               <g onClick={() => handleSubPartClick('nose')} className="group cursor-pointer">
                 <path d="M 100 100 L 100 125" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" className="group-hover:stroke-teal-500 transition-colors" />
                 <text x="100" y="138" textAnchor="middle" fontSize="8" className="font-black fill-slate-500 pointer-events-none uppercase tracking-widest">{t("NOSE", "नाक")}</text>
               </g>
               <g onClick={() => handleSubPartClick('mouth')} className="group cursor-pointer">
                 <path d="M 80 150 Q 100 165 120 150" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" className="group-hover:stroke-teal-600 transition-colors" />
                 <text x="100" y="175" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 pointer-events-none uppercase tracking-widest">{t("MOUTH / JAW", "मुंह / जबड़ा")}</text>
               </g>

               {selectedPart && <circle cx="100" cy="100" r="10" fill="#0d9488" className="animate-ping opacity-20" />}
             </svg>
          </div>
        );
      
      case 'chest':
        return (
          <div className="flex flex-col items-center space-y-4">
             <div className="bg-teal-50 px-4 py-2 rounded-full border border-teal-100 mb-2">
                <span className="text-sm font-bold text-teal-700">{t("Torso Details", "धड़ विवरण")}</span>
             </div>
             <svg viewBox="0 0 200 200" className={commonSvgClass}>
                <rect x="20" y="20" width="160" height="160" rx="40" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                
                <g onClick={() => handleSubPartClick('lungs')} className="group cursor-pointer">
                   <path d="M 40 40 Q 70 30 70 120" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" className="group-hover:fill-teal-50 group-hover:stroke-teal-400 transition-all" />
                   <path d="M 160 40 Q 130 30 130 120" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" className="group-hover:fill-teal-50 group-hover:stroke-teal-400 transition-all" />
                   <rect x="60" y="48" width="80" height="16" rx="8" fill="white" className="shadow-sm" />
                   <text x="100" y="60" textAnchor="middle" fontSize="9" className="font-black fill-slate-700 pointer-events-none uppercase tracking-widest">{t("CHEST / LUNGS", "छाती / फेफड़े")}</text>
                </g>

                <g onClick={() => handleSubPartClick('heart')} className="group cursor-pointer">
                   <circle cx="125" cy="85" r="25" fill="#fee2e2" stroke="#fca5a5" strokeWidth="2" strokeDasharray="4" className="group-hover:fill-red-100 transition-colors" />
                   <HeartPulse className="w-5 h-5 text-red-500" x="115" y="75" />
                   <text x="125" y="120" textAnchor="middle" fontSize="8" className="font-black fill-red-600 pointer-events-none uppercase tracking-widest">{t("HEART", "हृदय")}</text>
                </g>
             </svg>
          </div>
        );

      case 'stomach':
         return (
          <div className="flex flex-col items-center space-y-4">
             <div className="bg-teal-50 px-4 py-2 rounded-full border border-teal-100">
                <span className="text-sm font-bold text-teal-700">{t("Abdominal Map", "पेट का नक्शा")}</span>
             </div>
             <svg viewBox="0 0 200 200" className={commonSvgClass}>
                <rect x="40" y="10" width="120" height="180" rx="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                
                <g onClick={() => handleSubPartClick('stomach-upper')} className="group cursor-pointer">
                   <rect x="50" y="20" width="100" height="70" rx="15" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="100" y="55" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("UPPER ABDOMEN", "पेट का ऊपरी हिस्सा")}</text>
                </g>

                <g onClick={() => handleSubPartClick('stomach-lower')} className="group cursor-pointer">
                   <rect x="50" y="100" width="100" height="70" rx="15" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="100" y="135" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("LOWER / PELVIC", "निचला / पेल्विक")}</text>
                </g>
             </svg>
          </div>
        );

      case 'arms':
         return (
          <div className="flex flex-col items-center space-y-4">
             <div className="bg-teal-50 px-4 py-2 rounded-full border border-teal-100">
                <span className="text-sm font-bold text-teal-700">{t("Arm Details", "बांह का विवरण")}</span>
             </div>
             <svg viewBox="0 0 160 300" className={commonSvgClass}>
                <rect x="50" y="10" width="60" height="280" rx="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />

                <g onClick={() => handleSubPartClick('shoulder')} className="group cursor-pointer">
                   <circle cx="80" cy="40" r="30" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="80" y="45" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("SHOULDER", "कंधा")}</text>
                </g>

                <g onClick={() => handleSubPartClick('elbow')} className="group cursor-pointer">
                   <circle cx="80" cy="140" r="25" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="80" y="145" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("ELBOW", "कोहनी")}</text>
                </g>

                <g onClick={() => handleSubPartClick('hand')} className="group cursor-pointer">
                   <circle cx="80" cy="240" r="35" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="80" y="245" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("HAND / WRIST", "हाथ / कलाई")}</text>
                </g>
             </svg>
          </div>
        );
      
      case 'legs':
         return (
          <div className="flex flex-col items-center space-y-4">
             <div className="bg-teal-50 px-4 py-2 rounded-full border border-teal-100">
                <span className="text-sm font-bold text-teal-700">{t("Leg & Foot Analysis", "पैर और पंजे का विश्लेषण")}</span>
             </div>
             <svg viewBox="0 0 160 300" className={commonSvgClass}>
                <rect x="50" y="10" width="60" height="280" rx="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />

                <g onClick={() => handleSubPartClick('thigh')} className="group cursor-pointer">
                   <rect x="55" y="20" width="50" height="80" rx="10" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="80" y="65" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("THIGH", "जांघ")}</text>
                </g>

                <g onClick={() => handleSubPartClick('knee')} className="group cursor-pointer">
                   <circle cx="80" cy="140" r="25" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="80" y="145" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("KNEE", "घुटना")}</text>
                </g>

                <g onClick={() => handleSubPartClick('foot')} className="group cursor-pointer">
                   <rect x="55" y="210" width="50" height="70" rx="15" fill="#f1f5f9" className="group-hover:fill-teal-50 transition-colors" />
                   <text x="80" y="245" textAnchor="middle" fontSize="10" className="font-black fill-slate-700 uppercase tracking-widest">{t("FOOT / ANKLE", "पैर / टखना")}</text>
                </g>
             </svg>
          </div>
        );

      default:
        return null;
    }
  };

  const HeartPulse = ({ className, x, y }: { className?: string, x: string, y: string }) => (
    <svg x={x} y={y} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
    </svg>
  );

  if (zoomedPart) {
    return (
      <div className="relative flex flex-col items-center w-full bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl overflow-hidden">
        <button 
          onClick={() => setZoomedPart(null)} 
          className="absolute top-6 left-6 flex items-center text-slate-500 font-bold hover:text-teal-600 transition-colors z-20 bg-slate-50/50 pr-4 pl-2 py-1 rounded-full"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="text-[10px] uppercase tracking-widest">{t("Full Body", "पूरा शरीर")}</span>
        </button>
        <div className="w-full mt-4 flex flex-col items-center">
           {renderDetailedView()}
        </div>
        <div className="mt-8 text-center bg-teal-50/50 w-full py-4 rounded-2xl border border-dashed border-teal-200">
          <p className="text-teal-800 text-xs font-black uppercase tracking-widest">{selectedPart ? `${t("Selected", "चयनित")}: ${selectedPart}` : t("Select a localized zone", "एक स्थानीय क्षेत्र चुनें")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center w-full animate-fade-in group">
      <div className="relative bg-white rounded-[3rem] p-4 border border-slate-100 shadow-sm">
        <svg viewBox="0 0 300 450" className="w-64 h-auto drop-shadow-sm transition-transform group-hover:scale-[1.01] duration-500">
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:'#f8fafc', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#f1f5f9', stopOpacity:1}} />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <path 
            d="M150,25 C135,25 125,35 125,55 C125,75 135,85 150,85 C165,85 175,75 175,55 C175,35 165,25 150,25 Z M125,85 L100,95 C90,100 80,110 80,130 L80,220 C80,240 90,250 100,250 L120,250 L115,420 C115,440 125,450 145,450 L155,450 C175,450 185,440 185,420 L180,250 L200,250 C210,250 220,240 220,220 L220,130 C220,110 210,100 200,95 L175,85 Z"
            fill="url(#bodyGrad)"
            stroke="#e2e8f0"
            strokeWidth="3"
            className="transition-all duration-300"
          />

          <rect x="70" y="0" width="160" height="2" fill="#2dd4bf" className="animate-scan-y opacity-30 pointer-events-none" />

          {hotspots.map((spot) => (
            <g key={spot.id} onClick={() => handlePartClick(spot.id)} className="group cursor-pointer">
              {/* Connection Line */}
              <line 
                x1={spot.cx} y1={spot.cy} 
                x2={spot.align === 'start' ? spot.labelX - 10 : spot.labelX + 10} 
                y2={spot.cy} 
                stroke="#cbd5e1" 
                strokeWidth="1" 
                strokeDasharray="2,2" 
                className="opacity-40"
              />
              
              <circle 
                cx={spot.cx} 
                cy={spot.cy} 
                r={spot.r} 
                fill="transparent" 
                className="transition-all group-hover:fill-teal-500/10" 
              />
              <circle 
                cx={spot.cx} 
                cy={spot.cy} 
                r="6" 
                fill="white" 
                stroke="#2dd4bf" 
                strokeWidth="2" 
                className="group-hover:scale-150 transition-transform" 
              />
              <circle 
                cx={spot.cx} 
                cy={spot.cy} 
                r="12" 
                fill="none" 
                stroke="#2dd4bf" 
                strokeWidth="1" 
                className="animate-ping opacity-30" 
              />
              
              {/* Always visible pill label */}
              <g>
                 <rect 
                   x={spot.align === 'end' ? spot.labelX - 45 : spot.labelX} 
                   y={spot.labelY - 10} 
                   width="45" 
                   height="20" 
                   rx="10" 
                   fill="white" 
                   stroke="#e2e8f0" 
                   strokeWidth="1" 
                   className="shadow-sm group-hover:stroke-teal-400 group-hover:shadow-md transition-all" 
                 />
                 <text 
                   x={spot.align === 'end' ? spot.labelX - 22.5 : spot.labelX + 22.5} 
                   y={spot.labelY + 4} 
                   textAnchor="middle" 
                   fontSize="9" 
                   className="font-black fill-slate-700 uppercase tracking-widest pointer-events-none group-hover:fill-teal-600 transition-colors"
                 >
                   {t(spot.name.en, spot.name.hi)}
                 </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
      
      <div className="mt-8 flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2 text-slate-400 bg-white px-6 py-2 rounded-full border border-slate-100 shadow-sm">
           <Crosshair className="w-4 h-4 text-teal-500 animate-spin-slow" />
           <span className="text-[10px] font-black uppercase tracking-widest italic">{t("Medical Scan Active", "मेडिकल स्कैन सक्रिय")}</span>
        </div>
        <p className="text-slate-500 text-xs font-bold">{t("Tap an area to describe symptoms", "लक्षणों का वर्णन करने के लिए किसी क्षेत्र को टैप करें")}</p>
      </div>

      <style>{`
        @keyframes scanY {
          0% { transform: translateY(0); }
          50% { transform: translateY(450px); }
          100% { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scan-y { animation: scanY 5s linear infinite; }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-spin-slow { animation: spin 3s linear infinite; }
      `}</style>
    </div>
  );
};
