import React, { useState } from 'react';

const COMMON_FOOD_ITEMS = [
  { id: 'alcohol', name: 'Alcohol (Beer, Wine, Spirits)' },
  { id: 'grapefruit', name: 'Grapefruit / Grapefruit Juice' },
  { id: 'milk', name: 'Milk / Dairy Products' },
  { id: 'vitamin_k_foods', name: 'Vitamin K Foods (Spinach, Kale, Methi)' },
  { id: 'st_johns_wort', name: "St. John's Wort Herbal Supplement" },
  { id: 'calcium_supplements', name: 'Calcium Supplements (Shelcal)' },
  { id: 'iron_supplements', name: 'Iron Tablets / Syrups' },
  { id: 'caffeine', name: 'High Caffeine (Coffee, Energy Drinks)' },
  { id: 'potassium_rich_foods', name: 'Potassium Salt Substitutes / High Bananas' }
];

export default function FoodSupplementInput({ foodItems, onAddFood, onRemoveFood }) {
  const [customItem, setCustomItem] = useState('');

  const handleAdd = (id) => {
    if (!foodItems.includes(id)) {
      onAddFood(id);
    }
  };

  const handleCustomAdd = () => {
    if (customItem.trim() && !foodItems.includes(customItem.trim())) {
      onAddFood(customItem.trim());
      setCustomItem('');
    }
  };

  return (
    <div className="card food-entry-card">
      <div className="card-header">
        <div className="header-icon">🥗</div>
        <div>
          <h3>Food, Drinks & Dietary Supplements</h3>
          <p className="card-subtitle">
            Check interactions with grapefruit, alcohol, dairy, vitamins, calcium, and herbal remedies
          </p>
        </div>
      </div>

      <div className="card-body">
        {/* Preset quick buttons */}
        <div className="food-presets-grid">
          {COMMON_FOOD_ITEMS.map(item => {
            const isSelected = foodItems.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`food-chip ${isSelected ? 'food-chip-selected' : ''}`}
                onClick={() => isSelected ? onRemoveFood(item.id) : handleAdd(item.id)}
              >
                <span>{isSelected ? '✓ ' : '+ '}</span>
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom food / supplement input */}
        <div className="custom-food-row">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomAdd();
              }
            }}
            placeholder="Other food, herbal tea, or supplement..."
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCustomAdd}
            disabled={!customItem.trim()}
          >
            + Add Item
          </button>
        </div>

        {/* Selected food list */}
        {foodItems.length > 0 && (
          <div className="selected-foods-list">
            <span className="chips-label">Active Dietary Factors:</span>
            <div className="chips-flex">
              {foodItems.map(item => {
                const match = COMMON_FOOD_ITEMS.find(f => f.id === item);
                const displayName = match ? match.name : item;
                return (
                  <span key={item} className="chip chip-selected food-active-chip">
                    🍽️ {displayName}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => onRemoveFood(item)}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
