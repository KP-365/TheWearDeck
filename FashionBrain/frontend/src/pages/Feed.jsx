import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import OutfitCard from '../components/OutfitCard';
import OutfitModal from '../components/OutfitModal';

export default function Feed() {
  const [outfits, setOutfits] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { user, token, signout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check both context token and localStorage to handle immediate navigation after login
    const localToken = localStorage.getItem('token');
    const authToken = token || localToken;
    
    if (!authToken) {
      navigate('/login');
      return;
    }
    
    fetchOutfits();
  }, [token, navigate]);

  const fetchOutfits = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const authToken = token || localStorage.getItem('token');
      const data = await api.get('/feed?num_outfits=10', authToken);
      
      if (append) {
        setOutfits(prev => [...prev, ...(data.outfits || [])]);
      } else {
        setOutfits(data.outfits || []);
      }
    } catch (error) {
      console.error('Failed to fetch outfits:', error);
      if (error.status === 401 || error.status === 403) {
        signout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchOutfits(true);
  };

  const handleOutfitAction = (actionType) => {
    console.log(`Outfit ${actionType}ed`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">TheWearDeck</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/suggest')}
                className="text-sm text-gray-600 hover:text-black transition"
              >
                Suggest Fit
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="text-sm text-gray-600 hover:text-black transition"
              >
                Settings
              </button>
              <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
              <button
                onClick={signout}
                className="text-sm text-gray-600 hover:text-black transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Feed Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {outfits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No outfits available yet</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for new recommendations</p>
          </div>
        ) : (
          <>
            {/* Pinterest-style Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfits.map((outfit, idx) => (
                <OutfitCard
                  key={idx}
                  outfit={outfit}
                  onClick={setSelectedOutfit}
                />
              ))}
            </div>

            {/* Load More Button */}
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </span>
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {selectedOutfit && (
        <OutfitModal
          outfit={selectedOutfit}
          onClose={() => setSelectedOutfit(null)}
          onAction={handleOutfitAction}
        />
      )}
    </div>
  );
}
