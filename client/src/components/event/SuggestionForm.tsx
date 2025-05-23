import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, X } from 'lucide-react';

interface SuggestionFormProps {
  onSubmit: (suggestion: string) => boolean;
}

const SuggestionForm: React.FC<SuggestionFormProps> = ({ onSubmit }) => {
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      const success = onSubmit(suggestion);
      
      if (success) {
        setSuggestion('');
        setShowConfirmation(true);
        
        // Hide confirmation message after 3 seconds
        setTimeout(() => {
          setShowConfirmation(false);
        }, 3000);
      }
      
      setIsSubmitting(false);
    }, 600);
  };
  
  return (
    <div className="glass-panel p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Suggest a Song</h3>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Artist - Song Title"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            disabled={isSubmitting}
            className="input-field pl-10 pr-12 w-full"
          />
          <button
            type="submit"
            disabled={!suggestion.trim() || isSubmitting}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full 
                      ${suggestion.trim() && !isSubmitting 
                        ? 'bg-neon-magenta text-white' 
                        : 'bg-dark-700 text-gray-400'}`}
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5"
              >
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <Sparkles size={20} />
            )}
          </button>
        </div>
      </form>
      
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded-md flex items-center justify-between"
          >
            <span className="text-sm text-white">Song suggestion sent!</span>
            <button 
              onClick={() => setShowConfirmation(false)}
              className="p-1 text-white/70 hover:text-white"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestionForm;