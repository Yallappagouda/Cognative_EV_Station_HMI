import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

const SmsDashboard = ({ batteryLevel }) => {
    const messages = [
        { id: 1, text: "📱 Welcome to EV Charging Station.", time: "Just now" },
        { id: 2, text: "Charging has started successfully.", time: "Just now" },
        { id: 3, text: `Current battery level: ${Math.floor(batteryLevel)}%.`, time: "Just now" },
        { id: 4, text: "Estimated completion time: 40 minutes.", time: "Just now" },
        { id: 5, text: "You will receive a message when charging finishes.", time: "Just now" },
    ];

    if (batteryLevel < 20) {
        messages.push({
            id: 6,
            text: `⚠ Your battery level is ${Math.floor(batteryLevel)}%. Fast charging is activated to save time. Please stay near the station.`,
            time: "Now",
            urgent: true
        });
    }

    return (
        <div className="w-full max-w-sm bg-slate-900/90 rounded-3xl p-4 border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                <div className="w-10 h-10 rounded-full bg-volt-cyan/20 flex items-center justify-center text-volt-cyan">
                    <Smartphone size={20} />
                </div>
                <div>
                    <div className="text-sm font-bold text-white">VoltCharge Alerts</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Mobile Notifications</div>
                </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {messages.map(msg => (
                    <motion.div
                        key={msg.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`p-3 rounded-2xl text-sm ${msg.urgent ? 'bg-red-500/10 border border-red-500/20 text-red-200' : 'bg-white/5 text-slate-300'}`}
                    >
                        {msg.text}
                        <div className="text-[10px] mt-1 opacity-50 text-right">{msg.time}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default SmsDashboard;
