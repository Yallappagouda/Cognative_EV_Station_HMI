import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Clock, ShieldCheck, Wifi, Smartphone, ArrowRight, 
  CheckCircle2, Circle, AlertTriangle, RotateCcw, Phone, 
  Battery, History, X, Lock, Unlock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { triggerHaptic, speak, beep } from './utils';

// reference to avoid unused-import linter in some environments
const _motionRef = motion;

// --- UI COMPONENTS ---

const Card = ({ children, className, onClick, active }) => (
  <div 
    onClick={onClick}
    className={`
      relative p-6 rounded-2xl border transition-all duration-300 backdrop-blur-sm
      ${active 
        ? 'bg-volt-navy/80 border-volt-cyan shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
        : 'bg-volt-navy/40 border-white/5 hover:bg-volt-navy/60 hover:border-white/10'}
      ${className}
    `}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className, icon: Icon, disabled = false }) => {
  const variants = {
    primary: "bg-gradient-to-r from-volt-cyan to-volt-green text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]",
    danger: "bg-gradient-to-r from-red-800 to-red-600 text-white border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    secondary: "bg-volt-navy border border-white/20 text-white hover:bg-white/10",
    ghost: "bg-transparent text-volt-cyan hover:text-white"
  };

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : {}}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  );
};

// --- SCREENS ---

const Header = () => (
  <div className="flex justify-between items-center p-6 absolute top-0 w-full z-10">
    <div className="flex items-center gap-2">
      <Zap className="text-volt-cyan fill-volt-cyan" />
      <span className="font-sans font-bold text-xl tracking-widest">VOLTCHARGE</span>
    </div>
    <div className="flex gap-4 text-xs font-mono text-slate-400 bg-volt-navy/80 px-4 py-2 rounded-full border border-white/5">
      <span className="flex items-center gap-2"><Wifi size={12} className="text-volt-green" /> 5G Connected</span>
      <span>|</span>
      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  </div>
);

