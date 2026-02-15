// ==========================================
// APPS SCRIPT API CONFIGURATION
// ==========================================

/**
 * Apps Script Deployment URL
 * Get this from: Deploy > Manage deployments > Web app URL
 */
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzX9hUhs4BzYEVdrZCFY6OOTsnTcL3ZvEKcvxkWq0qqoXMuRwxl3CJyBnWmcP4ghpxy/exec';

/**
 * Development mode - use mock data
 */
export const IS_DEV = import.meta.env.DEV;

/**
 * API Client for calling Apps Script functions
 */
export const API = {
  /**
   * Call an Apps Script function
   * @param {string} functionName - Name of the function to call
   * @param  {...any} args - Arguments to pass to the function
   * @returns {Promise} Response from Apps Script
   */
  async call(functionName, ...args) {
    // Development mode - use mock data
    if (IS_DEV) {
      console.log(`[DEV] Mock call: ${functionName}`, args);
      return getMockData(functionName, args);
    }

    // Production mode - call Apps Script
    try {
      const params = {};
      
      // Map arguments to parameter names based on function
      switch(functionName) {
        case 'joinRoom':
          params.roomId = args[0];
          break;
        case 'leaveRoom':
          params.sessionId = args[0];
          break;
        case 'getMessages':
          params.roomId = args[0];
          params.limit = args[1] || 50;
          break;
        case 'sendMessage':
          params.roomId = args[0];
          params.message = args[1];
          break;
        case 'getUserStats':
          params.email = args[0];
          break;
      }

      // Call via google.script.run if available (when hosted on Apps Script)
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        return new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)
            [functionName](...args);
        });
      }

      // Otherwise call via fetch (when hosted separately)
      const response = await fetch(APPS_SCRIPT_URL + `?function=${functionName}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Apps Script functions are called via URL parameter
      // Since Code.gs uses google.script.run, we need to embed in iframe
      // OR use Apps Script as Web App with doPost
      
      console.warn('Direct HTTP calls to Apps Script functions not supported.');
      console.warn('Please either:');
      console.warn('1. Host React app ON Apps Script (build -> paste to Apps Script HTML)');
      console.warn('2. Use iframe to load Apps Script page and communicate via postMessage');
      
      return data;

    } catch (error) {
      console.error(`API Error calling ${functionName}:`, error);
      throw error;
    }
  }
};

/**
 * Mock data for local development
 */
function getMockData(functionName, args) {
  const mockData = {
    getCurrentUser: { 
      success: true, 
      email: 'dev@example.com', 
      name: 'Dev User', 
      role: 'student', 
      active: true 
    },
    getRooms: [
      { 
        room_id: 'R1', 
        room_name: 'Silent Study', 
        type: 'Focus', 
        count: 12, 
        status: 'open', 
        meet_link: 'https://meet.google.com/new' 
      },
      { 
        room_id: 'R2', 
        room_name: 'Pomodoro Lounge', 
        type: 'Timer', 
        count: 8,
        status: 'open', 
        meet_link: 'https://meet.google.com/new' 
      },
      { 
        room_id: 'R3', 
        room_name: 'Group Discussion', 
        type: 'Collab', 
        count: 5, 
        status: 'open', 
        meet_link: 'https://meet.google.com/new' 
      },
      { 
        room_id: 'R4', 
        room_name: 'Chill Vibes', 
        type: 'Relax', 
        count: 20, 
        status: 'open', 
        meet_link: 'https://meet.google.com/new' 
      },
    ],
    getUserStats: { 
      success: true, 
      totalMinutes: 245, 
      sessionCount: 8 
    },
    joinRoom: { 
      success: true, 
      sessionId: 'S' + Date.now(), 
      meetLink: 'https://meet.google.com/abc-def-ghi', 
      roomId: args[0] 
    },
    leaveRoom: { 
      success: true, 
      duration: Math.floor(Math.random() * 60) + 15 
    },
    getMessages: [],
    sendMessage: { 
      success: true, 
      messageId: 'M' + Date.now(),
      timestamp: new Date()
    }
  };
  
  return mockData[functionName] || { success: true };
}

export default API;
