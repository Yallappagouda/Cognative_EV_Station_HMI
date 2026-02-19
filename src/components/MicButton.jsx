import React from 'react';

export default function MicButton({ voice }) {
  if (!voice) return null;

  const toggle = () => {
    if (voice.micActive) {
      voice.stopListening();
    } else {
      // default: listen for general commands and re-dispatch as event
      voice.startListening('commands', (transcript) => {
        try { window.dispatchEvent(new CustomEvent('voltcharge-voice-cmd', { detail: transcript })); } catch (e) { void e; }
      });
    }
  };

  return (
    <button onClick={toggle} title="Voice Commands" className={`px-3 py-2 rounded-md ${voice.micActive ? 'bg-volt-cyan/80 text-black' : 'bg-volt-navy/60 text-white'} border border-white/10`}>🎤</button>
  );
}