// 1. HOME
const HomeScreen = ({ onNext, onHistory, onErrorConnector, onErrorNetwork, onErrorOverheat, onErrorPayment }) => {
  useEffect(() => { speak("Welcome to Volt Charge. Tap Start Charging to begin."); }, []);

  return (
    <div className="flex flex-col h-full justify-center px-4 relative">
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-bold mb-2 font-sans text-glow"
        >
          Welcome to EV Charging
        </motion.h1>
        <p className="text-slate-400">Fast, Safe, and Sustainable</p>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex justify-center mb-16"
      >
        <Button onClick={onNext} className="w-px-100 h-24 text-xl rounded-2xl">
          Start Charging
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full mb-12">
        {[
          { icon: Zap, label: "150kW", sub: "Fast Charge" },
          { icon: Clock, label: "24/7", sub: "Available" },
          { icon: ShieldCheck, label: "CCS2", sub: "Connector" }
        ].map((item, idx) => (
          <Card key={idx} className="flex flex-col items-center justify-center py-8">
            <item.icon size={32} className="text-volt-cyan mb-2" />
            <span className="text-2xl font-bold font-sans">{item.label}</span>
            <span className="text-xs text-slate-500 uppercase tracking-widest">{item.sub}</span>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <Button onClick={onHistory} variant="secondary" icon={History}>
          View History
        </Button>
      </div>

      {/* TEST ERROR BUTTONS */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-xs text-slate-500 mb-2 text-center uppercase tracking-widest">Test Error Screens</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={onErrorConnector} variant="danger" className="text-xs py-2">⚠️ Connector Error</Button>
          <Button onClick={onErrorNetwork} variant="warning" className="text-xs py-2">🌐 Network Error</Button>
          <Button onClick={onErrorOverheat} variant="warning" className="text-xs py-2">🔥 Overheat Error</Button>
          <Button onClick={onErrorPayment} variant="danger" className="text-xs py-2">💳 Payment Error</Button>
        </div>
      </div>
    </div>
  );
};

// 1.5. CHARGING MODE SELECTION
const ChargingModeScreen = ({ onFastCharge, onNormalCharge }) => {
  const handleFastCharge = () => {
    triggerHaptic(50);
    speak("Fast charging selected.");
    onFastCharge();
  };

  const handleNormalCharge = () => {
    triggerHaptic(50);
    speak("Normal charging selected.");
    onNormalCharge();
  };

  useEffect(() => { 
    speak("Select your charging mode. Fast charge for quick charging or normal charge for balanced speed and battery health."); 
  }, []);

  return (
    <div className="flex flex-col h-full justify-center px-4 max-w-5xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold font-sans mb-2 text-glow">Select Charging Mode</h2>
        <p className="text-slate-400">Choose your preferred charging speed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* FAST CHARGE CARD */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFastCharge}
          className="relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm bg-volt-navy/40 hover:bg-volt-navy/60 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/10"></div>
          
          <div className="mb-6 text-6xl">⚡</div>
          <h3 className="text-3xl font-bold mb-2 text-cyan-400">Fast Charge</h3>
          <p className="text-slate-400 mb-6 text-lg">High-speed charging</p>
          
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">⚡</span>
              <span>0-80% in ~25 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">⚡</span>
              <span>150 kW max power</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">⚡</span>
              <span>Ideal for quick trips</span>
            </div>
          </div>
        </motion.div>

        {/* NORMAL CHARGE CARD */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNormalCharge}
          className="relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm bg-volt-navy/40 hover:bg-volt-navy/60 border-green-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)]">
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-green-500 bg-green-500/10"></div>
          
          <div className="mb-6 text-6xl">🔋</div>
          <h3 className="text-3xl font-bold mb-2 text-green-500">Normal Charge</h3>
          <p className="text-slate-400 mb-6 text-lg">Balanced charging mode</p>
          
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Optimized for battery health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>50 kW balanced power</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Extended battery lifespan</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// 2. AUTHENTICATION
const AuthScreen = ({ onNext }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => { 
    beep(500); // Long beep on authentication screen
    speak("Please tap your card or enter your phone number."); 
  }, []);

  const validatePhone = (value) => {
    if (!value || value.trim() === '') return false;
    if (!/^\d{10}$/.test(value)) return false;
    return true;
  };

  const handleAuth = () => {
    if (!validatePhone(phone)) {
      setError('Invalid phone number. Enter a valid 10-digit number.');
      setShake(true);
      speak('Invalid phone number.');
      triggerHaptic([100, 50, 100]);
      // stop shake after animation
      setTimeout(() => setShake(false), 700);
      return;
    }

    // success
    setError('');
    speak('Authentication successful.');
    triggerHaptic(50);
    onNext();
  };

  return (
    <div className="flex flex-col h-full justify-center px-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-4xl font-bold font-sans mb-2 text-glow">Authentication</h2>
        <p className="text-slate-400">Please identify yourself to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch h-[400px]">
        {/* Card 1: NFC */}
        <Card onClick={() => { triggerHaptic(50); onNext(); }} className="cursor-pointer group flex flex-col items-center justify-center hover:border-volt-cyan">
          <div className="w-32 h-32 rounded-full bg-volt-dark border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Wifi size={48} className="text-volt-cyan" />
          </div>
          <h3 className="text-xl font-bold mb-2">NFC / RFID Card</h3>
          <p className="text-slate-500 text-sm">Tap your card on the reader</p>
        </Card>

        {/* OR Divider */}
        <div className="hidden md:flex flex-col items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="h-16 w-[1px] bg-slate-700 mb-2"></div>
          <span className="bg-volt-dark px-2 text-slate-500 font-mono text-xs">OR</span>
          <div className="h-16 w-[1px] bg-slate-700 mt-2"></div>
        </div>

        {/* Card 2: Phone */}
        <Card className="flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-volt-green/10 rounded-lg">
              <Smartphone className="text-volt-green" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Mobile Number</h3>
              <p className="text-slate-500 text-xs">Enter digits to continue</p>
            </div>
          </div>
          <motion.div animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number" 
              className={`w-full bg-black/40 rounded-lg p-4 text-white mb-2 outline-none ${error ? 'border border-red-500' : 'border border-white/10 focus:border-volt-cyan'}`}
            />
          </motion.div>
          {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
          <Button onClick={handleAuth} variant="primary">CONTINUE</Button>
        </Card>
      </div>
    </div>
  );
};

// 3. CONNECT CABLE
const ConnectScreen = ({ onNext, onError }) => {
  useEffect(() => { speak("Insert the CCS cable firmly until you hear a click."); }, []);

  const handleConnect = () => {
    beep(500); // Long beep on button click
    // 20% chance of error for demo purposes
    if (Math.random() < 0.2) {
      onError();
    } else {
      triggerHaptic([50, 50]); // Double click feel
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-4xl mx-auto w-full relative">
      <div className="w-full mb-12 flex-shrink-0">
        <h2 className="text-3xl font-bold font-sans mb-2 text-glow">Connect Charging Cable</h2>
        <p className="text-slate-400">Preparing to charge</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4 mb-16 flex-shrink-0">
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="text-volt-green" size={32} />
          <span className="text-[10px] uppercase tracking-widest font-bold text-volt-green">Auth</span>
        </div>
        <div className="w-24 h-[2px] bg-slate-700"></div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-volt-cyan shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-white">Cable</span>
        </div>
        <div className="w-24 h-[2px] bg-slate-700"></div>
        <div className="flex flex-col items-center gap-2">
          <Circle className="text-slate-700" size={32} />
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-600">Charge</span>
        </div>
      </div>

      <div className="relative mb-12 flex-1 flex items-center justify-center">
        {/* CSS Placeholder for Cable Image - In real app use <img src="..." /> */}
        <div className="w-64 h-64 rounded-full bg-gradient-to-b from-slate-800 to-black flex items-center justify-center border border-white/5 shadow-2xl">
          <Zap size={80} className="text-white/20" />
        </div>
      </div>

      <div className="bg-volt-navy/50 p-6 rounded-xl border border-white/5 text-center mb-8 w-full max-w-md flex-shrink-0">
        <h4 className="font-bold mb-1">Step 1</h4>
        <p className="text-sm text-slate-400">Insert the <span className="text-volt-cyan font-bold">CCS cable</span> firmly until you hear a click</p>
      </div>

      <Button onClick={handleConnect} className="w-full max-w-md flex-shrink-0">CONNECT CABLE</Button>
    </div>
  );
};

// 4. CHARGING DASHBOARD
const ChargingScreen = ({ onComplete, onError, mode = 'normal' }) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [show80Modal, setShow80Modal] = useState(false);
  const [hapticTriggered, setHapticTriggered] = useState(false);
  const [hapticToasts, setHapticToasts] = useState([]);
  const [childLockEnabled, setChildLockEnabled] = useState(false);
  const [overVoltageWarning, setOverVoltageWarning] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  const intervalRef = useRef(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const spoke80Ref = useRef(false);
  const preBeepRef = useRef(false);
  const nearBeepRef = useRef(false);

  

  const addHapticToastCb = useCallback((pattern) => {
    const id = Date.now();
    setHapticToasts(prev => [...prev, { id, pattern }]);
    setTimeout(() => {
      setHapticToasts(prev => prev.filter(t => t.id !== id));
    }, 1200);
  }, []);

  const triggerHapticWithFeedback = useCallback((pattern) => {
    triggerHaptic(pattern);
    setHapticTriggered(true);
    addHapticToastCb(pattern);
    setTimeout(() => setHapticTriggered(false), 300);
  }, [addHapticToastCb]);

  // Speech recognition refs / state
  const recognitionRef = useRef(null);
  const [micActive, setMicActive] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');

  const handleVoiceCommand = (text) => {
    const cmd = text.toLowerCase();
    setVoiceMessage(`Heard: "${text}"`);
    if (cmd.includes('start charging')) {
      // start charging
      setIsPaused(false);
      pausedRef.current = false;
      speak('Charging started.');
      triggerHapticWithFeedback([60]);
    } else if (cmd.includes('stop charging')) {
      // stop charging
      completedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      speak('Charging stopped.');
      triggerHapticWithFeedback([120, 60, 120]);
      beep(400);
      setTimeout(() => onComplete(), 500);
    } else {
      speak('Command not recognized.');
    }
    // brief display
    setTimeout(() => setVoiceMessage(''), 3000);
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speak('Voice recognition not supported on this device.');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.onresult = (e) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join('');
        handleVoiceCommand(text);
      };
      recognitionRef.current.onerror = () => {
        speak('Voice recognition error.');
        setMicActive(false);
      };
      recognitionRef.current.onend = () => {
        setMicActive(false);
      };
    }
    try {
      recognitionRef.current.start();
      setMicActive(true);
      speak('Listening for voice commands.');
    } catch {
      // ignore start errors
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setMicActive(false);
  };

  const handleEmergencyStop = () => {
    if (childLockEnabled) {
      speak("Child lock enabled. Emergency stop disabled.");
      triggerHaptic(50);
      return;
    }
    setShowEmergencyConfirm(true);
  };

  const confirmEmergencyStop = () => {
    completedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    triggerHaptic([100, 50, 100, 50, 100]);
    speak("Charging stopped for safety.");
    beep(400);
    setShowEmergencyConfirm(false);
    setTimeout(() => onComplete(), 500);
  };

  const toggleChildLock = () => {
    const newState = !childLockEnabled;
    setChildLockEnabled(newState);
    triggerHaptic([80, 40, 80]);
    speak(newState ? "Child lock enabled." : "Child lock disabled.");
  };

  const _triggerOverVoltageWarning = () => {
    if (!overVoltageWarning) {
      setOverVoltageWarning(true);
      setIsPaused(true);
      pausedRef.current = true;
      triggerHaptic([150, 100, 150]);
      speak("Over voltage warning. Charging paused.");
      beep(600);
    }
  };

  const resetOverVoltageWarning = () => {
    setOverVoltageWarning(false);
    setIsPaused(false);
    pausedRef.current = false;
    speak("Voltage stabilized. Resuming charging.");
    triggerHaptic(50);
  };

  // keep pausedRef in sync with isPaused state
  useEffect(()=>{ pausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    // start charging
    speak("Charging has started.");
    beep(500);
    setTimeout(() => triggerHapticWithFeedback([100, 50, 100, 50, 100]), 0);

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (pausedRef.current) return prev;
        if (completedRef.current) return prev;

        const newProgress = +(prev + 0.2).toFixed(3);

        // Pre-completion beep (near 100%, 5% remaining)
        if (!preBeepRef.current && (100 - newProgress) <= 5 && newProgress < 100) {
          preBeepRef.current = true;
          // long, high-volume beep
          beep(1200);
          triggerHapticWithFeedback([120, 60]);
        }

        // Near-complete beep (very close to 100%)
        if (!nearBeepRef.current && newProgress >= 98 && newProgress < 100) {
          nearBeepRef.current = true;
          beep(1500);
          triggerHapticWithFeedback([150, 80]);
        }

        // completion
        if (newProgress >= 100) {
          completedRef.current = true;
          clearInterval(intervalRef.current);
          beep(2000);
          speak("Charging completed");
          triggerHapticWithFeedback([150, 50, 150]);
          setTimeout(() => onComplete(), 500);
          return 100;
        }

        // 80% Pause Logic - run once
        if (!spoke80Ref.current && prev < 80 && newProgress >= 80) {
          spoke80Ref.current = true;
          setIsPaused(true);
          pausedRef.current = true;
          setShow80Modal(true);
          triggerHapticWithFeedback([100, 50, 100]);
          speak("80 percent of charge completed.");
          return 80;
        }

        // Haptic trigger every 5%
        const nextFloor = Math.floor(newProgress);
        const prevFloor = Math.floor(prev);
        if (nextFloor !== prevFloor && nextFloor % 5 === 0) {
          triggerHapticWithFeedback(30);
        }

        return newProgress;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onComplete, onError, triggerHapticWithFeedback]);

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-4xl mx-auto w-full relative">
      
      {/* MODE INDICATOR - TOP */}
      <div className={`absolute top-24 left-0 right-0 mx-auto w-fit px-6 py-2 rounded-full border-2 font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
        mode === 'fast' 
          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
          : 'border-green-500 bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
      }`}>
        <Zap size={14} />
        {mode === 'fast' ? 'FAST CHARGE MODE' : 'NORMAL CHARGE MODE'}
      </div>

      {/* EMERGENCY STOP CONFIRMATION */}
      <AnimatePresence>
        {showEmergencyConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
          >
            <Card className="w-96 text-center border-red-600">
              <h2 className="text-2xl font-bold text-red-500 mb-4">⚠️ Emergency Stop</h2>
              <p className="text-slate-400 mb-6">Are you sure you want to stop charging immediately?</p>
              <div className="space-y-3">
                <Button onClick={confirmEmergencyStop} variant="danger">YES, STOP NOW</Button>
                <Button onClick={() => setShowEmergencyConfirm(false)} variant="secondary">CANCEL</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 80% Modal Overlay */}
      <AnimatePresence>
        {show80Modal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
          >
            <Card className="w-96 text-center border-volt-cyan">
              <h2 className="text-2xl font-bold mb-4">80% Limit Reached</h2>
              <p className="text-slate-400 mb-6">Charging slowed to protect battery health.</p>
              <div className="space-y-3">
                <Button onClick={() => { setShow80Modal(false); setIsPaused(false); }}>CONTINUE TO 100%</Button>
                <Button variant="danger" onClick={onComplete}>STOP NOW</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Ring */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-8">
        <svg className="w-full h-full -rotate-90">
          <circle cx="160" cy="160" r="140" stroke="#0f172a" strokeWidth="12" fill="none" />
          <circle 
            cx="160" cy="160" r="140" stroke="#22d3ee" strokeWidth="12" fill="none"
            strokeDasharray="880"
            strokeDashoffset={880 - (880 * progress) / 100}
            strokeLinecap="round"
            className="drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-300"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-6xl font-bold font-mono block">{Math.floor(progress)}<span className="text-2xl">%</span></span>
          <span className="text-volt-cyan uppercase tracking-widest text-xs animate-pulse">Charging</span>
        </div>
      </div>

      <div className="bg-volt-navy/50 px-4 py-2 rounded-full border border-white/5 mb-8 flex items-center gap-2">
        <motion.div 
          animate={hapticTriggered ? { scale: [1, 1.3, 0.9, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.6)] ${hapticTriggered ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-volt-cyan'}`}
        ></motion.div>
        <span className="text-xs text-slate-400">Haptic Feedback Active</span>
      </div>

      {/* Linear Bar */}
      <div className="w-full max-w-xl h-2 bg-slate-800 rounded-full mb-2 overflow-hidden">
        <div className="h-full bg-volt-cyan" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="w-full max-w-xl flex justify-between text-xs text-slate-500 mb-12">
        <span>Battery Level</span>
        <span>{Math.floor(progress)} / 100 kWh</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 w-full mb-8">
        <Card className="flex flex-col items-center py-4">
          <Clock size={20} className="text-volt-cyan mb-2" />
          <span className="text-xl font-bold font-mono">{Math.max(0, Math.floor((100 - progress) * 0.5))} min</span>
          <span className="text-[10px] text-slate-500 uppercase">Remaining</span>
        </Card>
        <Card className="flex flex-col items-center py-4">
          <Zap size={20} className="text-volt-green mb-2" />
          <span className="text-xl font-bold font-mono">{mode === 'fast' ? '150' : '50'} kW</span>
          <span className="text-[10px] text-slate-500 uppercase">Power</span>
        </Card>
        <Card className="flex flex-col items-center py-4">
          <span className="text-lg text-volt-cyan font-bold">$</span>
          <span className="text-xl font-bold font-mono">{(progress * 0.45).toFixed(2)}</span>
          <span className="text-[10px] text-slate-500 uppercase">Cost</span>
        </Card>
      </div>

      {/* SAFETY FEATURES PANEL */}
      <div className="w-full max-w-3xl bg-volt-navy/40 border border-white/5 rounded-2xl p-6 mb-8">
        <h3 className="text-sm uppercase tracking-widest font-bold mb-4 text-slate-300">Safety Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Over Voltage Warning Card */}
          <motion.div 
            className={`p-4 rounded-lg border-2 transition-all ${
              overVoltageWarning
                ? 'border-red-600 bg-red-950/30 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                : 'border-green-600 bg-green-950/20'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{overVoltageWarning ? '⚠️ Over Voltage' : '✓ Voltage Safe'}</span>
              <span className={`text-xs font-mono ${overVoltageWarning ? 'text-red-400' : 'text-green-400'}`}>
                {overVoltageWarning ? '420V' : '400V'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {overVoltageWarning ? 'Over voltage detected. Charging paused.' : 'Voltage within safe limits'}
            </p>
            {overVoltageWarning && (
              <Button onClick={resetOverVoltageWarning} variant="secondary" className="text-xs py-2">
                Reset
              </Button>
            )}
          </motion.div>

          {/* Child Lock Toggle */}
          <div className="p-4 rounded-lg border-2 border-white/10 bg-volt-navy/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Child Lock Mode</span>
                {childLockEnabled && <Lock size={16} className="text-yellow-500" />}
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {childLockEnabled ? 'Disabled: Stop & Mode buttons' : 'Safety lock for critical controls'}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleChildLock}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs uppercase transition-all ${
                childLockEnabled
                  ? 'bg-yellow-900/40 border border-yellow-600 text-yellow-400'
                  : 'bg-slate-700/40 border border-white/10 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {childLockEnabled ? '🔒 UNLOCK' : '🔓 LOCK'}
            </motion.button>
          </div>
        </div>

        {/* Emergency Stop Button */}
        <motion.button
          whileHover={!childLockEnabled ? { scale: 1.02 } : {}}
          whileTap={!childLockEnabled ? { scale: 0.98 } : {}}
          onClick={handleEmergencyStop}
          disabled={childLockEnabled}
          className={`w-full py-4 rounded-xl font-bold text-white uppercase tracking-wider transition-all ${
            childLockEnabled
              ? 'bg-slate-700/30 border-2 border-slate-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-red-800 to-red-600 border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]'
          }`}
        >
          🛑 Emergency Stop
        </motion.button>
      </div>

      <Button variant="danger" onClick={onComplete} className="w-full max-w-md" disabled={childLockEnabled}>
        STOP CHARGING
      </Button>

      {/* Haptic Toast Notifications + Voice Mic */}
      <AnimatePresence>
        {hapticToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 right-8 bg-gradient-to-r from-volt-cyan to-volt-green text-black px-4 py-3 rounded-lg font-bold text-sm shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          >
            ⚡ Haptic Feedback Triggered
          </motion.div>
        ))}

        {/* Voice message display */}
        {voiceMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-40 right-8 bg-volt-navy/80 px-4 py-2 rounded-lg text-sm border border-white/5"
          >
            {voiceMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microphone Button - bottom-right */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { micActive ? stopRecognition() : startRecognition(); }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${micActive ? 'bg-volt-cyan/90 shadow-[0_0_30px_rgba(34,211,238,0.6)] animate-pulse' : 'bg-volt-navy/80 border border-white/5'}`}
          title="Tap to use voice commands"
        >
          <div className="text-2xl">🎤</div>
        </motion.button>
        <div className="text-xs text-slate-400 mt-2 text-center">Tap to use voice commands</div>
      </div>
    </div>
  );
};

// 5. ERROR SCREEN - CONNECTOR ERROR
const ErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic([100, 50, 100, 50, 100, 50, 100]);
    speak("Connection error. Connector not detected.");
    beep(300);
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-3xl mx-auto w-full">
      <motion.div
        animate={{ scale: [1, 1.1, 0.95, 1.05, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-volt-red flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.6)]"
      >
        <AlertTriangle size={48} className="text-volt-red animate-pulse" />
      </motion.div>

      <h2 className="text-3xl font-bold text-volt-red mb-2">⚠️ Connector Error</h2>
      <p className="text-slate-300 mb-8 text-lg">Connector not detected. Please reconnect cable.</p>

      <div className="w-full bg-red-950/40 border-l-4 border-volt-red rounded-lg p-6 mb-8 text-left">
        <h3 className="text-volt-red font-bold mb-3">Error Code: E-CCS-001</h3>
        <div className="space-y-2 text-slate-300 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-volt-red">⚡</span>
            <span>Cable may not be fully inserted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-volt-red">⚡</span>
            <span>Incompatible vehicle connector</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-volt-red">⚡</span>
            <span>Port obstruction detected</span>
          </div>
        </div>
      </div>

      <div className="bg-volt-navy/60 w-full p-6 rounded-lg border border-white/10 mb-8 flex flex-col items-center">
        <span className="font-bold text-sm mb-4">🔌 Check Cable Connection</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <ArrowRight className="rotate-180 text-volt-red" size={28} />
        </motion.div>
        <span className="text-xs text-slate-400 mt-4 text-center">Remove and reconnect the cable firmly until you hear a click</span>
      </div>

      <div className="flex gap-4 w-full">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Connection</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// ERROR SCREEN - NETWORK ERROR
const NetworkErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic(50);
    speak("Network unavailable. Please wait or try again.");
    beep(400);
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-3xl mx-auto w-full">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-orange-950 border-2 border-orange-500 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(249,115,22,0.4)]"
      >
        <Wifi size={48} className="text-orange-400" />
      </motion.div>

      <h2 className="text-3xl font-bold text-orange-400 mb-2">🌐 Network Error</h2>
      <p className="text-slate-300 mb-8 text-lg">Network unavailable. Please wait or try again.</p>

      <div className="w-full bg-orange-950/40 border-l-4 border-orange-500 rounded-lg p-6 mb-8 text-left">
        <h3 className="text-orange-400 font-bold mb-3">Error Code: E-NET-001</h3>
        <div className="space-y-2 text-slate-300 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📡</span>
            <span>No internet connection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📡</span>
            <span>Server temporarily unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📡</span>
            <span>Check WiFi or mobile signal</span>
          </div>
        </div>
      </div>

      <div className="bg-volt-navy/60 w-full p-6 rounded-lg border border-white/10 mb-8 flex flex-col items-center">
        <span className="font-bold text-sm mb-4">⏳ Retrying in a moment...</span>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Wifi className="text-orange-400" size={28} />
        </motion.div>
      </div>

      <div className="flex gap-4 w-full">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Now</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// ERROR SCREEN - BATTERY OVERHEAT
const OverheatErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic([150, 100, 150]);
    speak("Battery temperature high. Charging paused for safety.");
    beep(350);
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-3xl mx-auto w-full">
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-orange-950 border-2 border-orange-600 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(234,88,12,0.6)]"
      >
        <AlertTriangle size={48} className="text-orange-500" />
      </motion.div>

      <h2 className="text-3xl font-bold text-orange-500 mb-2">🔥 Battery Overheat</h2>
      <p className="text-slate-300 mb-8 text-lg">Battery temperature high. Charging paused for safety.</p>

      <div className="w-full bg-orange-950/40 border-l-4 border-orange-600 rounded-lg p-6 mb-8 text-left">
        <h3 className="text-orange-500 font-bold mb-3">Error Code: E-THERM-001</h3>
        <div className="space-y-3 text-slate-300 text-sm">
          <div className="flex items-center gap-3 bg-black/30 p-3 rounded">
            <span className="text-2xl">🌡️</span>
            <div>
              <div className="font-bold text-orange-400">Battery Temperature: 58°C</div>
              <div className="text-xs text-slate-400">Safe operating range: 15-45°C</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>⏱️</span>
            <span>Charging will resume when temperature drops</span>
          </div>
        </div>
      </div>

      <div className="bg-volt-navy/60 w-full p-6 rounded-lg border border-white/10 mb-8 flex flex-col items-center">
        <span className="font-bold text-sm mb-4">🔌 Allow Battery to Cool</span>
        <div className="text-xs text-slate-400 text-center">
          Move vehicle to a shaded area or wait 15-20 minutes before resuming
        </div>
      </div>

      <div className="flex gap-4 w-full">
        <Button onClick={onRetry} variant="primary" className="flex-1">Check Temperature</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// ERROR SCREEN - PAYMENT FAILURE
const PaymentErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic([100, 50, 100, 50, 100]);
    speak("Payment failed. Try another payment method.");
    beep(380);
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-3xl mx-auto w-full">
      <motion.div
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-red-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
      >
        <X size={48} className="text-red-500" />
      </motion.div>

      <h2 className="text-3xl font-bold text-red-500 mb-2">💳 Payment Failed</h2>
      <p className="text-slate-300 mb-8 text-lg">Payment failed. Try another method.</p>

      <div className="w-full bg-red-950/40 border-l-4 border-red-600 rounded-lg p-6 mb-8 text-left">
        <h3 className="text-red-500 font-bold mb-3">Error Code: E-PAY-001</h3>
        <div className="space-y-2 text-slate-300 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span>Card declined by issuer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span>Insufficient funds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span>Payment gateway timeout</span>
          </div>
        </div>
      </div>

      <div className="bg-volt-navy/60 w-full p-6 rounded-lg border border-white/10 mb-8 flex flex-col items-center">
        <span className="font-bold text-sm mb-3">💰 Try Another Payment Method</span>
        <div className="text-xs text-slate-400 text-center">
          Use a different card, Apple Pay, or Google Pay to complete the transaction
        </div>
      </div>

      <div className="flex gap-4 w-full">
        <Button onClick={onRetry} variant="primary" className="flex-1">Try Again</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// 5.5 CHARGING INTERRUPTED
const ChargingErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => { 
    triggerHaptic([100, 50, 100, 50, 200]);
    speak("Charging interrupted. Power disconnected."); 
    beep(500);
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-3xl mx-auto w-full">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-red-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
      >
        <AlertTriangle size={48} className="text-red-500" />
      </motion.div>

      <h2 className="text-3xl font-bold text-red-500 mb-2">⚠️ Charging Interrupted</h2>
      <p className="text-slate-300 mb-8 text-lg">Power connection lost during charging</p>

      <div className="w-full bg-red-950/40 border-l-4 border-red-600 rounded-lg p-6 mb-8 text-left">
        <h3 className="text-red-500 font-bold mb-3">Error Code: E-PWR-002</h3>
        <div className="space-y-2 text-slate-300 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-500">🔌</span>
            <span>Cable disconnected unexpectedly</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">🔌</span>
            <span>Power supply interrupted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">🔌</span>
            <span>Vehicle moved during charging</span>
          </div>
        </div>
      </div>

      <div className="bg-volt-navy/60 w-full p-6 rounded-lg border border-white/10 mb-8 flex flex-col items-center">
        <span className="font-bold text-sm mb-4">🔌 Reconnect and Retry</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <ArrowRight className="rotate-180 text-red-500" size={28} />
        </motion.div>
        <span className="text-xs text-slate-400 mt-4 text-center">Ensure cable is firmly connected before retrying</span>
      </div>

      <div className="flex gap-4 w-full">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Charging</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// 6. PAYMENT / COMPLETE
const PaymentScreen = ({ onHome }) => {
  useEffect(() => { speak("Charging completed successfully. Receipt sent."); }, []);

  const downloadReceipt = () => {
    const now = new Date();
    const receipt = `VoltCharge Receipt\nDate: ${now.toLocaleString()}\n\nTotal Energy: 42.5 kWh\nTime: 35 min\nTotal Paid: $19.12\n\nThank you for charging with VoltCharge.`;
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltcharge-receipt-${now.getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    speak('Receipt downloaded.');
    triggerHaptic([80, 40]);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center max-w-lg mx-auto w-full text-center">
      <div className="w-24 h-24 rounded-full bg-volt-green/20 border border-volt-green flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
        <CheckCircle2 size={48} className="text-volt-green" />
      </div>
      <h2 className="text-3xl font-bold mb-2">Charging Completed</h2>
      <p className="text-slate-400 mb-8">Payment Successful</p>

      <Card className="w-full mb-8">
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-slate-400">Total Energy</span>
          <span className="font-mono">42.5 kWh</span>
        </div>
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-slate-400">Time</span>
          <span className="font-mono">35 min</span>
        </div>
        <div className="flex justify-between py-4 text-xl font-bold text-volt-cyan">
          <span>Total Paid</span>
          <span>$19.12</span>
        </div>
      </Card>

      <div className="flex gap-4 w-full max-w-sm">
        <Button onClick={downloadReceipt} variant="primary" className="flex-1">Download Receipt</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Return Home</Button>
      </div>
    </div>
  );
};

// 7. HISTORY
const HistoryScreen = ({ onBack }) => {
  const data = [
    { name: 'Mon', amt: 24 }, { name: 'Tue', amt: 13 },
    { name: 'Wed', amt: 38 }, { name: 'Thu', amt: 20 },
    { name: 'Fri', amt: 45 }, { name: 'Sat', amt: 30 }, { name: 'Sun', amt: 15 },
  ];

  return (
    <div className="flex flex-col h-full p-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack}><ArrowRight className="rotate-180" /></button>
        <h2 className="text-2xl font-bold">Charging History</h2>
      </div>

      <Card className="h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Bar dataKey="amt" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between items-center p-4 bg-volt-navy/40 rounded-xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-volt-cyan/10 rounded-lg">
                <Zap size={16} className="text-volt-cyan" />
              </div>
              <div>
                <div className="font-bold">Station {i}</div>
                <div className="text-xs text-slate-500">Today, 2:30 PM</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold">$12.50</div>
              <div className="text-xs text-slate-500">25 kWh</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [screen, setScreen] = useState('home');
  const [chargingMode, setChargingMode] = useState('normal');

  const renderScreen = () => {
    switch(screen) {
      case 'home': return (
        <HomeScreen 
          onNext={() => setScreen('mode-select')} 
          onHistory={() => setScreen('history')}
          onErrorConnector={() => setScreen('error')}
          onErrorNetwork={() => setScreen('network-error')}
          onErrorOverheat={() => setScreen('overheat-error')}
          onErrorPayment={() => setScreen('payment-error')}
        />
      );
      case 'mode-select': return (
        <ChargingModeScreen 
          onFastCharge={() => {
            setChargingMode('fast');
            setScreen('auth');
          }}
          onNormalCharge={() => {
            setChargingMode('normal');
            setScreen('auth');
          }}
        />
      );
      case 'auth': return <AuthScreen onNext={() => setScreen('connect')} />;
      case 'connect': return <ConnectScreen onNext={() => setScreen('charging')} onError={() => setScreen('error')} />;
      case 'charging': return <ChargingScreen mode={chargingMode} onComplete={() => setScreen('payment')} onError={() => setScreen('charging-error')} />;
      case 'error': return <ErrorScreen onRetry={() => setScreen('connect')} onHome={() => setScreen('home')} />;
      case 'network-error': return <NetworkErrorScreen onRetry={() => setScreen('connect')} onHome={() => setScreen('home')} />;
      case 'overheat-error': return <OverheatErrorScreen onRetry={() => setScreen('charging')} onHome={() => setScreen('home')} />;
      case 'payment-error': return <PaymentErrorScreen onRetry={() => setScreen('auth')} onHome={() => setScreen('home')} />;
      case 'charging-error': return <ChargingErrorScreen onRetry={() => setScreen('charging')} onHome={() => setScreen('home')} />;
      case 'payment': return <PaymentScreen onHome={() => setScreen('home')} />;
      case 'history': return <HistoryScreen onBack={() => setScreen('home')} />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-hexagon text-white font-sans flex flex-col">
      <Header />
      <div className="flex-1 pt-20 pb-8 px-4 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}