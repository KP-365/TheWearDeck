export default function OutfitCard({ outfit, onClick }) {
  const { items = [], total_price, outfit_type } = outfit;

  return (
    <div className="card" onClick={() => onClick(outfit)}>
      {/* 2x2 Grid of Product Images */}
      <div className="grid grid-cols-2 gap-1 aspect-square">
        {items.slice(0, 4).map((item, idx) => (
          <div key={idx} className="relative bg-gray-100">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Fill empty spots with placeholder */}
        {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, idx) => (
          <div key={`empty-${idx}`} className="bg-gray-100" />
        ))}
      </div>

      {/* Outfit Info */}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
          {outfit_type || 'Outfit'}
        </p>
        <p className="text-xl font-bold">
          ${typeof total_price === 'number' ? total_price.toFixed(2) : '0.00'}
        </p>
      </div>
    </div>
  );
}
