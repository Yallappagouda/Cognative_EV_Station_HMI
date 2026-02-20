import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Clock, ShieldCheck, Wifi, Smartphone, ArrowRight, 
  CheckCircle2, Circle, AlertTriangle, RotateCcw, Phone, 
  Battery, History, X, Lock, Unlock, Speaker
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { triggerHaptic, speak, beep } from './utils';
import useVoiceCommands from './hooks/useVoiceCommands';
import MicButton from './components/MicButton';
import { useCognitive } from './hooks/useCognitiveEngine';

// reference to avoid unused-import linter in some environments
const _motionRef = motion;

// --- UI COMPONENTS ---

const Card = ({ children, className, onClick, active }) => {
  const { registerInteraction } = useCognitive();

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }
    registerInteraction();
  };

  return (
    <div 
      onClick={handleClick}
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
};

const Button = ({ children, onClick, variant = 'primary', className, icon: Icon, disabled = false }) => {
  const { registerInteraction } = useCognitive();

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
      onClick={
        !disabled
          ? (event) => {
              registerInteraction();
              if (onClick) onClick(event);
            }
          : undefined
      }
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  );
};

// --- SCREENS ---

const Header = ({ voice }) => (
  <div className="absolute top-0 z-10 flex items-center justify-between w-full p-6">
    <div className="flex items-center gap-2">
      <Zap className="text-volt-cyan fill-volt-cyan" />
      <span className="font-sans text-xl font-bold tracking-widest">VOLTCHARGE</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex gap-4 px-4 py-2 font-mono text-xs border rounded-full text-slate-400 bg-volt-navy/80 border-white/5">
        <span className="flex items-center gap-2"><Wifi size={12} className="text-volt-green" /> 5G Connected</span>
        <span>|</span>
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="ml-2">
        <MicButton voice={voice} />
      </div>
    </div>
  </div>
);

// 1. HOME - WELCOME SCREEN WITH FIRST-TIME CHECK
const HomeScreen = ({ onNext, decideUserMode, userMode }) => {
  const startRef = useRef(null);
  const { incrementHelp, registerInteraction } = useCognitive();
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  const isMountedRef = useRef(true);
  const isListeningRef = useRef(false);
  const [hasVoiceSupport, setHasVoiceSupport] = useState(false);

  const handleYes = () => {
    // First time user → GUIDED mode
    decideUserMode && decideUserMode(true, 0);
    try { window.dispatchEvent(new CustomEvent('voltcharge-start', { detail: { time: Date.now() } })); } catch (e) { void e; }
    onNext();
  };

  const handleNo = () => {
    // Check response time for mode detection
    const elapsed = Date.now() - (startRef.current || Date.now());
    decideUserMode && decideUserMode(false, elapsed);
    try { window.dispatchEvent(new CustomEvent('voltcharge-start', { detail: { time: Date.now() } })); } catch (e) { void e; }
    onNext();
  };

  useEffect(() => { 
    startRef.current = Date.now();
    speak("Welcome to EV Charging Station. Is this your first time charging an EV?"); 

    // FIRST SCREEN VOICE RECOGNITION (safe, single instance)
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    setHasVoiceSupport(true);

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        if (hasTriggeredRef.current) return;
        if (!event.results || event.results.length === 0) {
          setVoiceError('Please say Yes or No');
          return;
        }

        const lastResult = event.results[event.results.length - 1];
        if (!lastResult || !lastResult[0]) {
          setVoiceError('Please say Yes or No');
          return;
        }

        const transcript = lastResult[0].transcript.toLowerCase().trim();

        if (transcript.includes('yes')) {
          hasTriggeredRef.current = true;
          setVoiceError('');
          try {
            recognition.stop();
          } catch (e) {
            // ignore stop errors
          }
          handleYes();
          return;
        }

        if (transcript.includes('no')) {
          hasTriggeredRef.current = true;
          setVoiceError('');
          try {
            recognition.stop();
          } catch (e) {
            // ignore stop errors
          }
          handleNo();
          return;
        }

        setVoiceError('Please say Yes or No');
      };

      recognition.onend = () => {
        if (!hasTriggeredRef.current && isListeningRef.current && isMountedRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log('Restart blocked:', e && e.message);
          }
        }
      };

      recognition.onerror = (event) => {
        // eslint-disable-next-line no-console
        console.log('First screen voice error:', event && event.error);
      };

      try {
        recognition.start();
        isListeningRef.current = true;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Start error:', e && e.message);
        isListeningRef.current = false;
      }
    }

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop errors
        }
        recognitionRef.current = null;
        isListeningRef.current = false;
      }
    };
  }, []);

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : (userMode === 'EXPERT' ? 'text-sm' : ''));

  return (
    <div className={`flex flex-col h-full justify-between px-4 py-8 relative ${modeClasses}`}>
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 border rounded-full bg-volt-cyan/20 border-volt-cyan">
            <Zap size={32} className="text-volt-cyan" />
          </div>
        </div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className={`font-bold font-sans text-glow mb-2 ${userMode === 'ELDERLY' ? 'text-4xl' : (userMode === 'GUIDED' ? 'text-3xl' : 'text-2xl')}`}
        >
          EV Charging Station
        </motion.h1>
        <p className={`${userMode === 'ELDERLY' ? 'text-xl' : (userMode === 'GUIDED' ? 'text-lg' : 'text-base')} text-slate-400`}>Fast, Safe, and Sustainable Charging</p>
      </div>

      {/* Main Question Section */}
      <div className="flex items-center justify-center flex-1 mb-12">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl text-center"
        >
          <h2 className={`font-bold font-sans mb-12 ${userMode === 'ELDERLY' ? 'text-3xl' : (userMode === 'GUIDED' ? 'text-2xl' : 'text-xl')}`}>
            Is this your first time charging an EV?
          </h2>
          {voiceError && (
            <p className="mt-2 text-sm text-amber-400">
              {voiceError}
            </p>
          )}
          
          <div className={`grid grid-cols-2 gap-6 ${userMode === 'ELDERLY' ? 'gap-8' : ''}`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleYes}
              className={`py-6 px-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 text-white bg-volt-green/20 border-volt-green hover:bg-volt-green/30 ${userMode === 'ELDERLY' ? 'py-8 text-2xl' : (userMode === 'GUIDED' ? 'py-6 text-lg' : 'py-4 text-base')}`}
            >
              ✅ Yes
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNo}
              className={`py-6 px-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 text-white bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 ${userMode === 'ELDERLY' ? 'py-8 text-2xl' : (userMode === 'GUIDED' ? 'py-6 text-lg' : 'py-4 text-base')}`}
            >
              ❌ No
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer Section */}
      <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
        <button
          className="hover:text-slate-300"
          onClick={() => {
            incrementHelp();
            registerInteraction();
          }}
        >
          ℹ️ Help
        </button>
        <div className="w-px h-5 bg-slate-700"></div>
        {hasVoiceSupport && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>🎤</span>
            <span>Voice: Say "Yes" or "No"</span>
          </div>
        )}
        <select className="px-3 py-1 bg-transparent border rounded border-slate-600 text-slate-300">
          <option>English</option>
          <option>Español</option>
          <option>Français</option>
        </select>
      </div>
    </div>
  );
};

