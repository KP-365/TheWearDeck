import { useState, useEffect } from 'react';
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

export default function UserSettings() {
  const [gender, setGender] = useState('');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [budgetRange, setBudgetRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, token } = useAuth();

  useEffect(() => {
    if (user) {
      setGender(user.gender || '');
      setSelectedStyles(user.preferred_styles || []);
      setBudgetRange(user.budget_range || '');
    }
  }, [user]);

  const handleStyleToggle = (style) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/onboarding/complete', {
        gender,
        preferred_styles: selectedStyles,
        budget_range: budgetRange,
        onboarding_completed: true
      }, token);

      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="mt-2 text-gray-600">
            Update your preferences to get better recommendations
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6">
            {success}
          </div>
        )}

        <div className="space-y-8">
          {/* Gender Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Gender</h2>
            <div className="space-y-3">
              {['Male', 'Female'].map((option) => (
                <label key={option} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
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
          </div>

          {/* Style Preferences */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Style Preferences</h2>
            <p className="text-gray-600 mb-4">Select the styles you love (you can choose multiple)</p>
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
          </div>

          {/* Budget Range */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Budget Range</h2>
            <p className="text-gray-600 mb-4">What's your typical budget for outfits?</p>
            <div className="space-y-3">
              {BUDGET_RANGES.map((range) => (
                <label key={range.value} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
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
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


