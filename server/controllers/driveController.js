// server/controllers/driveController.js
const { google } = require('googleapis');

// 1. Prepare the credentials from Environment Variables
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
// The Replace Logic: Turns literal string "\n" into actual new line characters
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// 2. Authenticate using 'credentials' object 
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: CLIENT_EMAIL,
    private_key: PRIVATE_KEY,
  },
  scopes: SCOPES,
});

// In-memory link cache for Google Drive webViewLinks (1 hour TTL)
const driveLinkCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

exports.openImageByTon = async (req, res) => {
  const { tonNumber } = req.params;
  const FOLDER_ID = '1-IPc-3toFqGCq-6KN1GDWteKMFXrC4kd'; 

  // Check cache first
  const cached = driveLinkCache.get(tonNumber);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return res.status(200).json({ 
      success: true, 
      url: cached.url 
    });
  }

  try {
    const driveService = google.drive({ version: 'v3', auth });

    const response = await driveService.files.list({
      q: `'${FOLDER_ID}' in parents and name contains '${tonNumber}' and trashed = false`,
      fields: 'files(id, name, webViewLink)',
      pageSize: 1, 
    });

    const files = response.data.files;

    if (files.length === 0) {
      return res.status(404).send('Image not found in Drive.');
    }

    const webViewLink = files[0].webViewLink;
    driveLinkCache.set(tonNumber, { url: webViewLink, timestamp: Date.now() });

    res.status(200).json({ 
      success: true, 
      url: webViewLink 
    });

  } catch (error) {
    console.error('Drive API Error:', error.message); 
    // Log the error message to see if it's an Auth issue
    res.status(500).send('Error connecting to Drive.');
  }
};