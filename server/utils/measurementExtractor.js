/* ================================================================
   MEASUREMENT EXTRACTOR UTILITY (SERVER SIDE)
   ================================================================ */

function transformToMeasurementReport(records = []) {
  return records.map(record => {
    const text = normalizeDescription(record.description);

    const clearance = extractClearances(text);

    return {
      ton: record.tonNumber,
      serialNumber: record.serialNumber,

      // Rotor / Shaft
      rotorNDE: clearance.rotorNDE,
      rotorDE: clearance.rotorDE,

      // Housing
      housingNDE: clearance.housingNDE,
      housingDE: clearance.housingDE,

      // Current
      inL: extractCurrent(text),

      // Vibration
      vNL: extractVibrationNoLoad(text),
      vL: extractVibrationLoad(text),

      date: record.dateFormatted || record.date,
      rawText: text
    };
  });
}

function normalizeDescription(description = "") {
  if (!description) return "";
  let text = String(description);

  text = text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<\/tr>/gi, " ")
    .replace(/<\/td>/gi, " ")
    .replace(/<\/th>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, " ");

  return text
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractClearances(text) {
  const result = {
    rotorNDE: null,
    rotorDE: null,
    housingNDE: null,
    housingDE: null
  };

  if (!text) return result;

  let match;

  match = text.match(/(?:Clearance\s+)?(?:Shaft|Rotor)\s*(?:\(?\s*DE\s*\/\s*NDE\s*\)?)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
          text.match(/(?:DE\s*\/\s*NDE)\s+(?:Shaft|Rotor)\s*(?:Clearance)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
          text.match(/(?:Shaft|Rotor)\s+Clearance\s*(?:\(?\s*DE\s*\/\s*NDE\s*\)?)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);
  if (match) {
    result.rotorDE = match[1];
    result.rotorNDE = match[1];
  }

  if (!result.rotorDE) {
    match = text.match(/(?:Clearance\s+)?(?:Shaft|Rotor)\s+DE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
            text.match(/DE\s+(?:Shaft|Rotor)\s*(?:Clearance)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
            text.match(/(?:Shaft|Rotor)\s+Clearance\s+DE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (match) {
      result.rotorDE = match[1];
    }
  }

  if (!result.rotorNDE) {
    match = text.match(/(?:Clearance\s+)?(?:Shaft|Rotor)\s+NDE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
            text.match(/NDE\s+(?:Shaft|Rotor)\s*(?:Clearance)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
            text.match(/(?:Shaft|Rotor)\s+Clearance\s+NDE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (match) {
      result.rotorNDE = match[1];
    }
  }

  if (!result.rotorDE && !result.rotorNDE) {
    match = text.match(/(?:Housing\s+Clearance|Housing|Clearance)\s+DE\s*\/\s*NDE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
            text.match(/DE\s*\/\s*NDE\s+Housing\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (match) {
      result.housingDE = match[1];
      result.housingNDE = match[1];
    }
  }

  if (!result.housingDE) {
    match = text.match(/(?:Housing\s+Clearance|Housing)\s+DE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
            text.match(/Clearance\s+DE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (match) {
      if (!result.rotorDE || result.rotorDE !== match[1]) {
        result.housingDE = match[1];
      }
    }
  }

  if (!result.housingNDE) {
    match = text.match(/(?:Housing\s+Clearance|Housing)\s+NDE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i) ||
            text.match(/Clearance\s+NDE\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (match) {
      if (!result.rotorNDE || result.rotorNDE !== match[1]) {
        result.housingNDE = match[1];
      }
    }
  }

  return result;
}

function extractCurrent(text) {
  if (!text) return null;
  let match;

  match = text.match(
    /(?:I[- ./]*n[- ./]*L|In[- ./]*L|I\s*n\s*L)\s*[:=>\s]*\s*([+-]?\d+(?:\.\d+)?(?:\s*[/, -]\s*[+-]?\d+(?:\.\d+)?)*)\s*(?:A|Amps?|Amperes?)?\b/i
  );
  if (match) {
    const val = match[1].trim().replace(/\s+/g, '');
    return val.endsWith('A') || val.endsWith('a') ? val : `${val}A`;
  }

  match = text.match(
    /(?:\bI[- ./]*L|I\.L)\s*[:=>\s]*\s*([+-]?\d+(?:\.\d+)?(?:\s*[/, -]\s*[+-]?\d+(?:\.\d+)?)*)\s*(?:A|Amps?|Amperes?)?\b/i
  );
  if (match) {
    const val = match[1].trim().replace(/\s+/g, '');
    return val.endsWith('A') || val.endsWith('a') ? val : `${val}A`;
  }

  match = text.match(
    /(?:No\s*-*\s*load\s+current|Current(?:\s*\(?\s*N\.?L\.?\s*\)?)?|\bIn)\s*[:=>\s]*\s*([+-]?\d+(?:\.\d+)?(?:\s*[/, -]\s*[+-]?\d+(?:\.\d+)?)*)\s*(?:A|Amps?|Amperes?)\b/i
  );
  if (match) {
    const val = match[1].trim().replace(/\s+/g, '');
    return val.endsWith('A') || val.endsWith('a') ? val : `${val}A`;
  }

  match = text.match(/I\s*n?\s*\.?\s*L\s*[:=>\s]*([+-]?\d+(?:\.\d+)?)\s*A/i);
  if (match) {
    return `${match[1]}A`;
  }

  return null;
}

function extractVibrationNoLoad(text) {
  if (!text) return null;
  let match;

  match = text.match(/\bVib\s*M\s*:\s*\(([^)]*)\)/i);
  if (match) {
    const values = extractNumbers(match[1]);
    if (values.length >= 3) {
      return values.slice(0, 3).join("/");
    }
    if (values.length > 0) {
      return values.join("/");
    }
  }

  match = text.match(/\bVib(?:ration)?(?!\s+(?:Load|L\b))\s*(?:N\.?L\.?|No\s*Load)?\s*[:=>\s]*\s*([+-]?\d+(?:\.\d+)?)\s*[, /\\-]+\s*([+-]?\d+(?:\.\d+)?)\s*[, /\\-]+\s*([+-]?\d+(?:\.\d+)?)/i);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }

  match = text.match(/\bVib(?:ration)?(?!\s+(?:Load|L\b))\s*(?:N\.?L\.?|No\s*Load)?\s*[:=>\s]*\s*([+-]?\d+(?:\.\d+)?(?:\s*[, /\\-]+\s*[+-]?\d+(?:\.\d+)?)*)/i);
  if (match) {
    const rawVal = match[1].trim();
    const parts = rawVal.split(/[, /\\-]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts.join("/");
    }
  }

  return null;
}

function extractVibrationLoad(text) {
  if (!text) return null;

  const match = text.match(/\bVib(?:ration)?\s+(?:Load|L\.?)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*[, /\\-]+\s*([+-]?\d+(?:\.\d+)?)\s*[, /\\-]+\s*([+-]?\d+(?:\.\d+)?)/i);
  if (!match) {
    return null;
  }
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function extractNumbers(text) {
  if (!text) return [];
  return text.match(/[+-]?\d+(?:\.\d+)?/g) || [];
}

module.exports = {
  transformToMeasurementReport,
  normalizeDescription,
  extractClearances,
  extractCurrent,
  extractVibrationNoLoad,
  extractVibrationLoad,
  extractNumbers
};
