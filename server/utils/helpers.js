// --- Helper function to format date as dd/mm/yyyy ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'; // Handle missing dates
  const date = new Date(dateString);
  
  // check if date is invalid
  if (isNaN(date.getTime())) return 'Invalid Date';

  // Option 1: The 'en-GB' locale automatically formats as dd/mm/yyyy
  //return date.toLocaleDateString('en-GB');
  
  // Option 2: If you want strict manual control (safest for all servers):
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// --- Helper function to format MTBM ---
const formatMTBM = (days) => {
  if (days === null || days === undefined || isNaN(days)) return 'N/A';
  const months = days / 30;
  if (months > 12) {
    const years = months / 12;
    const formattedYears = Number(years.toFixed(1));
    return `${formattedYears} ${formattedYears === 1 ? 'year' : 'years'}`;
  } else {
    const formattedMonths = Number(months.toFixed(1));
    return `${formattedMonths} ${formattedMonths === 1 ? 'month' : 'months'}`;
  }
};

// --- Check if a maintenance event description indicates complete maintenance ---
const isCompleteMaintenanceEvent = (description) => {
  if (!description) return false;
  const clean = String(description)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&[a-z0-9]+;/gi, ' ')
    .replace(/[\u00a0\s]+/g, ' ')
    .toLowerCase()
    .trim();

  const regex = /(?:complete|compelet|compelete|compleet|complet|full)\s*(?:motor\s*)?maint|overhaul|صيانة\s*كاملة|عمرة/i;
  return regex.test(clean) ||
    clean.includes('complete maintenance') ||
    clean.includes('compelet maintainance') ||
    clean.includes('complete maint') ||
    clean.includes('motor complete maint') ||
    clean.includes('complete maintainance') ||
    clean.includes('compelete maintainance') ||
    clean.includes('complet maintenance');
};

// --- Calculate MTBM from maintenance history array ---
const calculateMTBMFromEvents = (maintenanceHistory) => {
  if (!maintenanceHistory || !Array.isArray(maintenanceHistory) || maintenanceHistory.length === 0) {
    return { mtbm: null, completeEvents: [], count: 0 };
  }

  const completeEvents = maintenanceHistory
    .filter(event => {
      const isValidDate = event && event.date && !isNaN(new Date(event.date).getTime());
      return isValidDate && isCompleteMaintenanceEvent(event.description);
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (completeEvents.length >= 2) {
    const latest = completeEvents[completeEvents.length - 1];
    const secondLatest = completeEvents[completeEvents.length - 2];
    const diffTime = Math.abs(new Date(latest.date) - new Date(secondLatest.date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      mtbm: diffDays,
      completeEvents,
      count: completeEvents.length,
      latestDate: latest.date,
      secondLatestDate: secondLatest.date
    };
  }

  return {
    mtbm: null,
    completeEvents,
    count: completeEvents.length,
    latestDate: completeEvents.length === 1 ? completeEvents[0].date : null
  };
};

module.exports = {
  formatDate,
  formatMTBM,
  isCompleteMaintenanceEvent,
  calculateMTBMFromEvents
};