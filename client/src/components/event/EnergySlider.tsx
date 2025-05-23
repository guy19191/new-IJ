import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Moon } from 'lucide-react';

interface EnergySliderProps {
  value: number;
  onChange: (value: number) => void;
  isHost: boolean;
}

const EnergySlider: React.FC<EnergySliderProps> = ({ value, onChange, isHost }) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
  };
  
  const handleChangeCommitted = () => {
    onChange(localValue);
  };
  
  // Determine energy level label and color
  const getEnergyLabel = () => {
    if (localValue > 80) return { text: 'Intense', color: 'text-neon-magenta' };
    if (localValue > 60) return { text: 'Energetic', color: 'text-neon-purple' };
    if (localValue > 40) return { text: 'Balanced', color: 'text-neon-cyan' };
    if (localValue > 20) return { text: 'Relaxed', color: 'text-blue-400' };
    return { text: 'Chill', color: 'text-blue-600' };
  };
  
  const energyLabel = getEnergyLabel();
  
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">Event Energy</h3>
        <motion.span
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`text-sm font-semibold ${energyLabel.color}`}
        >
          {energyLabel.text}
        </motion.span>
      </div>
      
      <div className="flex items-center space-x-4">
        <Moon className="h-4 w-4 text-blue-400" />
        
        <div className="flex-1 relative">
          <div 
            className="absolute left-0 right-0 h-2 -top-0.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-neon-cyan via-neon-purple to-neon-magenta"
            style={{ clipPath: `inset(0 ${100 - localValue}% 0 0)` }}
          ></div>
          
          <input
            type="range"
            min={0}
            max={100}
            value={localValue}
            onChange={handleChange}
            onMouseUp={handleChangeCommitted}
            onTouchEnd={handleChangeCommitted}
            disabled={!isHost}
            className={`
              w-full h-1.5 rounded-full appearance-none cursor-pointer
              bg-dark-700/60
              ${!isHost && 'opacity-75 cursor-default'}
            `}
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />
          
          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: white;
              box-shadow: 0 0 5px rgba(255, 0, 255, 0.7), 0 0 10px rgba(255, 0, 255, 0.5);
              cursor: ${isHost ? 'pointer' : 'default'};
            }
          `}</style>
        </div>
        
        <Zap className="h-4 w-4 text-neon-magenta" />
      </div>
    </div>
  );
};

export default EnergySlider;