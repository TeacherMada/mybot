const axios = require('axios');

// List of authorized admin UIDs (replace with actual admin UIDs)
const adminUIDs = ['61552825191002'];

module.exports = {
  name: 'post',
  description: 'Automatically post a message to Facebook based on admin’s prompt',
  author: 'tsanta',

  async execute(senderId, prompt, pageAccessToken, pageId) {
    console.log("Attempting to post to Facebook:");
    console.log("Sender ID:", senderId);
    console.log("Admin UIDs:", adminUIDs);
    console.log("Page ID:", pageId);
    console.log("Access Token:", pageAccessToken ? "Provided" : "Not provided");

    // Check if the sender is an authorized admin
    if (!adminUIDs.includes(senderId)) {
      console.error(`Access denied. Unauthorized attempt by user ID: ${senderId}`);
      return;
    }

    try {
      // Log the prompt to show what will be posted
      console.log(`Admin prompt received from UID ${senderId}: ${prompt}`);

      // Call the Facebook API to post the prompt
      const response = await axios.post(`https://graph.facebook.com/${pageId}/feed`, {
        message: prompt,
        access_token: pageAccessToken,
      });

      console.log("Successfully posted to Facebook:", response.data);
    } catch (error) {
      console.error("Error posting to Facebook:", error.response ? error.response.data : error.message);

      // Additional detailed logging
      if (error.response && error.response.data) {
        console.error("Error details:", JSON.stringify(error.response.data, null, 2));
      }
    }
  },
};

// Example usage
const senderId = "61552825191002"; // Replace with the actual sender UID from adminUIDs
const prompt = "Bonjour, Je suis votre assistante personnelle";
const pageAccessToken = "EAANfZABheij8BO73JkTwsYNlSOx2widSyigrEyrc5DQn5eS1MXrZBopJTdDLZBUA5Qv1suSAVjN7bUV0fqBArPv1opTovgHHzJeCcwuV4nN5zRBc9pE9nFZCnaZBjKNp1FdZCHlGSdiDMZCY3g3rnH91FUEAjHNMe3kojeXSdV8sNIN1LrXmJusDZBBZALPmykQgE"; // Replace with actual token
const pageId = "61553462575063"; // Replace with actual page ID

module.exports.execute(senderId, prompt, pageAccessToken, pageId);