// 1.5. CHARGING MODE SELECTION
const ChargingModeScreen = ({ onFastCharge, onNormalCharge, userMode }) => {
  const handleFastCharge = () => {
    triggerHaptic(50);
    speak("Fast charging selected.");
    // notify any listeners (research tracking)
    try { window.dispatchEvent(new CustomEvent('voltcharge-mode-selected', { detail: { mode: 'fast', time: Date.now() } })); } catch (e) { void e; }
    onFastCharge();
  };

  const handleNormalCharge = () => {
    triggerHaptic(50);
    speak("Normal charging selected.");
    try { window.dispatchEvent(new CustomEvent('voltcharge-mode-selected', { detail: { mode: 'normal', time: Date.now() } })); } catch (e) { void e; }
    onNormalCharge();
  };

  useEffect(() => { 
    speak("Select your charging mode. Fast charge for quick charging or normal charge for balanced speed and battery health."); 
  }, []);

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : (userMode === 'EXPERT' ? 'text-sm compact-layout' : ''));
  return (
    <div className={`flex flex-col h-full justify-center px-4 max-w-5xl mx-auto w-full ${modeClasses}`}>
      <div className="mb-16 text-center">s
        <h2 className="mb-2 font-sans text-4xl font-bold text-glow">Select Charging Mode</h2>
        <p className="text-slate-400">Choose your preferred charging speed</p>
      </div>

      <div className="grid items-stretch grid-cols-1 gap-8 md:grid-cols-2">
        {/* FAST CHARGE CARD */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFastCharge}
          className="relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm bg-volt-navy/40 hover:bg-volt-navy/60 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]">
          <div className="absolute w-8 h-8 border-2 rounded-full top-4 right-4 border-cyan-400 bg-cyan-400/10"></div>
          
          <div className="mb-6 text-6xl">⚡</div>
          <h3 className="mb-2 text-3xl font-bold text-cyan-400">Fast Charge</h3>
          <p className="mb-6 text-lg text-slate-400">High-speed charging</p>
          
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">⚡</span>
              <span>0-80% in ~25 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">⚡</span>
              <span>150 kW max power</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">⚡</span>
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
          <div className="absolute w-8 h-8 border-2 border-green-500 rounded-full top-4 right-4 bg-green-500/10"></div>
          
          <div className="mb-6 text-6xl">🔋</div>
          <h3 className="mb-2 text-3xl font-bold text-green-500">Normal Charge</h3>
          <p className="mb-6 text-lg text-slate-400">Balanced charging mode</p>
          
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">✓</span>
              <span>Optimized for battery health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">✓</span>
              <span>50 kW balanced power</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">✓</span>
              <span>Extended battery lifespan</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// 2. AUTHENTICATION
const AuthScreen = ({ onNext, voice, userMode }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const inputRef = useRef(null);
  const { incrementError, registerInteraction } = useCognitive();

  useEffect(() => { 
    beep(500);
    const stepText = userMode === 'GUIDED' ? 'Step 1: Identify Yourself. Tap your card or enter your phone number.' : 'Please identify yourself to continue.';
    speak(stepText); 
  }, [userMode]);

  useEffect(() => {
    const onFocus = () => inputRef.current && inputRef.current.focus();
    const onClear = () => setPhone('');
    window.addEventListener('voltcharge-focus-mobile', onFocus);
    window.addEventListener('voltcharge-clear-mobile', onClear);
    return () => { window.removeEventListener('voltcharge-focus-mobile', onFocus); window.removeEventListener('voltcharge-clear-mobile', onClear); };
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
      incrementError();
      try { window.dispatchEvent(new Event('voltcharge-invalid-phone')); } catch (e) { void e; }
      setTimeout(() => setShake(false), 700);
      return;
    }
    setError('');
    beep(300);
    speak('OTP is being sent to your mobile number.');
    triggerHaptic(50);
    setTimeout(() => {
      onNext(phone, 'normal');
    }, 400);
  };

  const handleNfcTap = () => {
    try {
      triggerHaptic(50);
      beep(400);
      speak('Card recognized. Proceeding to charging setup.');
      setTimeout(() => {
      onNext(null, 'normal');
      }, 300);
    } catch (err) {
      console.error('NFC tap error:', err);
      setError('Could not process card. Please try again.');
      triggerHaptic([100, 50, 100]);
    incrementError();
    }
  };

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : 'text-sm');
  const titleSize = userMode === 'ELDERLY' ? 'text-4xl' : (userMode === 'GUIDED' ? 'text-3xl' : 'text-2xl');
  const buttonSpacing = userMode === 'ELDERLY' ? 'gap-8' : (userMode === 'GUIDED' ? 'gap-6' : 'gap-4');
  
  return (
    <div className={`flex flex-col h-full justify-center px-8 max-w-5xl mx-auto w-full ${modeClasses}`}>
      <div className={`mb-8 ${userMode === 'GUIDED' ? 'flex items-center gap-2 mb-12' : ''}`}>
        {userMode === 'GUIDED' && <span className="font-bold text-volt-cyan">Step 1 of 3</span>}
        <h2 className={`${titleSize} font-bold font-sans text-glow`}>
          {userMode === 'GUIDED' ? 'Identify Yourself' : 'Authentication'}
        </h2>
        <p className={`${userMode === 'ELDERLY' ? 'text-xl' : 'text-slate-400'}`}>
          {userMode === 'ELDERLY' ? 'Use your card or phone number' : 'Please identify yourself to continue'}
        </p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${buttonSpacing} items-stretch ${userMode === 'ELDERLY' ? 'h-[500px]' : 'h-[400px]'}`}>
        {/* Card 1: NFC */}
        <Card onClick={handleNfcTap} className={`cursor-pointer group flex flex-col items-center justify-center hover:border-volt-cyan ${userMode === 'ELDERLY' ? 'p-12' : 'p-6'}`}>
          <div className={`rounded-full bg-volt-dark border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${userMode === 'ELDERLY' ? 'w-40 h-40' : 'w-32 h-32'}`}>
            <Wifi size={userMode === 'ELDERLY' ? 64 : 48} className="text-volt-cyan" />
          </div>
          <h3 className={`${userMode === 'ELDERLY' ? 'text-2xl' : (userMode === 'GUIDED' ? 'text-lg' : 'text-base')} font-bold mb-2`}>Tap Card</h3>
          <p className={`text-slate-500 ${userMode === 'ELDERLY' ? 'text-lg' : 'text-sm'}`}>NFC / RFID</p>
        </Card>

        {/* OR Divider */}
        <div className="absolute z-10 flex-col items-center justify-center hidden -translate-x-1/2 -translate-y-1/2 md:flex left-1/2 top-1/2">
          <div className={`${userMode === 'ELDERLY' ? 'h-20' : 'h-16'} w-[1px] bg-slate-700 mb-2`}></div>
          <span className="px-2 font-mono text-xs bg-volt-dark text-slate-500">OR</span>
          <div className={`${userMode === 'ELDERLY' ? 'h-20' : 'h-16'} w-[1px] bg-slate-700 mt-2`}></div>
        </div>

        {/* Card 2: Phone */}
        <Card className={`flex flex-col justify-center ${userMode === 'ELDERLY' ? 'p-12' : 'p-6'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`bg-volt-green/10 rounded-lg ${userMode === 'ELDERLY' ? 'p-4' : 'p-3'}`}>
              <Smartphone className="text-volt-green" size={userMode === 'ELDERLY' ? 32 : 24} />
            </div>
            <div>
              <h3 className={`font-bold ${userMode === 'ELDERLY' ? 'text-xl' : 'text-lg'}`}>Mobile Number</h3>
              <p className={`text-slate-500 ${userMode === 'ELDERLY' ? 'text-base' : 'text-xs'}`}>Enter 10 digits</p>
            </div>
          </div>
          <motion.div animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}>
            <div className="flex gap-2">
              <input 
                ref={inputRef}
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="9876543210" 
                className={`flex-1 bg-black/40 rounded-lg outline-none ${error ? 'border border-red-500' : 'border border-white/10 focus:border-volt-cyan'} ${userMode === 'ELDERLY' ? 'p-6 text-2xl' : (userMode === 'GUIDED' ? 'p-4 text-lg' : 'p-4 text-base')}`}
              />
              <button
                onClick={() => {
                  if (!voice) return;
                  if (voiceModeActive) {
                    voice.stopListening();
                    setVoiceModeActive(false);
                    return;
                  }
                  setVoiceModeActive(true);
                  voice.startListening('digits', (digits) => {
                    if (digits) setPhone(prev => (prev + digits).slice(0, 10));
                    setVoiceModeActive(false);
                    voice.stopListening();
                  });
                }}
                className={`px-3 py-2 rounded-lg ${voiceModeActive ? 'bg-volt-cyan text-black' : 'bg-volt-navy/60 text-white'} border border-white/10 ${userMode === 'ELDERLY' ? 'text-2xl' : ''}`}
                title="Voice input for mobile number"
              >
                🎤
              </button>
            </div>
          </motion.div>
          {error && <div className="p-2 mb-2 text-xs text-red-400 rounded bg-red-950/30">{error}</div>}
        </Card>
      </div>

      <Button onClick={handleAuth} variant="primary" className={`mt-8 w-full max-w-md mx-auto ${userMode === 'ELDERLY' ? 'py-6 text-2xl' : (userMode === 'GUIDED' ? 'py-5 text-lg' : '')}`}>
        CONTINUE
      </Button>
    </div>
  );
};

