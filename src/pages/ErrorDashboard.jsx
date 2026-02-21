import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Plug,
    CreditCard,
    Signal,
    Battery,
    Gauge,
    AlertOctagon,
    XCircle,
    CheckCircle2
} from 'lucide-react';

const ErrorCard = ({ icon: Icon, title, reasons, donts, solution, colorClass }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`p-6 rounded-3xl border border-white/10 bg-volt-navy/40 backdrop-blur-md flex flex-col h-full shadow-lg ${colorClass}`}
    >
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/5 text-white">
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        <div className="flex-1 space-y-4">
            <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Possible Reasons</p>
                <ul className="space-y-1">
                    {reasons.map((r, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-volt-cyan">•</span> {r}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-2 flex items-center gap-1">
                    <XCircle size={12} /> Do NOT Do These
                </p>
                <ul className="space-y-1">
                    {donts.map((d, i) => (
                        <li key={i} className="text-xs text-red-300">❌ {d}</li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-volt-green font-bold mb-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> Solution / System Response
            </p>
            <p className="text-sm text-volt-green font-medium">{solution}</p>
        </div>
    </motion.div>
);

const ErrorDashboard = () => {
    const navigate = useNavigate();

    const errors = [
        {
            icon: Plug,
            title: "1. Charging Not Starting",
            reasons: ["Cable not properly inserted", "Authentication incomplete", "Connector not locked"],
            donts: ["Do not force insert cable", "Do not unplug repeatedly", "Do not restart system immediately"],
            solution: "“Please unplug and reconnect the charging cable firmly until you hear a click.”",
            colorClass: "hover:border-blue-500/50"
        },
        {
            icon: CreditCard,
            title: "2. Authentication Failed",
            reasons: ["Invalid mobile number", "NFC card not detected", "Network delay"],
            donts: ["Do not enter random numbers", "Do not tap card too fast", "Do not close the screen"],
            solution: "“Please re-enter your mobile number or tap your card again slowly.”",
            colorClass: "hover:border-red-500/50"
        },
        {
            icon: Signal,
            title: "3. Network Connection Issue",
            reasons: ["Poor internet connectivity", "Server timeout"],
            donts: ["Do not refresh multiple times", "Do not disconnect cable immediately"],
            solution: "“Network unstable. Please wait a moment or try again.”",
            colorClass: "hover:border-orange-500/50"
        },
        {
            icon: Battery,
            title: "4. Charging Stopped Automatically",
            reasons: ["Battery reached 80%", "Vehicle stopped requesting power", "Power fluctuation detected"],
            donts: ["Do not panic", "Do not unplug without checking status"],
            solution: "“Charging paused. You may resume or safely disconnect.”",
            colorClass: "hover:border-green-500/50"
        },
        {
            icon: Gauge,
            title: "5. Low Charging Speed",
            reasons: ["Vehicle limits input power", "Battery temperature high", "Grid load balancing active"],
            donts: ["Do not assume charger malfunction", "Do not restart repeatedly"],
            solution: "“Charging speed depends on vehicle and battery condition.”",
            colorClass: "hover:border-purple-500/50"
        },
        {
            icon: AlertOctagon,
            title: "6. Emergency Stop Activated",
            reasons: ["Emergency button pressed", "Safety sensor triggered"],
            donts: ["Do not attempt charging immediately", "Do not ignore safety indicators"],
            solution: "“Please reset the emergency switch before restarting.”",
            colorClass: "hover:border-red-600/50 shadow-red-900/10"
        }
    ];

    return (
        <div className="min-h-screen bg-transparent text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-glow mb-2">Help & Error Dashboard</h1>
                        <p className="text-slate-400">Troubleshooting guide for common charging issues</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, x: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 px-8 py-4 bg-volt-navy border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-volt-cyan font-bold uppercase tracking-widest text-sm"
                    >
                        <ArrowLeft size={20} /> Back to Home
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {errors.map((error, index) => (
                        <ErrorCard key={index} {...error} />
                    ))}
                </div>

                <div className="mt-16 p-8 rounded-3xl border border-volt-cyan/20 bg-volt-cyan/5 text-center">
                    <p className="text-slate-300">Still having issues? Contact support at <span className="text-volt-cyan font-bold">1-800-VOLT-HELP</span></p>
                </div>
            </div>
        </div>
    );
};

export default ErrorDashboard;
