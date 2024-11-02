const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

// Create a simple in-memory store to keep track of searches
const userSearchResults = {};

module.exports = {
  name: 'video',
  description: 'Search for YouTube videos based on user input',
  author: 'Coffee',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const query = args.join(' '); // Get user input as search query

    if (!query) {
      await sendMessage(senderId, { text: 'Please provide a search query.' }, pageAccessToken);
      return;
    }

    try {
      // Search for videos using the provided API
      const response = await axios.get(`https://me0xn4hy3i.execute-api.us-east-1.amazonaws.com/staging/api/resolve/resolveYoutubeSearch?search=${encodeURIComponent(query)}`);
      const data = response.data;

      if (data.code === 200 && data.data.length > 0) {
        // Create a numbered list of video results
        const videoList = data.data.map((video, index) => `${index + 1}. ${video.title}`).join('\n');
        const message = `Here are some videos I found:\n${videoList}\n\nPlease reply with "select" followed by the number of the video you want to watch.`;

        await sendMessage(senderId, { text: message }, pageAccessToken);

        // Store video data in memory for later use
        userSearchResults[senderId] = data.data; // Store video data associated with the senderId
      } else {
        await sendMessage(senderId, { text: 'No videos found for your search.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Error: Unexpected error occurred while searching for videos.' }, pageAccessToken);
    }
  },

  async handleUserResponse(senderId, userResponse) {
    console.log("User response received:", userResponse); // Log the user response

    try {
      // Check if the user response starts with "select"
      if (userResponse.toLowerCase().startsWith('select ')) {
        const numberPart = userResponse.slice(7).trim(); // Extract the number part after "select"
        const videoIndex = parseInt(numberPart, 10) - 1; // Convert response to index
        
        if (userSearchResults[senderId] && userSearchResults[senderId][videoIndex]) {
          const videoId = userSearchResults[senderId][videoIndex].videoId;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

          // Send the video URL directly
          await sendMessage(senderId, {
            text: `Here is the video you requested: ${videoUrl}`, // Use text instead of attachment
          }, token);

          // Optionally, you can delete the user's search results after sending the link
          delete userSearchResults[senderId]; // Clean up after use
        } else {
          await sendMessage(senderId, { text: 'Invalid number. Please try again.' }, token);
        }
      } else {
        await sendMessage(senderId, { text: 'Please reply with "select" followed by the number of the video you want to watch.' }, token);
      }
    } catch (error) {
      console.error('Error handling user response:', error);
      await sendMessage(senderId, { text: 'Error: Unable to retrieve the video.' }, token);
    }
  }
};
