import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../store/eventStore';
import { usersApi } from '../services/api';
import { Crown, CheckCircle, X } from 'lucide-react';

const premiumBenefits = [
  { feature: 'Host Events', free: false, premium: true },
  { feature: 'Unlimited Guests', free: false, premium: true },
  { feature: 'Custom Playlists', free: false, premium: true },
  { feature: 'Suggest Songs', free: true, premium: true },
  { feature: 'Vote on Tracks', free: true, premium: true },
];

const Home = () => {
  const navigate = useNavigate();
  const user = useEventStore((state) => state.user);
  const setUser = useEventStore((state) => state.setUser);
  const [showPremium, setShowPremium] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isHost, setIsHost] = useState(user?.can_host ?? false);
  const [error, setError] = useState<string | null>(null);

  const handleGoPremium = () => setShowPremium(true);
  const handleClosePremium = () => setShowPremium(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setError(null);
    try {
      await usersApi.updateProfile({ can_host: true });
      setUser({
        id: user?.id ?? '',
        name: user?.name ?? '',
        avatar: user?.avatar ?? '',
        provider: user?.provider ?? 'spotify',
        favoriteGenres: user?.favoriteGenres ?? [],
        favoriteEras: user?.favoriteEras ?? [],
        can_host: true,
        email: user?.email ?? '',
      });
      setIsHost(true);
      setShowPremium(false);
    } catch (err: any) {
      setError('Failed to upgrade. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 rounded-2xl flex flex-col items-center shadow-xl"
      >
        <div className="mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon-magenta shadow-lg">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <img src="../../resoureces/icons/lyra.png" alt={user?.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">{user?.name || 'Guest'}</h2>
            <p className="text-gray-400">{user?.email ?? ''}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <button
            className="neon-button neon-button-gradient w-full flex items-center justify-center space-x-2"
            onClick={() => navigate('/guest/connect')}
          >
            <span>Connect to an Event</span>
          </button>
          {!isHost ? (
            <button
              className="neon-button neon-button-gradient w-full flex items-center justify-center space-x-2"
              onClick={handleGoPremium}
            >
              <Crown size={20} />
              <span>Go Premium</span>
            </button>
          ) : (
            <button
              className="neon-button neon-button-gradient w-full flex items-center justify-center space-x-2"
              onClick={() => navigate('/create')}
            >
              <Crown size={20} />
              <span>Create Host Event</span>
            </button>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {showPremium && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-dark-800 rounded-2xl p-8 shadow-2xl max-w-lg w-full relative"
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={handleClosePremium}
              >
                <X size={24} />
              </button>
              <h3 className="text-2xl font-bold neon-gradient mb-4 flex items-center gap-2">
                <Crown size={28} /> Go Premium
              </h3>
              <p className="text-gray-300 mb-6">Unlock all features and become a host!</p>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full text-sm text-left border border-neon-magenta/30 rounded-lg overflow-hidden">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 bg-dark-700 text-white">Feature</th>
                      <th className="px-4 py-2 bg-dark-700 text-white">Free</th>
                      <th className="px-4 py-2 bg-neon-magenta text-white">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumBenefits.map((row) => (
                      <tr key={row.feature}>
                        <td className="px-4 py-2 border-b border-dark-700 text-white">{row.feature}</td>
                        <td className="px-4 py-2 border-b border-dark-700 text-center">
                          {row.free ? <CheckCircle className="text-neon-magenta mx-auto" size={18} /> : <span className="text-gray-500">—</span>}
                        </td>
                        <td className="px-4 py-2 border-b border-dark-700 text-center">
                          {row.premium ? <CheckCircle className="text-neon-magenta mx-auto" size={18} /> : <span className="text-gray-500">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && <div className="text-red-400 mb-2">{error}</div>}
              <button
                className="neon-button neon-button-gradient w-full flex items-center justify-center space-x-2 mt-2"
                onClick={handleUpgrade}
                disabled={isUpgrading}
              >
                {isUpgrading ? 'Upgrading...' : 'Upgrade & Become Host'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home; 