// 2.5 OTP VERIFICATION WITH REAL BACKEND
const OTPScreen = ({ onNext, voice, userMode, mobile }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const inputRef = useRef(null);
  const sendAttemptRef = useRef(0);
  const { incrementError, incrementHelp } = useCognitive();

  // Clear error when user starts typing
  useEffect(() => {
    if (otp.length > 0) {
      setError('');
    }
  }, [otp]);

  useEffect(() => {
    // Request OTP from backend
    const sendOtp = async () => {
      if (!mobile || sendAttemptRef.current > 0) return;
      sendAttemptRef.current++;

      setInitializing(true);
      setError('');
      try {
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile })
        });

        // Check for successful HTTP response
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to send OTP`);
        }

        const data = await response.json();
        if (data.success) {
          setOtpSent(true);
          speak(`OTP sent to ${mobile}. Please enter the code.`);
          triggerHaptic(50);
        } else {
          throw new Error(data.message || 'Backend rejected OTP request');
        }
      } catch (err) {
        console.error('OTP send error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Network error';
        setError(`Failed to send OTP: ${errorMsg}. Please try again.`);
        incrementError();
        speak('Failed to send OTP. Check your connection and try again.');
        triggerHaptic([100, 50, 100]);
      } finally {
        setInitializing(false);
      }
    };
    sendOtp();
  }, [mobile]);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Enter a valid OTP.');
      speak('Enter a valid OTP.');
      setShake(true);
      setTimeout(() => setShake(false), 700);
      incrementError();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp })
      });
      const data = await response.json();

      if (data.success) {
        setError('');
        speak('OTP verified successfully. Proceeding to charging setup.');
        triggerHaptic(50);
        setTimeout(() => onNext(), 500);
      } else {
        setError(data.message || 'Invalid OTP. Try again.');
        speak('Invalid OTP.');
        setShake(true);
        triggerHaptic([100, 50, 100]);
        setTimeout(() => setShake(false), 700);
        incrementError();
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      setError('Network error. Please try again.');
      speak('Network error.');
      incrementError();
    } finally {
      setIsLoading(false);
    }
  };

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!canResend) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [canResend]);

  const handleResendOtp = async () => {
    setCanResend(false);
    setTimer(30);
    setOtp('');
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to resend OTP`);
      }

      const data = await response.json();
      if (data.success) {
        speak('OTP resent successfully.');
        triggerHaptic(50);
      } else {
        throw new Error(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('OTP resend error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(`Resend failed: ${errorMsg}`);
      speak('Failed to resend OTP. Please try again.');
      triggerHaptic([100, 50, 100]);
      incrementError();
    } finally {
      setIsLoading(false);
    }
  };

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : 'text-sm');

  // Show loading state while OTP is being sent
  if (initializing) {
    return (
      <div className={`flex flex-col h-full items-center justify-center px-8 max-w-md mx-auto w-full ${modeClasses}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 mb-6 border-4 rounded-full border-volt-cyan border-t-transparent"
        />
        <h2 className={`font-bold font-sans text-glow mb-2 ${userMode === 'ELDERLY' ? 'text-3xl' : (userMode === 'GUIDED' ? 'text-2xl' : 'text-xl')}`}>
          Sending OTP...
        </h2>
        <p className={`${userMode === 'ELDERLY' ? 'text-lg' : 'text-base'} text-slate-400`}>
          Please wait while we send the code to {mobile}
        </p>
      </div>
    );
  }

  // Show error if OTP failed to send
  if (!otpSent && error) {
    return (
      <div className={`flex flex-col h-full items-center justify-center px-8 max-w-md mx-auto w-full ${modeClasses}`}>
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="flex items-center justify-center w-16 h-16 mb-6 border-2 border-red-600 rounded-full bg-red-950/50"
        >
          <AlertTriangle className="text-red-400" size={32} />
        </motion.div>
        <h2 className={`font-bold font-sans text-glow mb-2 text-red-400 ${userMode === 'ELDERLY' ? 'text-3xl' : (userMode === 'GUIDED' ? 'text-2xl' : 'text-xl')}`}>
          Error Sending OTP
        </h2>
        <p className={`${userMode === 'ELDERLY' ? 'text-lg' : 'text-base'} text-slate-300 text-center mb-8`}>
          {error}
        </p>
        <Button
          onClick={() => {
            setInitializing(true);
            setError('');
            sendAttemptRef.current = 0;
          }}
          variant="primary"
          className={userMode === 'ELDERLY' ? 'py-6 text-2xl' : ''}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full justify-center px-8 max-w-md mx-auto w-full ${modeClasses}`}>
      <div className="mb-12 text-center">
        {userMode === 'GUIDED' && <span className="block mb-2 text-sm font-bold text-volt-cyan">Step 2 of 3</span>}
        <h2 className={`font-bold font-sans text-glow mb-2 ${userMode === 'ELDERLY' ? 'text-3xl' : (userMode === 'GUIDED' ? 'text-2xl' : 'text-xl')}`}>Enter OTP</h2>
        <p className={`${userMode === 'ELDERLY' ? 'text-lg' : (userMode === 'GUIDED' ? 'text-base' : 'text-sm')} text-slate-400`}>We sent a code to {mobile}</p>
      </div>

      <Card className="flex flex-col justify-center mb-8">
        <motion.div animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}>
          <div className="flex gap-2 mb-2">
            <input
              ref={inputRef}
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={isLoading}
              className={`flex-1 bg-black/40 rounded-lg p-4 text-center ${userMode === 'ELDERLY' ? 'text-3xl' : (userMode === 'GUIDED' ? 'text-2xl' : 'text-xl')} tracking-widest font-bold outline-none ${error ? 'border border-red-500' : 'border border-white/10 focus:border-volt-cyan'}`}
            />
            <button
              onClick={() => {
                if (!voice) return;
                if (voiceModeActive) {
                  voice.stopListening();
                  setVoiceModeActive(false);
                  return;
                }
                setVoiceModeActive(true);
                voice.startListening('digits', (digits) => {
                  if (digits) setOtp(prev => (prev + digits).slice(0, 6));
                  setVoiceModeActive(false);
                  voice.stopListening();
                });
              }}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg ${voiceModeActive ? 'bg-volt-cyan text-black' : 'bg-volt-navy/60 text-white'} border border-white/10`}
              title="Voice input for OTP"
            >
              🎤
            </button>
          </div>
        </motion.div>
        {error && <div className="p-3 mb-4 text-xs text-center text-red-400 rounded bg-red-950/30">{error}</div>}
        <Button
          onClick={handleVerifyOtp}
          variant="primary"
          disabled={isLoading || otp.length < 4}
          className={`${userMode === 'ELDERLY' ? 'py-6 text-2xl' : (userMode === 'GUIDED' ? 'py-5 text-lg' : '')}`}
        >
          {isLoading ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ display: 'inline-block' }}>
                ⏳
              </motion.span>
              {' Verifying...'}
            </>
          ) : 'VERIFY OTP'}
        </Button>
        <div className={`text-center mt-4 ${userMode === 'ELDERLY' ? 'text-lg' : 'text-sm'} text-slate-400`}>
          {canResend ? (
            <button
              onClick={handleResendOtp}
              className="font-semibold underline text-volt-cyan hover:text-volt-green"
            >
              Resend OTP
            </button>
          ) : (
            <span>Resend OTP in <span className="font-bold text-volt-cyan">{timer}s</span></span>
          )}
        </div>
      </Card>
    </div>
  );
};

// 3. CONNECT CABLE (OLD - KEPT FOR COMPATIBILITY)
// [DEPRECATED - Use CableConnectionScreen instead]
// filepath: c:\Users\Lenovo\OneDrive\ドキュメント\GitHub\HMI_EV_CHARGING\src\App.jsx
// Add this BEFORE the main App function (around line 1300, before "export default function App")

// 3. CABLE CONNECTION SCREEN (NFC / CONNECTOR DETECTION)
const CableConnectionScreen = ({ onNext, userMode }) => {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    speak(userMode === 'GUIDED' ? 'Step 2 of 3: Connect your charging cable.' : 'Please connect your charging cable.');
    beep(500);
    
    // Simulate cable detection after 2 seconds
    const timeout = setTimeout(() => {
      setChecking(false);
      // Auto-detect cable (in production, this would check actual hardware)
      const detected = Math.random() > 0.3; // 70% success rate for demo
      if (detected) {
        setConnected(true);
        triggerHaptic([100, 50, 100]);
        speak('Cable connected successfully.');
      } else {
        setError('Cable not detected. Please insert cable firmly.');
        triggerHaptic([100, 50, 100, 50, 100]);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [userMode]);

  const handleRetry = () => {
    setChecking(true);
    setError('');
    setConnected(false);
    speak('Checking for cable connection...');
    
    setTimeout(() => {
      setChecking(false);
      const detected = Math.random() > 0.2; // 80% success rate on retry
      if (detected) {
        setConnected(true);
        triggerHaptic([100, 50, 100]);
        speak('Cable connected successfully.');
      } else {
        setError('Cable still not detected.');
      }
    }, 2000);
  };

  const handleContinue = () => {
    if (connected) {
      triggerHaptic(50);
      beep(300);
      speak('Proceeding to charging mode selection.');
      setTimeout(() => onNext(), 400);
    }
  };

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : 'text-sm');
  const titleSize = userMode === 'ELDERLY' ? 'text-4xl' : (userMode === 'GUIDED' ? 'text-3xl' : 'text-2xl');

  if (checking) {
    return (
      <div className={`flex flex-col h-full items-center justify-center px-8 max-w-md mx-auto w-full ${modeClasses}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 mb-6 border-4 rounded-full border-volt-cyan border-t-transparent"
        />
        <h2 className={`font-bold font-sans text-glow mb-2 ${titleSize}`}>
          Detecting Cable...
        </h2>
        <p className={`text-slate-400 ${userMode === 'ELDERLY' ? 'text-xl' : 'text-base'}`}>
          Please insert your charging cable
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full justify-center px-8 max-w-md mx-auto w-full ${modeClasses}`}>
      <div className={userMode === 'GUIDED' ? 'flex items-center gap-2 mb-12' : 'mb-8'}>
        {userMode === 'GUIDED' && <span className="font-bold text-volt-cyan">Step 2 of 3</span>}
        <h2 className={`font-bold font-sans text-glow ${titleSize}`}>
          {userMode === 'GUIDED' ? 'Connect Cable' : 'Cable Connection'}
        </h2>
      </div>

      <Card className={`flex flex-col items-center justify-center mb-8 ${userMode === 'ELDERLY' ? 'p-12 min-h-[300px]' : 'p-8 min-h-[250px]'}`}>
        <motion.div
          animate={connected ? { scale: [1, 1.2, 1] } : { y: [0, 10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`${userMode === 'ELDERLY' ? 'text-8xl' : 'text-6xl'} mb-6`}
        >
          {connected ? '✅' : '🔌'}
        </motion.div>
        <h3 className={`font-bold mb-2 ${userMode === 'ELDERLY' ? 'text-2xl' : 'text-lg'}`}>
          {connected ? 'Cable Connected' : 'Waiting for Cable'}
        </h3>
        <p className={`text-slate-400 text-center ${userMode === 'ELDERLY' ? 'text-lg' : 'text-sm'}`}>
          {connected ? 'Ready to start charging' : 'Insert cable into charging port'}
        </p>
      </Card>

      {error && (
        <div className={`bg-red-950/30 border border-red-600 rounded-lg p-4 mb-6 text-red-400 ${userMode === 'ELDERLY' ? 'text-lg' : 'text-sm'}`}>
          {error}
        </div>
      )}

      <div className="space-y-3">
        {!connected && (
          <Button onClick={handleRetry} variant="secondary" className={userMode === 'ELDERLY' ? 'py-6 text-2xl' : ''}>
            Retry Detection
          </Button>
        )}
        <Button 
          onClick={handleContinue} 
          variant="primary" 
          disabled={!connected}
          className={userMode === 'ELDERLY' ? 'py-6 text-2xl' : ''}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

// 4. CHARGING DASHBOARD
const ChargingScreen = ({ onComplete, onError, mode = 'normal', userMode = 'STANDARD' }) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [show80Modal, setShow80Modal] = useState(false);
  const [hapticTriggered, setHapticTriggered] = useState(false);
  const [hapticToasts, setHapticToasts] = useState([]);
  const [childLockEnabled, setChildLockEnabled] = useState(false);
  const [overVoltageWarning, setOverVoltageWarning] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  // --- Cognitive Load Adaptation Layer (new) ---
  const [errorCount, setErrorCount] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [cognitiveLoad, setCognitiveLoad] = useState("LOW");
  const startTimeRef = useRef(null);
  const lastInteractionRef = useRef(null);
  const firstActionTimeRef = useRef(null);
  const [startTime, setStartTime] = useState(null);

  const [cognitiveMetrics, setCognitiveMetrics] = useState({
    timeToFirstAction: 0,
    totalTaskTime: 0,
    interactionCount: 0,
    errorCount: 0,
    hesitationCount: 0,
    cognitiveLoadLevel: 'NORMAL'
  });
  const [nowTick, setNowTick] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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

  // --- Session logging and interaction helpers (moved up) ---
  const handleSessionComplete = useCallback((reason = 'user') => {
    const sessionData = {
      totalTime: Date.now() - (startTimeRef.current || Date.now()),
      errors: errorCount,
      interactions: interactionCount,
      hesitationEvents: hesitationCount,
      cognitiveLoadFinal: cognitiveMetrics.cognitiveLoadLevel || cognitiveLoad,
      reason,
      timestamp: Date.now()
    };
    try { localStorage.setItem('voltcharge-session', JSON.stringify(sessionData)); } catch (e) { void e; }
    onComplete && onComplete();
  }, [errorCount, interactionCount, hesitationCount, cognitiveMetrics, cognitiveLoad, onComplete]);

  const recordInteraction = useCallback((label) => {
    // record first action time
    if (!firstActionTimeRef.current) {
      firstActionTimeRef.current = Date.now();
      const ttf = Math.floor((firstActionTimeRef.current - (startTimeRef.current || Date.now())) / 1000);
      setCognitiveMetrics(prev => ({ ...prev, timeToFirstAction: ttf }));
    }
    void label;
    setInteractionCount(prev => prev + 1);
    const now = Date.now();
    lastInteractionRef.current = now;
    const actionDelay = now - (startTimeRef.current || now);
    if (actionDelay > 8000) {
      setHesitationCount(prev => prev + 1);
    }
  }, []);

  const handleVoiceCommand = useCallback((text) => {
    const cmd = text.toLowerCase();
    setVoiceMessage(`Heard: "${text}"`);
    // record voice interaction
    recordInteraction('voice_command');
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
      setTimeout(() => handleSessionComplete('voice_stop'), 500);
    } else {
      // wrong voice command counts as an error
      setErrorCount(prev => prev + 1);
      speak('Command not recognized.');
    }
    // brief display
    setTimeout(() => setVoiceMessage(''), 3000);
  }, [recordInteraction, triggerHapticWithFeedback, handleSessionComplete]);

  const startRecognition = useCallback(() => {
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
  }, [handleVoiceCommand]);

  const stopRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setMicActive(false);
  };

  // initialize timing refs and tick for admin panel (run on mount)
  useEffect(() => {
    const now = Date.now();
    startTimeRef.current = now;
    lastInteractionRef.current = now;
    // defer setting state to avoid synchronous setState within effect
    setTimeout(() => setNowTick(now), 0);
    setTimeout(() => setStartTime(now), 0);
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function handleEmergencyStop() {
    if (childLockEnabled) {
      speak("Child lock enabled. Emergency stop disabled.");
      triggerHaptic(50);
      return;
    }
    // record an interaction for emergency flow
    recordInteraction('emergency_request');
    setShowEmergencyConfirm(true);
  }

  const confirmEmergencyStop = () => {
    completedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    triggerHaptic([100, 50, 100, 50, 100]);
    speak("Charging stopped for safety.");
    beep(400);
    setShowEmergencyConfirm(false);
    setTimeout(() => handleSessionComplete('emergency_stop'), 500);
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
      // log as an error event for cognitive load
      setErrorCount(prev => prev + 1);
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
          setTimeout(() => handleSessionComplete('complete'), 500);
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
  }, [onComplete, onError, triggerHapticWithFeedback, handleSessionComplete]);

  // Idle-based hesitation tracker
  useEffect(() => {
    const interval = setInterval(() => {
      const idleTime = Date.now() - (lastInteractionRef.current || (startTimeRef.current || Date.now()));
      if (idleTime > 8000) {
        setHesitationCount(prev => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Cognitive load score calculation
  function calculateCognitiveLoad(metrics) {
    // HIGH if hesitationCount >=2 OR errorCount >=3 OR timeToFirstAction > 10 seconds
    if ((metrics.hesitationCount || 0) >= 2 || (metrics.errorCount || 0) >= 3 || (metrics.timeToFirstAction || 0) > 10) {
      return 'HIGH';
    }
    // LOW if no errors, no hesitations, and interactions below threshold
    const interactionThreshold = 3;
    if ((metrics.errorCount || 0) === 0 && (metrics.hesitationCount || 0) === 0 && (metrics.interactionCount || 0) < interactionThreshold) {
      return 'LOW';
    }
    return 'NORMAL';
  }

  // derive cognitiveMetrics from tracked states
  useEffect(() => {
    const totalTime = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const metrics = {
      timeToFirstAction: cognitiveMetrics.timeToFirstAction,
      totalTaskTime: totalTime,
      interactionCount,
      errorCount,
      hesitationCount
    };
    const level = calculateCognitiveLoad(metrics);
    // defer state update to avoid synchronous setState warnings
    setTimeout(() => setCognitiveMetrics({ ...metrics, cognitiveLoadLevel: level }), 0);
    setTimeout(() => setCognitiveLoad(level === 'LOW' ? 'LOW' : (level === 'HIGH' ? 'HIGH' : 'LOW')), 0);
  }, [interactionCount, errorCount, hesitationCount, cognitiveMetrics.timeToFirstAction]);

  // Auto-enable voice guidance when cognitive load is high
  useEffect(() => {
    if ((cognitiveMetrics.cognitiveLoadLevel === 'HIGH') && !micActive) {
      // small delay so UI can settle
      setTimeout(() => startRecognition(), 400);
    }
  }, [cognitiveMetrics.cognitiveLoadLevel, micActive, startRecognition]);

  // Listen for external error events (e.g. invalid phone input from AuthScreen)
  useEffect(() => {
    const onInvalidPhone = () => setErrorCount(prev => prev + 1);
    const onModeSelected = () => {
      setInteractionCount(prev => prev + 1);
      lastInteractionRef.current = Date.now();
    };
    const onStart = () => {
      setInteractionCount(prev => prev + 1);
      lastInteractionRef.current = Date.now();
    };
    const onVoiceCmd = (e) => {
      const text = (e && e.detail) || '';
      if (text) handleVoiceCommand(text);
    };
    window.addEventListener('voltcharge-invalid-phone', onInvalidPhone);
    window.addEventListener('voltcharge-mode-selected', onModeSelected);
    window.addEventListener('voltcharge-start', onStart);
    window.addEventListener('voltcharge-voice-cmd', onVoiceCmd);
    return () => {
      window.removeEventListener('voltcharge-invalid-phone', onInvalidPhone);
      window.removeEventListener('voltcharge-mode-selected', onModeSelected);
      window.removeEventListener('voltcharge-start', onStart);
      window.removeEventListener('voltcharge-voice-cmd', onVoiceCmd);
    };
  }, [handleVoiceCommand]);

  // Admin metrics shortcut: Shift + A
  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        setShowAdminPanel(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full max-w-4xl mx-auto">
      
      {/* MODE INDICATOR - TOP */}
      <div className={`absolute top-24 left-0 right-0 mx-auto w-fit px-6 py-2 rounded-full border-2 font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
        mode === 'fast' 
          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
          : 'border-green-500 bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
      }`}>
        <Zap size={14} />
        {mode === 'fast' ? 'FAST CHARGE MODE' : 'NORMAL CHARGE MODE'}
        <span className={`ml-4 text-xs ${userMode === 'ELDERLY' ? 'text-white' : 'text-slate-400'}`}>Cognitive Mode: {cognitiveMetrics.cognitiveLoadLevel === 'HIGH' ? 'SIMPLE' : (cognitiveMetrics.cognitiveLoadLevel === 'LOW' ? 'ADVANCED' : 'NORMAL')}</span>
      </div>

      {/* EMERGENCY STOP CONFIRMATION */}
      <AnimatePresence>
        {showEmergencyConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <Card className="text-center border-red-600 w-96">
              <h2 className="mb-4 text-2xl font-bold text-red-500">⚠️ Emergency Stop</h2>
              <p className="mb-6 text-slate-400">Are you sure you want to stop charging immediately?</p>
              <div className="space-y-3">
                <Button onClick={confirmEmergencyStop} variant="danger">YES, STOP NOW</Button>
                <Button onClick={() => { setShowEmergencyConfirm(false); setErrorCount(prev => prev + 1); recordInteraction('emergency_cancel'); }} variant="secondary">CANCEL</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Metrics Panel (hidden, Shift+A) */}
      {showAdminPanel && (
        <div className="fixed w-64 p-4 text-sm border rounded-lg top-20 right-8 z-60 bg-volt-navy/90 border-white/10">
          <div className="mb-2 font-bold">Research Metrics</div>
          <div className="mb-2 text-xs text-slate-400">Total task time: <span className="float-right font-mono">{startTime ? Math.floor((nowTick - startTime)/1000) : 0}s</span></div>
          <div className="mb-2 text-xs text-slate-400">Errors: <span className="float-right font-mono">{errorCount}</span></div>
          <div className="mb-2 text-xs text-slate-400">Interactions: <span className="float-right font-mono">{interactionCount}</span></div>
          <div className="text-xs text-slate-400">Final Cognitive Load: <span className="float-right font-mono">{cognitiveMetrics.cognitiveLoadLevel}</span></div>
        </div>
      )}
      
      {/* 80% Modal Overlay */}
      <AnimatePresence>
        {show80Modal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <Card className="text-center w-96 border-volt-cyan">
              <h2 className="mb-4 text-2xl font-bold">80% Limit Reached</h2>
              <p className="mb-6 text-slate-400">Charging slowed to protect battery health.</p>
              <div className="space-y-3">
                <Button onClick={() => { setShow80Modal(false); setIsPaused(false); recordInteraction('continue_80'); }}>CONTINUE TO 100%</Button>
                <Button variant="danger" onClick={() => { recordInteraction('stop_80_modal'); handleSessionComplete('user_stop'); }}>STOP NOW</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Ring - MODE ADAPTIVE */}
      <div className={`relative flex items-center justify-center ${userMode === 'ELDERLY' ? 'w-96 h-96 mb-12' : (userMode === 'EXPERT' ? 'w-72 h-72 mb-6' : 'w-80 h-80 mb-8')}`}>
        <svg className="w-full h-full -rotate-90">
          <circle cx={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)} cy={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)} r={userMode === 'ELDERLY' ? 160 : (userMode === 'EXPERT' ? 120 : 140)} stroke="#0f172a" strokeWidth="12" fill="none" />
          <circle 
            cx={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)} 
            cy={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)} 
            r={userMode === 'ELDERLY' ? 160 : (userMode === 'EXPERT' ? 120 : 140)} 
            stroke="#22d3ee" strokeWidth="12" fill="none"
            strokeDasharray={userMode === 'ELDERLY' ? 1005 : (userMode === 'EXPERT' ? 753.98 : 879.6)}
            strokeDashoffset={userMode === 'ELDERLY' ? 1005 - (1005 * progress) / 100 : (userMode === 'EXPERT' ? 753.98 - (753.98 * progress) / 100 : 879.6 - (879.6 * progress) / 100)}
            strokeLinecap="round"
            className="drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-300"
          />
        </svg>
        <div className="absolute text-center">
          <span className={`font-bold font-mono block ${userMode === 'ELDERLY' ? 'text-8xl' : (userMode === 'EXPERT' ? 'text-5xl' : 'text-7xl')}`}>{Math.floor(progress)}<span className={userMode === 'ELDERLY' ? 'text-4xl' : 'text-2xl'}>%</span></span>
          <span className={`uppercase tracking-widest text-volt-cyan ${userMode === 'ELDERLY' ? 'text-lg' : (userMode === 'EXPERT' ? 'text-xs' : 'text-sm')} animate-pulse`}>
            {userMode === 'GUIDED' ? 'Charging...' : (userMode === 'ELDERLY' ? 'CHARGING IN PROGRESS' : 'Charging')}
          </span>
        </div>
      </div>

      {userMode !== 'EXPERT' && (
        <div className={`bg-volt-navy/50 px-4 py-2 rounded-full border border-white/5 mb-8 flex items-center gap-2 ${userMode === 'ELDERLY' ? 'px-6 py-3' : ''}`}>
          <motion.div 
            animate={hapticTriggered ? { scale: [1, 1.3, 0.9, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.6)] ${hapticTriggered ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-volt-cyan'}`}
          ></motion.div>
          <span className={`text-slate-400 ${userMode === 'ELDERLY' ? 'text-base' : 'text-xs'}`}>Haptic Feedback Active</span>
        </div>
      )}

      {/* Linear Bar */}
      {userMode !== 'EXPERT' && (
        <>
          <div className={`w-full max-w-xl ${userMode === 'ELDERLY' ? 'h-4' : 'h-2'} bg-slate-800 rounded-full ${userMode === 'ELDERLY' ? 'mb-4' : 'mb-2'} overflow-hidden`}>
            <div className="h-full bg-volt-cyan" style={{ width: `${progress}%` }}></div>
          </div>
          <div className={`w-full max-w-xl flex justify-between text-slate-500 ${userMode === 'ELDERLY' ? 'text-lg mb-16' : 'text-xs mb-12'}`}>
            <span>Battery Level</span>
            <span>{Math.floor(progress)} / 100 kWh</span>
          </div>
        </>
      )}

      {/* Stats Grid - show advanced stats only for EXPERT or when cognitive load is LOW */}
      {(userMode === 'EXPERT' || cognitiveMetrics.cognitiveLoadLevel === 'LOW') && (
        <div className="grid w-full grid-cols-3 gap-4 mb-8">
          <Card className="flex flex-col items-center py-4">
            <Clock size={20} className="mb-2 text-volt-cyan" />
            <span className="font-mono text-xl font-bold">{Math.max(0, Math.floor((100 - progress) * 0.5))} min</span>
            <span className="text-[10px] text-slate-500 uppercase">Remaining</span>
          </Card>
          <Card className="flex flex-col items-center py-4">
            <Zap size={20} className="mb-2 text-volt-green" />
            <span className="font-mono text-xl font-bold">{mode === 'fast' ? '150' : '50'} kW</span>
            <span className="text-[10px] text-slate-500 uppercase">Power</span>
          </Card>
          <Card className="flex flex-col items-center py-4">
            <span className="text-lg font-bold text-volt-cyan">$</span>
            <span className="font-mono text-xl font-bold">{(progress * 0.45).toFixed(2)}</span>
            <span className="text-[10px] text-slate-500 uppercase">Cost</span>
          </Card>
        </div>
      )}

      {/* SAFETY FEATURES PANEL */}
      <div className="w-full max-w-3xl p-6 mb-8 border bg-volt-navy/40 border-white/5 rounded-2xl">
        <h3 className="mb-4 text-sm font-bold tracking-widest uppercase text-slate-300">Safety Features</h3>
        
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
          {/* Over Voltage Warning Card */}
          <motion.div 
            className={`p-4 rounded-lg border-2 transition-all ${
              overVoltageWarning
                ? 'border-red-600 bg-red-950/30 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                : 'border-green-600 bg-green-950/20'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">{overVoltageWarning ? '⚠️ Over Voltage' : '✓ Voltage Safe'}</span>
              <span className={`text-xs font-mono ${overVoltageWarning ? 'text-red-400' : 'text-green-400'}`}>
                {overVoltageWarning ? '420V' : '400V'}
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              {overVoltageWarning ? 'Over voltage detected. Charging paused.' : 'Voltage within safe limits'}
            </p>
            {overVoltageWarning && (
              <Button onClick={resetOverVoltageWarning} variant="secondary" className="py-2 text-xs">
                Reset
              </Button>
            )}
          </motion.div>

          {/* Child Lock Toggle */}
          <div className="flex flex-col justify-between p-4 border-2 rounded-lg border-white/10 bg-volt-navy/20">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">Child Lock Mode</span>
                {childLockEnabled && <Lock size={16} className="text-yellow-500" />}
              </div>
              <p className="mb-3 text-xs text-slate-400">
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
          className={`w-full ${cognitiveMetrics.cognitiveLoadLevel === 'HIGH' ? 'py-6 text-2xl' : 'py-4'} rounded-xl font-bold text-white uppercase tracking-wider transition-all ${
            childLockEnabled
              ? 'bg-slate-700/30 border-2 border-slate-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-red-800 to-red-600 border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]'
          }`}
        >
          🛑 Emergency Stop
        </motion.button>
      </div>

      <Button
        variant="danger"
        onClick={() => { recordInteraction('stop_button'); handleSessionComplete('user_stop'); }}
        className={`w-full max-w-md ${userMode === 'ELDERLY' ? 'py-6 text-3xl' : (userMode === 'GUIDED' ? 'py-6 text-2xl' : (cognitiveMetrics.cognitiveLoadLevel === 'HIGH' ? 'py-6 text-2xl' : ''))}`}
        disabled={childLockEnabled}
      >
        {userMode === 'ELDERLY' ? '🛑 STOP' : 'STOP CHARGING'}
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
            className="fixed px-4 py-2 text-sm border rounded-lg bottom-40 right-8 bg-volt-navy/80 border-white/5"
          >
            {voiceMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microphone Button - bottom-right */}
      <div className="fixed z-50 bottom-8 right-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { micActive ? stopRecognition() : startRecognition(); }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${micActive ? 'bg-volt-cyan/90 shadow-[0_0_30px_rgba(34,211,238,0.6)] animate-pulse' : 'bg-volt-navy/80 border border-white/5'}`}
          title="Tap to use voice commands"
        >
          <div className="text-2xl">🎤</div>
        </motion.button>
        <div className="mt-2 text-xs text-center text-slate-400">Tap to use voice commands</div>
      </div>
    </div>
  );
};

