import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, ArrowRight, Check } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import { useEventStore } from '../store/eventStore';
import { eventsApi } from '../services/api';

const moodOptions = [
  { id: 'energetic', name: 'Energetic', emoji: '🔥' },
  { id: 'chill', name: 'Chill', emoji: '😌' },
  { id: 'party', name: 'Party', emoji: '🎉' },
  { id: 'romantic', name: 'Romantic', emoji: '💖' },
];

const genreOptions = [
  'Pop', 'Hip-hop', 'Electronic', 'Rock', 'Jazz',
  'Techno', 'House', 'Chill', 'Indie', 'Reggaeton'
];

const eraOptions = ['70s', '80s', '90s', '2000s', '2010s', '2020s', 'Newest', 'all'];

const CreateEvent = () => {
  const navigate = useNavigate();
  const createEvent = useEventStore((state) => state.createEvent);
  
  const [eventName, setEventName] = useState('');
  const [selectedMood, setSelectedMood] = useState('energetic');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCreateEvent = async () => {
    if (!eventName ) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data: event } = await eventsApi.createEvent({
        name: eventName,
        date: new Date().toISOString(),
        mood: selectedMood,
        genres: selectedGenres,
        eras: selectedEras,
        energy: 0.5 // Default energy level
      });
      
      // Update local state
      createEvent({
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        mood: event.mood,
        genres: event.genres,
        eras: event.eras,
        energyLevel: event.energy,
      });
      
      navigate(`/event/${event.id}`);
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-6 neon-gradient">Create Your IJ Event</h1>
      
      <div className="glass-panel p-6 md:p-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-300">
            Event Name
          </label>
          <div className="relative">
            <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              id="eventName"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="My Awesome Party"
              className="input-field pl-10 w-full"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Event Mood
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {moodOptions.map((mood) => (
              <motion.button
                key={mood.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(mood.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border
                ${selectedMood === mood.id 
                  ? 'border-neon-magenta/70 bg-dark-700/80 shadow-[0_0_10px_rgba(255,0,255,0.3)]' 
                  : 'border-white/10 bg-dark-700/40 hover:bg-dark-700/60'}`}
              >
                <span className="text-2xl mb-1">{mood.emoji}</span>
                <span className="text-sm">{mood.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Music Genres
          </label>
          <Listbox value={selectedGenres} onChange={setSelectedGenres} multiple>
            <div className="relative">
              <Listbox.Button className="input-field w-full text-left">
                {selectedGenres.length === 0 ? (
                  <span className="text-gray-400">Select genres...</span>
                ) : (
                  <span className="truncate">
                    {selectedGenres.join(', ')}
                  </span>
                )}
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-dark-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {genreOptions.map((genre) => (
                  <Listbox.Option
                    key={genre}
                    value={genre}
                    className={({ active }) =>
                      `cursor-pointer select-none relative py-2 px-4 ${
                        active ? 'bg-neon-magenta/20' : ''
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center">
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {genre}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-neon-magenta">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Music Eras
          </label>
          <Listbox value={selectedEras} onChange={setSelectedEras} multiple>
            <div className="relative">
              <Listbox.Button className="input-field w-full text-left">
                {selectedEras.length === 0 ? (
                  <span className="text-gray-400">Select eras...</span>
                ) : (
                  <span className="truncate">
                    {selectedEras.join(', ')}
                  </span>
                )}
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-dark-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {eraOptions.map((era) => (
                  <Listbox.Option
                    key={era}
                    value={era}
                    className={({ active }) =>
                      `cursor-pointer select-none relative py-2 px-4 ${
                        active ? 'bg-neon-magenta/20' : ''
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center">
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {era}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-neon-magenta">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateEvent}
          disabled={!eventName || isGenerating}
          className={`neon-button neon-button-gradient w-full flex items-center justify-center space-x-2 ${
            (!eventName) ? 'opacity-70 pointer-events-none' : ''
          }`}
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Creating Event...</span>
            </>
          ) : (
            <>
              <span>Create Event</span>
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CreateEvent;