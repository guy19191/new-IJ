// ... (previous imports)
import LyraAvatar from './LyraAvatar';

const GuestView = () => {
  // ... (previous code)

  return (
    <div className="space-y-6">
      {/* ... (previous JSX) */}
      
      {/* Lyra AI Avatar */}
      <LyraAvatar 
        energyLevel={75} 
        isPlaying={true} 
      />
    </div>
  );
};

export default GuestView;