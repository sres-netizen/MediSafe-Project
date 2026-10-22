const drugs = require('../data/drugs.json');
const brands = require('../data/brands.json');

// Build quick lookup maps
const drugMap = new Map();
drugs.forEach(d => {
  drugMap.set(d.id.toLowerCase(), d);
  drugMap.set(d.genericName.toLowerCase(), d);
});

/**
 * Resolves an entered text string (brand name or generic name) into generic drug objects.
 * Handles single generics, brand names, and combination brand names (e.g. Combiflam -> [Ibuprofen, Paracetamol]).
 * @param {string} inputName
 * @returns {Array<Object>} Array of resolved generic drug objects
 */
function resolveMedicine(inputName) {
  if (!inputName || typeof inputName !== 'string') return [];
  const clean = inputName.trim().toLowerCase();
  if (!clean) return [];

  // 1. Direct generic match
  if (drugMap.has(clean)) {
    const drug = drugMap.get(clean);
    return [{
      ...drug,
      resolvedFrom: inputName.trim(),
      isBrand: false,
      isUnknown: false
    }];
  }

  // 2. Direct brand name match
  if (brands[clean]) {
    const genericIds = brands[clean];
    const results = [];
    genericIds.forEach(id => {
      const drug = drugMap.get(id.toLowerCase());
      if (drug) {
        results.push({
          ...drug,
          resolvedFrom: inputName.trim(),
          isBrand: true,
          brandName: inputName.trim(),
          isUnknown: false
        });
      }
    });
    if (results.length > 0) return results;
  }

  // 3. Partial / prefix match on brands (e.g. "Dolo" -> "Dolo 650")
  for (const [brandKey, genericIds] of Object.entries(brands)) {
    if (clean === brandKey || clean.startsWith(brandKey) || brandKey.startsWith(clean)) {
      const results = [];
      genericIds.forEach(id => {
        const drug = drugMap.get(id.toLowerCase());
        if (drug) {
          results.push({
            ...drug,
            resolvedFrom: inputName.trim(),
            isBrand: true,
            brandName: brandKey.toUpperCase(),
            isUnknown: false
          });
        }
      });
      if (results.length > 0) return results;
    }
  }

  // 4. Partial match on generic names
  for (const drug of drugs) {
    const genLower = drug.genericName.toLowerCase();
    if (genLower.includes(clean) || clean.includes(genLower)) {
      return [{
        ...drug,
        resolvedFrom: inputName.trim(),
        isBrand: false,
        isUnknown: false
      }];
    }
  }

  // 5. Unknown drug
  return [{
    id: clean.replace(/\s+/g, '-'),
    genericName: inputName.trim(),
    drugClass: 'Unclassified / Unknown',
    bodySystemsLoaded: [],
    cypSubstrateOf: [],
    cypInhibits: [],
    cypInduces: [],
    pregnancyCategory: 'Unknown',
    safeInPregnancy: null,
    commonSideEffects: [],
    sameClassAlternatives: [],
    timingNotes: 'Consult your pharmacist for dosing instructions.',
    resolvedFrom: inputName.trim(),
    isBrand: false,
    isUnknown: true
  }];
}

/**
 * Autocomplete search across all generic drugs and Indian brands
 * @param {string} query
 * @param {number} limit
 * @returns {Array<{ display: string, genericName: string, id: string, isBrand: boolean, subtitle: string }>}
 */
function searchMedicines(query = '', limit = 10) {
  const clean = query.trim().toLowerCase();
  const suggestions = [];

  // Match generics first
  drugs.forEach(d => {
    if (!clean || d.genericName.toLowerCase().includes(clean) || d.id.includes(clean)) {
      suggestions.push({
        id: d.id,
        genericName: d.genericName,
        display: d.genericName,
        isBrand: false,
        subtitle: `${d.drugClass} (Generic)`
      });
    }
  });

  // Match brands
  Object.keys(brands).forEach(brandKey => {
    if (!clean || brandKey.includes(clean)) {
      const genericNames = brands[brandKey].map(id => drugMap.get(id)?.genericName || id).join(' + ');
      const formattedBrand = brandKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      suggestions.push({
        id: brands[brandKey][0],
        genericName: genericNames,
        display: `${formattedBrand}`,
        isBrand: true,
        subtitle: `➔ ${genericNames} (Brand)`
      });
    }
  });

  return suggestions.slice(0, limit);
}

module.exports = {
  resolveMedicine,
  searchMedicines,
  drugs,
  brands
};