// 5. ERROR SCREEN - CONNECTOR ERROR
const ErrorScreen = ({ onRetry, onHome }) => {
  const { incrementHelp } = useCognitive();
  useEffect(() => {
    triggerHaptic([100, 50, 100, 50, 100, 50, 100]);
    speak("Connection error. Connector not detected.");
    beep(300);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ scale: [1, 1.1, 0.95, 1.05, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-volt-red flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.6)]"
      >
        <AlertTriangle size={48} className="text-volt-red animate-pulse" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-volt-red">⚠️ Connector Error</h2>
      <p className="mb-8 text-lg text-slate-300">Connector not detected. Please reconnect cable.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 rounded-lg bg-red-950/40 border-volt-red">
        <h3 className="mb-3 font-bold text-volt-red">Error Code: E-CCS-001</h3>
        <div className="space-y-2 text-sm text-slate-300">
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

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">🔌 Check Cable Connection</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <ArrowRight className="rotate-180 text-volt-red" size={28} />
        </motion.div>
        <span className="mt-4 text-xs text-center text-slate-400">Remove and reconnect the cable firmly until you hear a click</span>
      </div>

      <div className="flex w-full gap-4">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Connection</Button>
        <Button
          onClick={() => {
            incrementHelp();
            onHome();
          }}
          variant="secondary"
          className="flex-1"
        >
          Help
        </Button>
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
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-orange-950 border-2 border-orange-500 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(249,115,22,0.4)]"
      >
        <Wifi size={48} className="text-orange-400" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-orange-400">🌐 Network Error</h2>
      <p className="mb-8 text-lg text-slate-300">Network unavailable. Please wait or try again.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-orange-500 rounded-lg bg-orange-950/40">
        <h3 className="mb-3 font-bold text-orange-400">Error Code: E-NET-001</h3>
        <div className="space-y-2 text-sm text-slate-300">
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

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">⏳ Retrying in a moment...</span>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Wifi className="text-orange-400" size={28} />
        </motion.div>
      </div>

      <div className="flex w-full gap-4">
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
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-orange-950 border-2 border-orange-600 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(234,88,12,0.6)]"
      >
        <AlertTriangle size={48} className="text-orange-500" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-orange-500">🔥 Battery Overheat</h2>
      <p className="mb-8 text-lg text-slate-300">Battery temperature high. Charging paused for safety.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-orange-600 rounded-lg bg-orange-950/40">
        <h3 className="mb-3 font-bold text-orange-500">Error Code: E-THERM-001</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-3 p-3 rounded bg-black/30">
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

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">🔌 Allow Battery to Cool</span>
        <div className="text-xs text-center text-slate-400">
          Move vehicle to a shaded area or wait 15-20 minutes before resuming
        </div>
      </div>

      <div className="flex w-full gap-4">
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
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-red-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
      >
        <X size={48} className="text-red-500" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-red-500">💳 Payment Failed</h2>
      <p className="mb-8 text-lg text-slate-300">Payment failed. Try another method.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-red-600 rounded-lg bg-red-950/40">
        <h3 className="mb-3 font-bold text-red-500">Error Code: E-PAY-001</h3>
        <div className="space-y-2 text-sm text-slate-300">
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

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-3 text-sm font-bold">💰 Try Another Payment Method</span>
        <div className="text-xs text-center text-slate-400">
          Use a different card, Apple Pay, or Google Pay to complete the transaction
        </div>
      </div>

      <div className="flex w-full gap-4">
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
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-red-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
      >
        <AlertTriangle size={48} className="text-red-500" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-red-500">⚠️ Charging Interrupted</h2>
      <p className="mb-8 text-lg text-slate-300">Power connection lost during charging</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-red-600 rounded-lg bg-red-950/40">
        <h3 className="mb-3 font-bold text-red-500">Error Code: E-PWR-002</h3>
        <div className="space-y-2 text-sm text-slate-300">
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

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">🔌 Reconnect and Retry</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <ArrowRight className="text-red-500 rotate-180" size={28} />
        </motion.div>
        <span className="mt-4 text-xs text-center text-slate-400">Ensure cable is firmly connected before retrying</span>
      </div>

      <div className="flex w-full gap-4">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Charging</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// 6. PAYMENT / COMPLETE
