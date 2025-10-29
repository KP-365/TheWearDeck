import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import OutfitCard from '../components/OutfitCard';

export default function SuggestFit() {
  const [query, setQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:8000/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      setUploadedImage(result.image_url);
      
      // Get recommendations based on uploaded image
      await getRecommendations(result.image_url);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (imageUrl = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/recommend', {
        query: query || undefined,
        image_url: imageUrl || undefined
      }, token);

      setRecommendations(response.recommendations || []);
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSearch = () => {
    if (query.trim()) {
      getRecommendations();
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Suggest Fit</h1>
          <p className="mt-2 text-gray-600">
            Upload an image or describe what you're looking for
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-4">📸</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {loading ? 'Uploading...' : 'Click to upload an image'}
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>
            
            {uploadedImage && (
              <div className="mt-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                />
              </div>
            )}
          </div>

          {/* Text Search Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Or Describe What You Want</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., casual summer outfit, formal business wear, streetwear..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
              />
              <button
                onClick={handleTextSearch}
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((outfit, index) => (
                  <OutfitCard
                    key={index}
                    outfit={outfit}
                    onAction={(action, outfitId) => {
                      // Handle outfit actions (like, skip, shop)
                      console.log(`${action} outfit ${outfitId}`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {loading && recommendations.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">Getting recommendations...</div>
            </div>
          )}

          {!loading && recommendations.length === 0 && !error && (
            <div className="text-center py-8">
              <div className="text-gray-500">Upload an image or enter a description to get started</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


