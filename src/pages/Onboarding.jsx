import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const STYLE_OPTIONS = [
  'Streetwear', 'Smart Casual', 'Workwear', 'Minimal', 
  'Vintage', 'Bohemian', 'Athletic', 'Formal', 'Casual'
];

const BUDGET_RANGES = [
  { label: '£0 - £50', value: '0-50' },
  { label: '£50 - £100', value: '50-100' },
  { label: '£100 - £200', value: '100-200' },
  { label: '£200 - £500', value: '200-500' },
  { label: '£500+', value: '500+' }
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [inspoImages, setInspoImages] = useState([]);
  const [gender, setGender] = useState('');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [budgetRange, setBudgetRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, token, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setLoading(true);
    setError('');

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('http://localhost:8000/onboarding/inspo-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      setInspoImages(prev => [...prev, ...results]);
    } catch (err) {
      setError('Failed to upload images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStyleToggle = (style) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      // Save all onboarding data
      await api.post('/onboarding/complete', {
        gender,
        preferred_styles: selectedStyles,
        budget_range: budgetRange,
        onboarding_completed: true
      }, token);

      completeOnboarding();
      navigate('/feed');
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
    navigate('/feed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to TheWearDeck!</h1>
          <p className="mt-2 text-gray-600">
            Let's personalize your experience
          </p>
          
          {/* Progress indicator */}
          <div className="mt-6 flex justify-center space-x-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-2 h-2 rounded-full ${
                  stepNum <= step ? 'bg-black' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Inspiration Images */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Upload Inspiration Images</h2>
              <p className="text-gray-600 mb-6">
                Share 3-5 fashion images that inspire you. This helps us recommend outfits you'll love!
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
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
                  {loading ? 'Uploading...' : 'Click to upload images'}
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </label>
            </div>

            {inspoImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {inspoImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img.inspo_image?.image_url}
                      alt={`Inspiration ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleNext}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
              >
                Continue
              </button>
              <button
                onClick={skipOnboarding}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Gender Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">What's your gender?</h2>
              <p className="text-gray-600 mb-6">
                This helps us tailor recommendations to your preferences
              </p>
            </div>

            <div className="space-y-4">
              {['Male', 'Female'].map((option) => (
                <label key={option} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="gender"
                    value={option}
                    checked={gender === option}
                    onChange={(e) => setGender(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">{option}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!gender}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Style Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Style Preferences</h2>
              <p className="text-gray-600 mb-6">
                Select the styles you love (you can choose multiple)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <label key={style} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedStyles.includes(style)}
                    onChange={() => handleStyleToggle(style)}
                    className="mr-2"
                  />
                  <span className="text-sm">{style}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Budget Range */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Budget Range</h2>
              <p className="text-gray-600 mb-6">
                What's your typical budget for outfits?
              </p>
            </div>

            <div className="space-y-3">
              {BUDGET_RANGES.map((range) => (
                <label key={range.value} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="budget"
                    value={range.value}
                    checked={budgetRange === range.value}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">{range.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleCompleteOnboarding}
                disabled={!budgetRange || loading}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
