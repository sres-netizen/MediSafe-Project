import React, { useState, useEffect, useRef } from 'react';
import { searchDrugs, resolveDrug } from '../services/api';

export default function MedicineInput({
  medications,
  onAddMedication,
  onRemoveMedication,
  dosage,
  setDosage
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const containerRef = useRef(null);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions on typing
  useEffect(() => {
    let active = true;
    if (query.trim().length >= 1) {
      searchDrugs(query, 8).then(res => {
        if (active) {
          setSuggestions(res);
          setIsOpen(true);
        }
      });
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    return () => { active = false; };
  }, [query]);

  // Handle adding a medication (resolving brands if needed)
  const handleSelectMed = async (medName) => {
    if (!medName.trim()) return;
    setResolving(true);
    setIsOpen(false);

    try {
      const resolvedList = await resolveDrug(medName);
      if (resolvedList && resolvedList.length > 0) {
        resolvedList.forEach(m => onAddMedication(m));
      } else {
        onAddMedication({
          id: medName.toLowerCase().replace(/\s+/g, '-'),
          genericName: medName,
          resolvedFrom: medName,
          isBrand: false,
          isUnknown: true
        });
      }
    } catch (err) {
      onAddMedication({
        id: medName.toLowerCase(),
        genericName: medName,
        resolvedFrom: medName,
        isBrand: false,
        isUnknown: true
      });
    } finally {
      setQuery('');
      setResolving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectMed(suggestions[0].display);
      } else if (query.trim()) {
        handleSelectMed(query);
      }
    }
  };

  return (
    <div className="card medicine-entry-card" ref={containerRef}>
      <div className="card-header">
        <div className="header-icon">💊</div>
        <div>
          <h3>My Medications</h3>
          <p className="card-subtitle">
            Enter generic or Indian brand names (e.g. <em>Dolo 650, Combiflam, Augmentin, Brufen, Warfarin</em>)
          </p>
        </div>
      </div>

      <div className="card-body">
        {/* Search Input Container */}
        <div className="medicine-autocomplete-wrapper">
          <div className="form-group">
            <label htmlFor="medication-name">Add Medicine (Brand or Generic)</label>
            <div className="input-with-button">
              <input
                type="text"
                id="medication-name"
                data-testid="medication-name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type medicine name (e.g. Dolo 650, Brufen, Warfarin, Aspirin)..."
                autoComplete="off"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSelectMed(query)}
                disabled={!query.trim() || resolving}
              >
                {resolving ? 'Resolving...' : '+ Add'}
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && suggestions.length > 0 && (
            <ul className="autocomplete-dropdown">
              {suggestions.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  className="autocomplete-item"
                  onClick={() => handleSelectMed(item.display)}
                >
                  <div className="item-title">
                    <span className="item-name">{item.display}</span>
                    {item.isBrand && <span className="badge-brand">Indian Brand</span>}
                  </div>
                  <span className="item-subtitle">{item.subtitle}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Optional Dosage Instructions (Preserves TC05 test ID) */}
        <div className="form-group dosage-group">
          <label htmlFor="dosage">General Regimen / Dosage Note (Optional)</label>
          <input
            type="text"
            id="dosage"
            data-testid="dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 5mg daily, or 500mg twice daily with meals"
          />
        </div>

        {/* Selected Medications Chips List */}
        <div className="medications-chip-list">
          <label className="section-label">Current Regimen ({medications.length} selected):</label>
          {medications.length === 0 ? (
            <div className="empty-meds-box">
              <p>No medicines added yet. Type a medicine above or pick a sample preset to start.</p>
            </div>
          ) : (
            <div className="chips-flex">
              {medications.map((med, index) => {
                const isBrand = med.isBrand && med.brandName;
                const isUnknown = med.isUnknown;
                return (
                  <div
                    key={`${med.id}-${index}`}
                    className={`med-chip ${isUnknown ? 'unknown-chip' : (isBrand ? 'brand-chip' : 'generic-chip')}`}
                  >
                    <div className="chip-content">
                      {isBrand ? (
                        <>
                          <span className="chip-brand">{med.brandName || med.resolvedFrom}</span>
                          <span className="chip-arrow">➔</span>
                          <span className="chip-generic">{med.genericName}</span>
                        </>
                      ) : (
                        <span className="chip-generic">{med.genericName}</span>
                      )}
                      {isUnknown && <span className="chip-badge-unknown">Not in DB</span>}
                    </div>
                    <button
                      type="button"
                      className="chip-delete-btn"
                      onClick={() => onRemoveMedication(index)}
                      title="Remove medicine"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