const PaymentScreen = ({ onHome, userMode }) => {
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

  const [sessionSummary, setSessionSummary] = useState(null);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('voltcharge-session'));
      setTimeout(() => setSessionSummary(s), 0);
    } catch (e) { void e; }
  }, []);

  const titleSize = userMode === 'ELDERLY' ? 'text-5xl' : (userMode === 'GUIDED' ? 'text-4xl' : 'text-3xl');
  const textSize = userMode === 'ELDERLY' ? 'text-2xl' : (userMode === 'GUIDED' ? 'text-lg' : 'text-base');
  const spacing = userMode === 'ELDERLY' ? 'gap-8' : (userMode === 'GUIDED' ? 'gap-6' : 'gap-4');
  
  return (
    <div className={`flex flex-col h-full items-center justify-center max-w-2xl mx-auto w-full text-center ${spacing}`}>
      <motion.div 
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        transition={{ type: 'spring', stiffness: 80 }}
        className={`rounded-full bg-volt-green/20 border border-volt-green flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] ${userMode === 'ELDERLY' ? 'w-40 h-40' : (userMode === 'GUIDED' ? 'w-32 h-32' : 'w-24 h-24')}`}
      >
        <CheckCircle2 size={userMode === 'ELDERLY' ? 80 : (userMode === 'GUIDED' ? 60 : 48)} className="text-volt-green" />
      </motion.div>
      
      <div>
        <h2 className={`${titleSize} font-bold mb-2`}>
          {userMode === 'GUIDED' ? 'Charging Complete!' : 'Charging Completed'}
        </h2>
        <p className={`text-volt-green font-semibold ${textSize}`}>Payment Successful</p>
      </div>

      <Card className={`w-full ${userMode === 'ELDERLY' ? 'p-8' : (userMode === 'GUIDED' ? 'p-6' : 'p-4')}`}>
        <div className={`flex justify-between ${userMode === 'ELDERLY' ? 'py-4 text-2xl' : (userMode === 'GUIDED' ? 'py-3 text-lg' : 'py-2')} border-b border-white/10`}>
          <span className="text-slate-400">Total Energy</span>
          <span className="font-mono font-bold">42.5 kWh</span>
        </div>
        <div className={`flex justify-between ${userMode === 'ELDERLY' ? 'py-4 text-2xl' : (userMode === 'GUIDED' ? 'py-3 text-lg' : 'py-2')} border-b border-white/10`}>
          <span className="text-slate-400">Duration</span>
          <span className="font-mono font-bold">35 min</span>
        </div>
        <div className={`flex justify-between ${userMode === 'ELDERLY' ? 'py-6 text-4xl' : (userMode === 'GUIDED' ? 'py-4 text-2xl' : 'py-3 text-xl')} text-volt-cyan font-bold`}>
          <span>Total Paid</span>
          <span>$19.12</span>
        </div>
      </Card>

      <div className={`flex gap-4 w-full max-w-md flex-col md:flex-row ${userMode === 'ELDERLY' ? 'gap-6' : ''}`}>
        <Button 
          onClick={downloadReceipt} 
          variant="primary" 
          className={`flex-1 ${userMode === 'ELDERLY' ? 'py-6 text-xl' : (userMode === 'GUIDED' ? 'py-5 text-lg' : '')}`}
        >
          {userMode === 'ELDERLY' ? '📄 RECEIPT' : 'Download Receipt'}
        </Button>
        <Button 
          onClick={onHome} 
          variant="secondary" 
          className={`flex-1 ${userMode === 'ELDERLY' ? 'py-6 text-xl' : (userMode === 'GUIDED' ? 'py-5 text-lg' : '')}`}
        >
          {userMode === 'ELDERLY' ? '🏠 HOME' : 'Return Home'}
        </Button>
      </div>
      
      {userMode !== 'EXPERT' && (
        <div className={`mt-8 w-full max-w-md`}>
          <Card className={userMode === 'ELDERLY' ? 'p-8' : (userMode === 'GUIDED' ? 'p-6' : 'p-4')}>
            <div className={`font-bold mb-4 ${userMode === 'ELDERLY' ? 'text-2xl' : 'text-lg'}`}>Session Details</div>
            <div className={`space-y-3 ${userMode === 'ELDERLY' ? 'text-xl' : (userMode === 'GUIDED' ? 'text-base' : 'text-sm')}`}>
              <div className="flex justify-between text-slate-400">
                <span>Time Taken</span>
                <span className="font-mono font-bold text-white">{sessionSummary?.totalTime ? `${Math.floor(sessionSummary.totalTime/1000)}s` : '--'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Actions</span>
                <span className="font-mono font-bold text-white">{sessionSummary?.interactions ?? '--'}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// 7. HISTORY
const HistoryScreen = ({ onBack, userMode }) => {
  const data = [
    { name: 'Mon', amt: 24 }, { name: 'Tue', amt: 13 },
    { name: 'Wed', amt: 38 }, { name: 'Thu', amt: 20 },
    { name: 'Fri', amt: 45 }, { name: 'Sat', amt: 30 }, { name: 'Sun', amt: 15 },
  ];

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : (userMode === 'EXPERT' ? 'text-sm compact-layout' : ''));
  return (
    <div className={`flex flex-col h-full p-4 max-w-4xl mx-auto w-full ${modeClasses}`}>
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
          <div key={i} className="flex items-center justify-between p-4 border bg-volt-navy/40 rounded-xl border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-volt-cyan/10">
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
  const [userMode, setUserMode] = useState('STANDARD'); // STANDARD | GUIDED | ELDERLY | EXPERT
  const [mobileNumber, setMobileNumber] = useState('');
  const voice = useVoiceCommands();
  const prevScreenRef = useRef(null);

  const decideUserMode = (firstTime, interactionTime) => {
    // silent background decision
    if (firstTime) {
      setUserMode('GUIDED');
      return;
    }
    if ((interactionTime || 0) > 5000) {
      setUserMode('ELDERLY');
    } else {
      setUserMode('EXPERT');
    }
  };

  // Global voice command mapping (basic router) - listens for dispatched transcripts
  useEffect(() => {
    const onVoiceCmd = (e) => {
      const text = (e && e.detail || '').toString().toLowerCase();
      if (!text) return;
      if (text.includes('start charging')) {
        // go to mode select / start flow
        setScreen(prev => (prev === 'home' ? 'mode-select' : prev));
      } else if (text.includes('stop charging')) {
        try { window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'stop_charging' })); } catch (err) { void err; }
      } else if (text.includes('go back')) {
        setScreen(prevScreenRef.current || 'home');
      } else if (text.includes('confirm')) {
        try { window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'confirm' })); } catch (err) { void err; }
      } else if (text.includes('enter mobile')) {
        setScreen('auth');
        try { window.dispatchEvent(new CustomEvent('voltcharge-focus-mobile')); } catch (err) { void err; }
      } else if (text.includes('clear')) {
        try { window.dispatchEvent(new CustomEvent('voltcharge-clear-mobile')); } catch (err) { void err; }
      }
    };
    window.addEventListener('voltcharge-voice-cmd', onVoiceCmd);
    return () => window.removeEventListener('voltcharge-voice-cmd', onVoiceCmd);
  }, []);

  const renderScreen = () => {
    switch(screen) {
      case 'home': return (
        <HomeScreen 
          onNext={() => setScreen('auth')} 
          onHistory={() => setScreen('history')}
          decideUserMode={decideUserMode}
          voice={voice}
          userMode={userMode}
        />
      );
      case 'mode-select': return (
      <ChargingModeScreen 
        onFastCharge={() => { setChargingMode('fast'); setScreen('auth'); }}
        onNormalCharge={() => { setChargingMode('normal'); setScreen('auth'); }}
        userMode={userMode}
        />
      );
      case 'auth': return <AuthScreen onNext={(mobile, mode) => { setMobileNumber(mobile); setChargingMode(mode || 'normal'); setScreen(mobile ? 'otp' : 'cable-connect'); }} voice={voice} userMode={userMode} />;
      case 'otp': return <OTPScreen onNext={() => setScreen('cable-connect')} voice={voice} userMode={userMode} mobile={mobileNumber} />;
      case 'cable-connect': return <CableConnectionScreen onNext={() => setScreen('charging')} userMode={userMode} />;
      case 'charging': return <ChargingScreen mode={chargingMode} onComplete={() => setScreen('payment')} onError={() => { prevScreenRef.current = 'charging'; setScreen('charging-error'); }} voice={voice} userMode={userMode} />;
      case 'error': return <ErrorScreen onRetry={() => setScreen('connect')} onHome={() => setScreen('home')} />;
      case 'network-error': return <NetworkErrorScreen onRetry={() => setScreen('connect')} onHome={() => setScreen('home')} />;
      case 'overheat-error': return <OverheatErrorScreen onRetry={() => setScreen('charging')} onHome={() => setScreen('home')} />;
      case 'payment-error': return <PaymentErrorScreen onRetry={() => setScreen('auth')} onHome={() => setScreen('home')} />;
      case 'charging-error': return <ChargingErrorScreen onRetry={() => setScreen('charging')} onHome={() => setScreen('home')} />;
      case 'payment': return <PaymentScreen onHome={() => setScreen('home')} userMode={userMode} />;
      case 'history': return <HistoryScreen onBack={() => setScreen('home')} userMode={userMode} />;
      default: return <HomeScreen onNext={() => setScreen('auth')} onHistory={() => setScreen('history')} decideUserMode={decideUserMode} voice={voice} userMode={userMode} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-white bg-hexagon">
      <Header voice={voice} />
      <div className="flex-1 px-4 pt-20 pb-8 overflow-x-hidden overflow-y-auto">
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