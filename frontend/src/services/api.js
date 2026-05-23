// API Client for the AI Chat Debate Simulator

// Fallback to local development port if env is not configured
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Sends a POST request to get the next message from a chosen persona.
 * @param {string} topic The debate topic
 * @param {string} persona The persona key ('teacher', 'founder', 'student')
 * @param {Array} history Array of previous messages [{ sender, text }]
 */
export async function sendMessage(topic, persona, history) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, persona, history }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || `Server error (status ${response.status})`;
      throw new Error(message);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("API call failed:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Could not connect to the backend server. Please verify that the FastAPI backend is running on port 8000.");
    }
    throw error;
  }
}

/**
 * Sends a POST request to generate the moderator verdict summarizing the chat transcript.
 * @param {string} topic The debate topic
 * @param {Array} history Array of previous messages [{ sender, text }]
 */
export async function getVerdict(topic, history) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/verdict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, history }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || `Server error (status ${response.status})`;
      throw new Error(message);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("API call failed:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Could not connect to the backend server. Please verify that the FastAPI backend is running on port 8000.");
    }
    throw error;
  }
}
