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

module.exports = { formatDate };