
import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  Mic, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Calendar as CalendarIcon,
  Languages,
  Activity,
  User,
  Navigation as NavIcon,
  MessageSquare,
  ChevronLeft,
  Clock,
  Sun,
  Moon,
  Cloud,
  Wallet,
  Baby,
  Plus,
  Home,
  FileText,
  History,
  XCircle,
  Check,
  Bot,
  Send,
  X,
  Bell,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Menu,
  HeartPulse,
  LogOut,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Undo2,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Search,
  ArrowUpRight,
  Info,
  BadgeCheck,
  Globe,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { AppStep, Language, TriageResult, HistoryItem } from './types';
import { Button } from './components/Button';
import { BodyMap } from './components/BodyMap';
import { analyzeSymptoms, getAssistantHelp } from './services/geminiService';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.PROFILE_SELECT);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'history'>('dashboard');
  
  // Profile State
  const [selectedProfile, setSelectedProfile] = useState<{name: string, color: string} | null>(null);

  // Inputs
  const [symptomDetailInput, setSymptomDetailInput] = useState<string>('');
  const [followUpAnswer, setFollowUpAnswer] = useState<string>('');
  
  // Helper Assistant State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpInput, setHelpInput] = useState('');
  const [helpChat, setHelpChat] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [isHelpLoading, setIsHelpLoading] = useState(false);

  // AI State
  const [isListening, setIsListening] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string>('');
  
  // Mock Data for History (Vault)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    {
      id: 'h1',
      date: '12 Oct 2023',
      doctor: 'Dr. Sameer Khan',
      specialty: 'Dermatologist',
      urgency: 'Low',
      symptoms: 'Red itchy rash on the forearm after garden work.',
      diagnosis: 'Contact Dermatitis due to weed exposure.',
      careAdvice: 'Apply Hydrocortisone twice daily. Avoid scratching the area.'
    },
    {
      id: 'h2',
      date: '25 Aug 2023',
      doctor: 'Dr. Anita Desai',
      specialty: 'General Physician',
      urgency: 'Medium',
      symptoms: 'High fever (102F), body ache, and dry cough.',
      diagnosis: 'Viral Influenza (Flu).',
      careAdvice: 'Rest, Paracetamol every 6 hours, and maintain high fluid intake.'
    }
  ]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  // Booking State
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentAppt, setCurrentAppt] = useState<{
    id: string;
    doctor: string;
    specialty: string;
    date: string;
    time: string;
    status: 'scheduled' | 'cancelled';
    careAdvice?: string;
    hospitalName?: string;
    address?: string;
  } | null>({
    id: 'appt-001',
    doctor: 'Dr. Rajesh Sharma',
    specialty: 'Orthopedic',
    date: '24 Oct 2023',
    time: '10:30 AM',
    status: 'scheduled',
    careAdvice: 'Keep the leg elevated. Use ice packs for 15 mins every 3 hours.',
    hospitalName: 'Apollo Speciality Clinic',
    address: 'Greams Road, Thousand Lights, Chennai'
  });

  const recognitionRef = useRef<any>(null);
  const helpChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
      }
    }
  }, []);

  useEffect(() => {
    if (helpChatEndRef.current) {
      helpChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [helpChat]);

  const t = (en: string, hi: string, es: string = en) => {
    if (language === Language.HINDI) return hi;
    if (language === Language.SPANISH) return es;
    return en;
  };

  const handleProfileSelect = (name: string, color: string) => {
    setSelectedProfile({ name, color });
    setStep(AppStep.LANGUAGE_SELECT);
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setStep(AppStep.DASHBOARD_VIEW);
  };

  const handleBookClick = (docId: string) => {
    setSelectedDoctor(docId);
    setStep(AppStep.BOOKING_SLOT_SELECTION);
  };

  const handleReschedule = () => {
    setStep(AppStep.BOOKING_SLOT_SELECTION);
  };

  const handleCancelAppt = () => {
    if (!cancelReason.trim()) {
      alert(t("Please provide a reason for cancellation.", "कृपया रद्दीकरण का कारण बताएं।", "Por favor proporcione un motivo de cancelación."));
      return;
    }
    setCurrentAppt(null);
    setShowCancelModal(false);
    setCancelReason('');
    alert(t("Appointment cancelled successfully.", "अपॉइंटमेंट सफलतापूर्वक रद्द कर दिया गया।", "Cita cancelada con éxito."));
  };

  const toggleListening = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (!recognitionRef.current) return alert("Voice not supported");
    if (isListening) { 
      recognitionRef.current.stop(); 
      setIsListening(false); 
    }
    else {
      recognitionRef.current.lang = language === Language.HINDI ? 'hi-IN' : language === Language.SPANISH ? 'es-ES' : 'en-US';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setter(prev => prev + " " + transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.start();
    }
  };

  const handleHelpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!helpInput.trim() || isHelpLoading) return;
    const userMsg = helpInput.trim();
    setHelpChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setHelpInput('');
    setIsHelpLoading(true);
    const botResponse = await getAssistantHelp(userMsg, AppStep[step], language);
    setHelpChat(prev => [...prev, { role: 'bot', text: botResponse }]);
    setIsHelpLoading(false);
  };

  const processTriage = async (newSymptomText: string, isFollowUp: boolean = false) => {
    setStep(AppStep.TRIAGE_LOADING);
    const profileContext = selectedProfile ? `Patient Profile: ${selectedProfile.name}` : '';
    const fullHistory = (conversationHistory ? conversationHistory + " | " : "") + profileContext + " | " + newSymptomText;
    try {
      const result = await analyzeSymptoms(newSymptomText, language, fullHistory, isFollowUp);
      setTriageResult(result);
      setConversationHistory(fullHistory);
      if (result.followUpQuestion && result.urgency !== 'High' && !isFollowUp) {
        setStep(AppStep.FOLLOW_UP_INPUT);
      } else {
        setStep(AppStep.RESULTS);
      }
    } catch (e) {
      setStep(AppStep.INPUT_METHOD_SELECT);
    }
  };

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto py-8 animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">{t(`Hello, ${selectedProfile?.name}`, `नमस्ते, ${selectedProfile?.name}`, `Hola, ${selectedProfile?.name}`)}</h1>
          <p className="text-slate-500">{t("Your health journey starts here.", "आपकी स्वास्थ्य यात्रा यहाँ से शुरू होती है।", "Tu viaje de salud comienza aquí.")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setStep(AppStep.INPUT_METHOD_SELECT)} icon={<Plus />} className="shadow-teal-200">{t("New Assessment", "नया मूल्यांकन", "Nueva evaluación")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setStep(AppStep.BODY_MAP)}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center space-x-6"
          >
             <div className="bg-teal-100 p-6 rounded-[2rem] text-teal-600 group-hover:scale-110 transition-transform">
                <User className="w-10 h-10" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800">{t("Symptom Body Map", "लक्षण बॉडी मैप", "Mapa del cuerpo")}</h3>
                <p className="text-slate-500 text-sm">{t("Identify specific areas of concern", "चिंता के विशिष्ट क्षेत्रों की पहचान करें", "Identificar áreas específicas")}</p>
             </div>
          </div>
          
          <div 
            onClick={() => setIsHelpOpen(true)}
            className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl group cursor-pointer relative overflow-hidden"
          >
             <div className="relative z-10">
                <h3 className="text-xl font-black mb-1">{t("24/7 AI Health Chat", "24/7 एआई स्वास्थ्य चैट", "Chat de salud AI 24/7")}</h3>
                <p className="text-indigo-100 text-sm opacity-80">{t("Instant answers to your health questions", "आपके स्वास्थ्य प्रश्नों के त्वरित उत्तर", "Respuestas instantáneas")}</p>
             </div>
             <Bot className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 group-hover:scale-110 transition-transform" />
          </div>
      </div>

      {currentAppt && currentAppt.status === 'scheduled' && (
        <div className="bg-teal-600 text-white p-6 rounded-[2.5rem] shadow-lg flex items-center justify-between">
           <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="font-black text-lg">{currentAppt.doctor}</p>
                <p className="text-xs opacity-80">{currentAppt.date} at {currentAppt.time}</p>
              </div>
           </div>
           <Button variant="outline" className="!bg-white/10 !border-white/20 !text-white" size="sm" onClick={() => setActiveTab('appointments')}>{t("Manage", "प्रबंधित करें", "Gestionar")}</Button>
        </div>
      )}
    </div>
  );

  const renderCalendar = () => {
    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
    
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    
    const totalDays = daysInMonth(month, year);
    const startDay = firstDayOfMonth(month, year);
    
    const days = [];
    // Padding for empty days at start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }
    
    for (let d = 1; d <= totalDays; d++) {
      const isToday = today.getDate() === d;
      const date = new Date(year, month, d);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month;
      
      days.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => setSelectedDate(date)}
          className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all
            ${isPast ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-indigo-50 text-slate-700'}
            ${isSelected ? 'bg-indigo-600 text-white shadow-lg scale-110 z-10' : ''}
            ${isToday && !isSelected ? 'border border-indigo-200 text-indigo-600' : ''}
          `}
        >
          {d}
        </button>
      );
    }

    const monthName = today.toLocaleString('default', { month: 'long' });

    return (
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm w-full">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-black text-slate-800">{monthName} {year}</h4>
          <div className="flex gap-2">
            <button className="p-2 text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-2 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-[10px] font-black text-slate-400 uppercase">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (step === AppStep.PROFILE_SELECT) return (
      <div className="flex flex-col items-center py-20 text-center animate-fade-in">
        <HeartPulse className="w-16 h-16 text-teal-600 mb-6 animate-pulse" />
        <h2 className="text-4xl font-black text-slate-800 mb-2">HealthEase</h2>
        <p className="text-slate-500 mb-12 max-w-xs">Connecting you to better health with AI guidance.</p>
        <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
          {[{n:'Myself', c:'bg-teal-500'}, {n:'Family', c:'bg-orange-500'}, {n:'Child', c:'bg-green-500'}, {n:'Guest', c:'bg-blue-500'}].map(p => (
            <button key={p.n} onClick={() => handleProfileSelect(p.n, p.c)} className="flex flex-col items-center group">
              <div className={`w-24 h-24 rounded-[2rem] ${p.c} flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform active:scale-95`}><User className="text-white w-10 h-10" /></div>
              <span className="mt-4 font-black text-slate-700 uppercase text-xs tracking-widest">{p.n}</span>
            </button>
          ))}
        </div>
      </div>
    );

    if (step === AppStep.LANGUAGE_SELECT) return (
      <div className="flex flex-col items-center py-20 text-center animate-fade-in">
        <Globe className="w-16 h-16 text-indigo-600 mb-6" />
        <h2 className="text-3xl font-black text-slate-800 mb-2">Select Language</h2>
        <p className="text-slate-500 mb-12">Choose your preferred language for triage and support.</p>
        <div className="flex flex-col space-y-4 w-full max-w-xs">
          {Object.values(Language).map(lang => (
            <button 
              key={lang} 
              onClick={() => handleLanguageSelect(lang)}
              className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    );

    if (step === AppStep.INPUT_METHOD_SELECT) return (
      <div className="flex flex-col space-y-4 animate-fade-in text-center max-w-md mx-auto pt-10">
        <h2 className="text-3xl font-black text-slate-800 mb-2">{t("Describe your health issue", "अपने स्वास्थ्य के बारे में बताएं", "¿Cómo te gustaría compartir?")}</h2>
        <p className="text-slate-500 mb-6">{t("Choose the method you prefer", "अपनी पसंद का तरीका चुनें", "Elige el método que prefieras")}</p>
        
        <button onClick={() => setStep(AppStep.BODY_MAP)} className="p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] flex items-center hover:border-teal-500 transition-all shadow-sm group">
          <div className="bg-teal-50 p-4 rounded-2xl group-hover:scale-110 transition-transform"><User className="w-8 h-8 text-teal-600" /></div>
          <span className="text-lg font-black text-slate-700 ml-6">{t("Body Map Selection", "बॉडी मैप चयन", "Mapa del cuerpo")}</span>
        </button>

        <button onClick={() => setStep(AppStep.VOICE_INPUT)} className="p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] flex items-center hover:border-orange-500 transition-all shadow-sm group">
          <div className="bg-orange-50 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Mic className="w-8 h-8 text-orange-600" /></div>
          <span className="text-lg font-black text-slate-700 ml-6">{t("Voice Assistant", "आवाज़ सहायक", "Asistente de voz")}</span>
        </button>
        
        <button onClick={() => setStep(AppStep.CHAT_INPUT)} className="p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] flex items-center hover:border-indigo-600 transition-all shadow-sm group">
          <div className="bg-indigo-50 p-4 rounded-2xl group-hover:scale-110 transition-transform"><MessageSquare className="w-8 h-8 text-indigo-600" /></div>
          <span className="text-lg font-black text-slate-700 ml-6">{t("Direct Chat Entry", "सीधा चैट", "Entrada de chat directo")}</span>
        </button>

        <Button variant="outline" className="mt-6 !bg-transparent text-slate-400 border-none" onClick={() => setStep(AppStep.DASHBOARD_VIEW)}>{t("Go Back", "वापस जाएं", "Volver")}</Button>
      </div>
    );

    if (step === AppStep.VOICE_INPUT) return (
      <div className="flex flex-col space-y-8 animate-fade-in text-center max-w-md mx-auto pt-10">
         <h2 className="text-3xl font-black text-slate-800">{t("Speak your symptoms", "अपने लक्षण बोलें", "Habla tus síntomas")}</h2>
         <div className="relative flex justify-center py-10">
            <div className={`absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20 scale-150 ${isListening ? '' : 'hidden'}`}></div>
            <button 
              onClick={() => toggleListening(setSymptomDetailInput)}
              className={`relative z-10 p-12 rounded-full shadow-2xl transition-all active:scale-90 ${isListening ? 'bg-red-500' : 'bg-indigo-600'}`}
            >
              <Mic className="w-16 h-16 text-white" />
            </button>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 min-h-[150px] shadow-inner text-left overflow-y-auto max-h-[250px]">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-3 tracking-widest">{t("Live Transcript", "लाइव ट्रांसक्रिप्ट", "Transcripción en vivo")}</p>
            <p className="text-lg font-bold text-slate-700 leading-relaxed italic">
               {symptomDetailInput || t("Listening for your voice...", "आपकी आवाज़ सुन रहा हूँ...", "Escuchando tu voz...")}
            </p>
         </div>
         <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => { setSymptomDetailInput(''); setStep(AppStep.INPUT_METHOD_SELECT); }}>{t("Reset", "रीसेट", "Reiniciar")}</Button>
            <Button className="flex-[2] shadow-xl" disabled={!symptomDetailInput.trim()} onClick={() => processTriage(symptomDetailInput)}>{t("Analyze Symptoms", "विश्लेषण करें", "Analizar")}</Button>
         </div>
      </div>
    );

    if (step === AppStep.CHAT_INPUT) return (
      <div className="flex flex-col space-y-6 animate-fade-in max-w-md mx-auto pt-10">
        <h2 className="text-3xl font-black text-center text-slate-800">{t("Symptom Details", "लक्षण विवरण", "Detalles de síntomas")}</h2>
        <p className="text-slate-500 text-center mb-4">{t("Type out what you are feeling as clearly as you can.", "आप जो महसूस कर रहे हैं उसे स्पष्ट रूप से लिखें।", "Escribe lo que sientes lo más claro posible.")}</p>
        <textarea 
          className="w-full h-56 p-8 border-2 border-slate-100 rounded-[3rem] text-lg focus:outline-none focus:border-indigo-600 shadow-inner bg-white" 
          placeholder={t("e.g. I have a sharp pain in my stomach for 2 days...", "जैसे मुझे 2 दिनों से पेट में तेज़ दर्द है...", "ej. Tengo un dolor agudo...")} 
          value={symptomDetailInput} 
          onChange={(e) => setSymptomDetailInput(e.target.value)} 
          autoFocus 
        />
        <Button size="lg" className="w-full shadow-2xl" disabled={!symptomDetailInput.trim()} onClick={() => processTriage(symptomDetailInput)}>{t("Analyze Symptoms", "विश्लेषण करें", "Analizar")}</Button>
        <Button variant="outline" className="border-none" onClick={() => setStep(AppStep.INPUT_METHOD_SELECT)}>{t("Back", "पीछे", "Atrás")}</Button>
      </div>
    );

    if (step === AppStep.FOLLOW_UP_INPUT && triageResult) return (
      <div className="max-w-md mx-auto space-y-8 animate-fade-in pt-10">
        <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl">
           <div className="flex items-center space-x-2 mb-4 opacity-80">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">{t("Follow-up Question", "फॉलो-अप प्रश्न", "Pregunta de seguimiento")}</span>
           </div>
           <h2 className="text-2xl font-black leading-tight">{triageResult.followUpQuestion}</h2>
        </div>
        
        <div className="space-y-4">
          <textarea 
            className="w-full h-40 p-8 border-2 border-slate-100 rounded-[3rem] text-lg focus:outline-none focus:border-indigo-600 shadow-inner bg-white" 
            placeholder={t("Your answer...", "आपका उत्तर...", "Tu respuesta...")} 
            value={followUpAnswer} 
            onChange={(e) => setFollowUpAnswer(e.target.value)} 
            autoFocus 
          />
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
             <span className="text-xs font-black text-slate-400 uppercase ml-4">{t("Voice Reply", "आवाज़ में उत्तर", "Respuesta de voz")}</span>
             <button onClick={() => toggleListening(setFollowUpAnswer)} className={`p-4 rounded-2xl shadow-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}>
                <Mic className="w-6 h-6" />
             </button>
          </div>
        </div>

        <Button size="lg" className="w-full shadow-2xl" disabled={!followUpAnswer.trim()} onClick={() => processTriage(followUpAnswer, true)}>
          {t("Finish Assessment", "मूल्यांकन समाप्त करें", "Finalizar evaluación")}
        </Button>
      </div>
    );

    if (step === AppStep.RESULTS) {
       if (!triageResult) return null;
       return (
         <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-fade-in pt-6">
           <header className="flex items-center space-x-4">
              <button onClick={() => setStep(AppStep.DASHBOARD_VIEW)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><ChevronLeft className="w-6 h-6 text-slate-600" /></button>
              <h2 className="text-2xl font-black text-slate-800">{t("Diagnosis Results", "निदान परिणाम", "Resultados del diagnóstico")}</h2>
           </header>
   
           <div className={`p-8 rounded-[3rem] border-l-[16px] bg-white shadow-xl relative overflow-hidden ${
             triageResult.urgency === 'High' ? 'border-red-500' : 
             triageResult.urgency === 'Medium' ? 'border-yellow-500' : 
             'border-teal-500'
           }`}>
             <div className="flex items-center justify-between mb-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  triageResult.urgency === 'High' ? 'bg-red-100 text-red-700' : 
                  triageResult.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-teal-100 text-teal-700'
                }`}>
                  {triageResult.urgency} Urgency
                </span>
                <BadgeCheck className="w-6 h-6 text-teal-500" />
             </div>
             
             <h3 className="text-3xl font-black text-slate-800 mb-2">{triageResult.specialty}</h3>
             <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-6">
                <p className="text-slate-800 text-sm font-bold leading-relaxed">{triageResult.specialistReason}</p>
             </div>
             
             <p className="text-slate-500 text-lg leading-relaxed mb-8 italic">"{triageResult.summary}"</p>
             
             <div className="bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex items-center space-x-2 mb-4">
                      <ShieldCheck className="w-6 h-6" />
                      <h4 className="font-black text-xs uppercase tracking-widest">{t("Medical Advice", "चिकित्सा सलाह", "Consejo médico")}</h4>
                   </div>
                   <p className="font-bold leading-relaxed whitespace-pre-line">
                     {triageResult.careAdvice}
                   </p>
                </div>
                <Activity className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10" />
             </div>
           </div>
   
           <section className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 ml-4 flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-teal-600" />
                {t("Recommended Doctors", "अनुशंसित डॉक्टर", "Médicos recomendados")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {triageResult.recommendedDoctors.map(doc => (
                   <div key={doc.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-md hover:border-teal-400 transition-all group">
                      <h4 className="font-black text-xl text-slate-800 mb-1">{doc.name}</h4>
                      <p className="text-teal-600 font-bold text-sm mb-4">{doc.specialty}</p>
                      <div className="space-y-3 mb-8">
                         <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-slate-300 mt-1 shrink-0" />
                            <div>
                               <p className="text-sm font-black text-slate-700">{doc.hospitalName}</p>
                               <p className="text-[10px] text-slate-400 font-bold">{doc.address}</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                         <span className="font-black text-xl text-slate-800">{doc.consultationFee.includes('₹') ? doc.consultationFee : `₹${doc.consultationFee}`}</span>
                         <Button size="sm" onClick={() => handleBookClick(doc.id)}>{t("Book", "बुक करें", "Reservar")}</Button>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
         </div>
       );
    }

    if (activeTab === 'dashboard') {
        if (step === AppStep.DASHBOARD_VIEW) return renderDashboard();
        if (step === AppStep.BODY_MAP) return (
          <div className="animate-fade-in pt-6">
            <header className="flex items-center space-x-4 mb-8">
               <button onClick={() => setStep(AppStep.INPUT_METHOD_SELECT)} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
               <h2 className="font-black text-xl text-slate-800">{t("Select Body Area", "शरीर का क्षेत्र चुनें", "Seleccionar área")}</h2>
            </header>
            <BodyMap onSelectPart={setSelectedBodyPart} selectedPart={selectedBodyPart} language={language} />
            <Button className="w-full mt-10 shadow-xl" size="lg" onClick={() => setStep(AppStep.BODY_PART_DETAILS)} disabled={!selectedBodyPart}>{t("Continue", "जारी रखें", "Continuar")}</Button>
          </div>
        );
        if (step === AppStep.BODY_PART_DETAILS) return (
          <div className="flex flex-col space-y-6 animate-fade-in max-w-md mx-auto pt-10">
            <h2 className="text-2xl font-black text-center text-slate-800">{t("Pain Location:", "दर्द का स्थान:", "Ubicación del dolor:")} <span className="text-teal-600 uppercase">{selectedBodyPart}</span></h2>
            <textarea 
              className="w-full h-48 p-8 border-2 border-slate-100 rounded-[3rem] text-lg focus:outline-none focus:border-teal-500 shadow-inner bg-white" 
              placeholder={t("Describe the pain...", "दर्द का वर्णन करें...", "Describe el dolor...")} 
              value={symptomDetailInput} 
              onChange={(e) => setSymptomDetailInput(e.target.value)} 
              autoFocus 
            />
            <Button size="lg" className="w-full shadow-2xl" disabled={!symptomDetailInput.trim()} onClick={() => processTriage(`Location: ${selectedBodyPart}. Symptoms: ${symptomDetailInput}`)}>{t("Analyze Now", "अभी विश्लेषण करें", "Analizar ahora")}</Button>
          </div>
        );
        if (step === AppStep.TRIAGE_LOADING) return (
          <div className="text-center py-32 space-y-8">
            <div className="relative inline-block">
               <Activity className="w-20 h-20 text-teal-600 animate-bounce mx-auto" />
               <div className="absolute inset-0 border-4 border-teal-100 rounded-full animate-ping opacity-20"></div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 animate-pulse">{t("Expert AI is Analyzing...", "विशेषज्ञ एआई विश्लेषण कर रहा है...", "IA experta analizando...")}</h2>
          </div>
        );
        if (step === AppStep.BOOKING_SLOT_SELECTION) return (
          <div className="max-w-md mx-auto space-y-8 animate-fade-in pt-10 pb-20">
             <header className="flex items-center space-x-4">
                <button onClick={() => setStep(activeTab === 'appointments' ? AppStep.DASHBOARD_VIEW : AppStep.RESULTS)} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
                <h2 className="font-black text-2xl text-slate-800">{t("Schedule Appointment", "अपॉइंटमेंट शेड्यूल करें", "Programar cita")}</h2>
             </header>

             <div className="space-y-6">
                <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                   <CalendarIcon className="w-5 h-5" />
                   <span className="font-black text-xs uppercase tracking-widest">{t("Select Available Date", "उपलब्ध तिथि चुनें", "Elegir fecha")}</span>
                </div>
                {renderCalendar()}

                <div className="flex items-center space-x-2 text-indigo-600 mt-8 mb-2">
                   <Clock className="w-5 h-5" />
                   <span className="font-black text-xs uppercase tracking-widest">{t("Select Time Slot", "समय स्लॉट चुनें", "Elegir hora")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'].map(slot => (
                    <button 
                      key={slot} 
                      onClick={() => setSelectedSlot(slot)} 
                      className={`p-5 rounded-[1.5rem] font-black border-2 transition-all ${selectedSlot === slot ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
             </div>

             <Button size="lg" className="w-full mt-10 shadow-2xl" disabled={!selectedSlot} onClick={() => {
               const dateStr = selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
               if (currentAppt && activeTab === 'appointments') {
                  setCurrentAppt({
                    ...currentAppt,
                    time: selectedSlot || currentAppt.time,
                    date: dateStr,
                    status: 'scheduled'
                  });
               } else if (triageResult) {
                  const chosenDoc = triageResult.recommendedDoctors.find(d => d.id === selectedDoctor);
                  setCurrentAppt({
                    id: `appt-${Date.now()}`,
                    doctor: chosenDoc?.name || 'Doctor',
                    specialty: triageResult.specialty,
                    date: dateStr,
                    time: selectedSlot || 'TBD',
                    status: 'scheduled',
                    careAdvice: triageResult.careAdvice,
                    hospitalName: chosenDoc?.hospitalName,
                    address: chosenDoc?.address
                  });
               }
               setStep(AppStep.BOOKING_CONFIRMED);
             }}>{t("Finalize Booking", "बुकिंग पूरी करें", "Finalizar reserva")}</Button>
          </div>
        );
        if (step === AppStep.BOOKING_CONFIRMED) return (
          <div className="text-center py-20 animate-fade-in space-y-8">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-4xl font-black text-slate-800">{t("Confirmed!", "पुष्टि की गई!", "¡Confirmado!")}</h2>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm max-w-xs mx-auto text-left">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Appointment Info</p>
               <p className="font-black text-slate-800">{currentAppt?.doctor}</p>
               <p className="text-sm font-bold text-teal-600 mb-4">{currentAppt?.date} @ {currentAppt?.time}</p>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location</p>
               <p className="font-black text-slate-800 text-xs">{currentAppt?.hospitalName}</p>
            </div>
            <Button size="lg" className="w-full max-w-xs shadow-xl" onClick={() => { setStep(AppStep.DASHBOARD_VIEW); setActiveTab('dashboard'); }}>{t("Done", "हो गया", "Listo")}</Button>
          </div>
        );
    }

    if (activeTab === 'appointments') {
      if (step === AppStep.BOOKING_SLOT_SELECTION) {
          // Re-using the booking selection view for rescheduling
          return (
            <div className="max-w-md mx-auto space-y-8 animate-fade-in pt-10 pb-20">
               <header className="flex items-center space-x-4">
                  <button onClick={() => setStep(AppStep.DASHBOARD_VIEW)} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
                  <h2 className="font-black text-2xl text-slate-800">{t("Reschedule Visit", "विजिट फिर से शेड्यूल करें", "Reprogramar visita")}</h2>
               </header>
               <div className="space-y-6">
                  {renderCalendar()}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'].map(slot => (
                      <button 
                        key={slot} 
                        onClick={() => setSelectedSlot(slot)} 
                        className={`p-5 rounded-[1.5rem] font-black border-2 transition-all ${selectedSlot === slot ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
               </div>
               <Button size="lg" className="w-full mt-10 shadow-2xl" disabled={!selectedSlot} onClick={() => {
                 const dateStr = selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
                 if (currentAppt) {
                   setCurrentAppt({
                     ...currentAppt,
                     date: dateStr,
                     time: selectedSlot || currentAppt.time
                   });
                 }
                 setStep(AppStep.BOOKING_CONFIRMED);
               }}>{t("Update Booking", "बुकिंग अपडेट करें", "Actualizar reserva")}</Button>
            </div>
          );
      }

      return (
        <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in">
           <div className="flex justify-between items-center">
             <h2 className="text-3xl font-black text-slate-800">{t("Your Visits", "आपकी विजिट", "Tus visitas")}</h2>
             <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{currentAppt ? '1 Active' : '0 Active'}</span>
           </div>
           
           {currentAppt ? (
             <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden transition-all hover:shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <span className="bg-teal-100 text-teal-700 px-4 py-1 rounded-full text-[10px] font-black uppercase mb-3 inline-block tracking-widest">Upcoming</span>
                      <h3 className="text-2xl font-black text-slate-800">{currentAppt.doctor}</h3>
                      <p className="text-slate-500 font-bold">{currentAppt.specialty}</p>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{currentAppt.date}</p>
                      <p className="text-2xl font-black text-teal-600">{currentAppt.time}</p>
                   </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 flex items-start space-x-4 mb-6">
                   <MapPin className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                   <div>
                      <p className="font-black text-slate-800">{currentAppt.hospitalName}</p>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{currentAppt.address}</p>
                   </div>
                </div>

                <div className="bg-teal-50 p-6 rounded-[2.5rem] border border-dashed border-teal-200 mb-8">
                   <div className="flex items-center space-x-2 mb-3">
                      <Info className="w-5 h-5 text-teal-600" />
                      <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Self Care Instructions</p>
                   </div>
                   <p className="text-teal-900 font-bold text-sm leading-relaxed">{currentAppt.careAdvice}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <Button variant="outline" icon={<Undo2 />} onClick={handleReschedule}>{t("Reschedule", "समय बदलें", "Reprogramar")}</Button>
                   <Button variant="danger" icon={<XCircle />} onClick={() => setShowCancelModal(true)}>{t("Cancel Visit", "विजिट रद्द करें", "Cancelar visita")}</Button>
                </div>

                {showCancelModal && (
                  <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}></div>
                    <div className="relative bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl animate-scale-in">
                      <h3 className="text-2xl font-black text-slate-800 mb-2">{t("Cancel Visit?", "विजिट रद्द करें?", "¿Cancelar visita?")}</h3>
                      <p className="text-slate-500 mb-6 text-sm">{t("Please share the reason for cancelling this appointment.", "कृपया इस अपॉइंटमेंट को रद्द करने का कारण साझा करें।", "Comparta el motivo de la cancelación.")}</p>
                      <textarea 
                        className="w-full h-32 p-4 border-2 border-slate-100 rounded-2xl mb-6 focus:outline-none focus:border-red-500"
                        placeholder={t("e.g., Improved health, personal reasons...", "जैसे, बेहतर स्वास्थ्य, व्यक्तिगत कारण...", "ej. Salud mejorada...")}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <Button variant="danger" size="sm" className="flex-1" onClick={handleCancelAppt}>{t("Cancel Now", "अभी रद्द करें", "Cancelar ahora")}</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCancelModal(false)}>{t("Keep Visit", "विजिट रखें", "Mantener")}</Button>
                      </div>
                    </div>
                  </div>
                )}
             </div>
           ) : (
             <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <CalendarIcon className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-bold text-lg">No active medical visits.</p>
                <Button variant="outline" className="mt-6 border-none text-teal-600" size="sm" onClick={() => setActiveTab('dashboard')}>{t("Book a checkup", "चेकअप बुक करें", "Reservar")}</Button>
             </div>
           )}
        </div>
      );
    }

    if (activeTab === 'history') {
      if (selectedHistoryItem) {
        return (
          <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in">
             <header className="flex items-center space-x-4">
                <button onClick={() => setSelectedHistoryItem(null)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><ChevronLeft className="w-6 h-6 text-slate-600" /></button>
                <h2 className="text-2xl font-black text-slate-800">{t("Record Details", "रिकॉर्ड विवरण", "Detalles del registro")}</h2>
             </header>

             <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-100 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="space-y-2">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        selectedHistoryItem.urgency === 'High' ? 'bg-red-100 text-red-600' : 
                        selectedHistoryItem.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-teal-100 text-teal-700'
                      }`}>
                        {selectedHistoryItem.urgency} Priority
                      </span>
                      <h3 className="text-3xl font-black text-slate-800">{selectedHistoryItem.specialty}</h3>
                      <p className="text-slate-400 font-bold flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2" /> {selectedHistoryItem.date}
                      </p>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-[2.5rem] text-center border border-slate-100">
                      <Stethoscope className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase">Consultant</p>
                      <p className="font-black text-slate-800 text-sm">{selectedHistoryItem.doctor}</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <section className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                      <div className="flex items-center space-x-2 mb-3 text-slate-400">
                         <MessageSquare className="w-4 h-4" />
                         <p className="text-[10px] font-black uppercase tracking-widest">Initial Symptoms</p>
                      </div>
                      <p className="text-slate-700 font-bold leading-relaxed italic">"{selectedHistoryItem.symptoms}"</p>
                   </section>

                   <section className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-100">
                      <div className="flex items-center space-x-2 mb-4">
                         <ShieldCheck className="w-6 h-6" />
                         <p className="text-xs font-black uppercase tracking-widest">Final Diagnosis</p>
                      </div>
                      <p className="text-2xl font-black leading-tight">{selectedHistoryItem.diagnosis}</p>
                   </section>

                   <section className="bg-teal-50 p-6 rounded-[2.5rem] border border-teal-100">
                      <div className="flex items-center space-x-2 mb-4 text-teal-700">
                         <ClipboardList className="w-5 h-5" />
                         <p className="text-xs font-black uppercase tracking-widest">Medical Advice</p>
                      </div>
                      <p className="text-teal-900 font-bold leading-relaxed">{selectedHistoryItem.careAdvice}</p>
                   </section>
                </div>
                
                <Button className="w-full" variant="outline" icon={<FileText />}>Download Full PDF Report</Button>
             </div>
          </div>
        );
      }

      return (
        <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in">
           <div className="flex justify-between items-center px-2">
             <h2 className="text-3xl font-black text-slate-800">{t("Health Vault", "स्वास्थ्य तिजोरी", "Bóveda de salud")}</h2>
             <div className="flex space-x-2">
               <button className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><Search className="w-5 h-5 text-slate-400" /></button>
             </div>
           </div>

           <div className="space-y-4">
              {historyItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedHistoryItem(item)}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-teal-400 transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-100"
                >
                   <div className="flex items-center space-x-6">
                      <div className={`p-5 rounded-3xl ${item.urgency === 'High' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                         <FileText className="w-8 h-8" />
                      </div>
                      <div>
                         <h4 className="font-black text-xl text-slate-800 group-hover:text-teal-600 transition-colors">{item.specialty} Report</h4>
                         <p className="text-sm text-slate-400 font-bold flex items-center mt-1">
                           <Clock className="w-3.5 h-3.5 mr-1.5" /> {item.date} • {item.doctor}
                         </p>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-full text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                      <ChevronRight className="w-6 h-6" />
                   </div>
                </div>
              ))}
           </div>

           <div className="bg-indigo-600 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden mt-10">
              <div className="relative z-10">
                 <h4 className="text-2xl font-black mb-2">Vault Protection</h4>
                 <p className="text-indigo-100 font-bold leading-relaxed mb-8 opacity-80">All medical records are encrypted and only accessible by you. Share them securely with doctors in one tap.</p>
                 <Button variant="outline" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" icon={<ShieldCheck />}>Privacy Settings</Button>
              </div>
              <ShieldCheck className="absolute -bottom-10 -right-10 w-64 h-64 text-indigo-500 opacity-20" />
           </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans max-w-lg mx-auto shadow-2xl overflow-hidden flex flex-col relative">
      <header className="bg-white p-6 sticky top-0 z-50 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setStep(AppStep.DASHBOARD_VIEW); setSelectedHistoryItem(null); }}>
          <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg"><HeartPulse className="w-6 h-6 text-white" /></div>
          <span className="text-2xl font-black text-slate-800 tracking-tighter">HealthEase</span>
        </div>
        {selectedProfile && (
           <div className={`w-10 h-10 rounded-full ${selectedProfile.color} border-2 border-white shadow-md flex items-center justify-center text-white text-sm font-black`}>
              {selectedProfile.name[0]}
           </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-28">{renderContent()}</main>

      {step !== AppStep.PROFILE_SELECT && step !== AppStep.LANGUAGE_SELECT && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-100 px-10 py-5 flex justify-between items-center z-50 rounded-t-[3rem] shadow-2xl">
          <TabButton active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setStep(AppStep.DASHBOARD_VIEW); setSelectedHistoryItem(null); }} icon={<Home />} label="Home" />
          <TabButton active={activeTab === 'appointments'} onClick={() => { setActiveTab('appointments'); setStep(AppStep.DASHBOARD_VIEW); setSelectedHistoryItem(null); }} icon={<CalendarIcon />} label="Visits" />
          <TabButton active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setStep(AppStep.DASHBOARD_VIEW); setSelectedHistoryItem(null); }} icon={<FileText />} label="Vault" />
        </nav>
      )}

      {/* Floating Assistant Button */}
      {step !== AppStep.PROFILE_SELECT && step !== AppStep.LANGUAGE_SELECT && !isHelpOpen && (
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="fixed bottom-28 right-8 z-[60] bg-indigo-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce"
        >
          <Bot className="w-8 h-8" />
        </button>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 z-[110] animate-fade-in">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsHelpOpen(false)}></div>
           <div className="absolute bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up max-w-lg mx-auto">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                 <div className="flex items-center space-x-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Bot className="w-8 h-8" /></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800">HealthEase AI</h3>
                       <div className="flex items-center text-[10px] font-black text-green-500 uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                          Online
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setIsHelpOpen(false)} className="p-3 bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                 {helpChat.length === 0 && (
                   <div className="text-center py-10 space-y-4">
                      <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100"><MessageSquare className="w-8 h-8 text-indigo-600" /></div>
                      <h4 className="text-2xl font-black text-slate-800">AI Assistant</h4>
                      <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm">Ask any medical question or help with clinic bookings.</p>
                   </div>
                 )}
                 {helpChat.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                         <p className="text-md font-bold leading-relaxed">{msg.text}</p>
                      </div>
                   </div>
                 ))}
                 {isHelpLoading && <Activity className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />}
                 <div ref={helpChatEndRef} />
              </div>
              <form onSubmit={handleHelpSubmit} className="p-8 bg-white border-t border-slate-100 flex space-x-3">
                 <input className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-indigo-600 transition-colors" placeholder="Message assistant..." value={helpInput} onChange={e => setHelpInput(e.target.value)} />
                 <button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl active:scale-95"><Send /></button>
              </form>
           </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`flex flex-col items-center group transition-all ${active ? 'text-teal-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
    <div className="relative">
       {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
       {active && <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></div>}
    </div>
    <span className="text-[10px] font-black uppercase mt-1.5 tracking-widest">{label}</span>
  </button>
);
