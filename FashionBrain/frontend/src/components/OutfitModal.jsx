import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export default function OutfitModal({ outfit, onClose, onAction }) {
  const { token } = useAuth();
  const { items = [], total_price, outfit_type } = outfit;

  const handleSave = async () => {
    try {
      const productIds = items.map(item => item.id).join(',');
      await api.post('/action', {
        product_ids: productIds,
        action_type: 'save'
      }, token);
      onAction('save');
      onClose();
    } catch (error) {
      console.error('Failed to save outfit:', error);
    }
  };

  const handleSkip = async () => {
    try {
      const productIds = items.map(item => item.id).join(',');
      await api.post('/action', {
        product_ids: productIds,
        action_type: 'skip'
      }, token);
      onAction('skip');
      onClose();
    } catch (error) {
      console.error('Failed to skip outfit:', error);
    }
  };

  const handleShop = async () => {
    // Open all affiliate links
    items.forEach(item => {
      if (item.affiliate_link) {
        window.open(item.affiliate_link, '_blank');
      }
    });
    
    // Track shop action
    try {
      const productIds = items.map(item => item.id).join(',');
      await api.post('/action', {
        product_ids: productIds,
        action_type: 'shop'
      }, token);
      onAction('shop');
    } catch (error) {
      console.error('Failed to track shop action:', error);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Outfit Type Header */}
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {outfit_type || 'Outfit'}
            </p>
            <h2 className="text-3xl font-bold mt-1">
              ${typeof total_price === 'number' ? total_price.toFixed(2) : '0.00'}
            </h2>
          </div>

          {/* 2x2 Product Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {items.slice(0, 4).map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="text-gray-600">{item.brand}</p>
                  <p className="font-bold mt-1">${parseFloat(item.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSave}
              className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
            >
              <span>❤️</span>
              <span>Save</span>
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
            >
              <span>❌</span>
              <span>Skip</span>
            </button>
          </div>

          {/* Shop Button */}
          <button
            onClick={handleShop}
            className="w-full btn btn-primary py-4 text-lg flex items-center justify-center gap-2"
          >
            <span>🛒</span>
            <span>Shop Outfit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
