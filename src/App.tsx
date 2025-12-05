import { AppShell } from '@/components/layout/AppShell';
import { SearchPage } from '@/features/search/SearchPage';
import { PlayerOverlay } from '@/features/player/PlayerOverlay';
import { FavoritesDrawer } from '@/features/favorites/FavoritesDrawer';
import { PreviewPlayer } from '@/features/player/PreviewPlayer'; // Added import
import { usePlayerStore } from '@/store/usePlayerStore';

function App() {
  const { currentTrack, isFavoritesOpen, toggleFavorites } = usePlayerStore();

  return (
    <>
      <AppShell>
        <SearchPage />
      </AppShell>

      {currentTrack && <PlayerOverlay />}
      <PreviewPlayer /> {/* Added component */}

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={toggleFavorites}
      />
    </>
  );
}

export default App;
