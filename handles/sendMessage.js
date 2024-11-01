const axios = require('axios');
const path = require('path');

// Helper function for POST requests
const axiosPost = (url, data, params = {}) => axios.post(url, data, { params }).then(res => res.data);

// Send a message with typing indicators and support for quick replies and buttons
const sendMessage = async (senderId, { text = '', attachment = null, quick_replies = [], buttons = [] }, pageAccessToken) => {
  if (!text && !attachment) return;

  const url = `https://graph.facebook.com/v21.0/me/messages`;
  const params = { access_token: pageAccessToken };

  try {
    // Turn on typing indicator
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_on" }, params);

    // Prepare message payload based on content
    const messagePayload = {
      recipient: { id: senderId },
      message: {}
    };

    // Add text if available
    if (text) {
      messagePayload.message.text = text;
    }

    // Add attachment if available
    if (attachment) {
      // Handle template attachment with buttons
      if (attachment.type === "template" && attachment.payload.template_type) {
        messagePayload.message.attachment = {
          type: attachment.type,
          payload: {
            template_type: attachment.payload.template_type,
            elements: attachment.payload.elements || [],
            text: attachment.payload.text || ''
          }
        };
      } else {
        // Regular attachment (e.g., image)
        messagePayload.message.attachment = {
          type: attachment.type,
          payload: {
            url: attachment.payload.url,
            is_reusable: true
          }
        };
      }
    }

    // Add buttons if available and using template type
    if (buttons.length > 0) {
      messagePayload.message.attachment = {
        type: "template",
        payload: {
          template_type: "button",
          text: text || "Select an option:",
          buttons: buttons.map(button => ({
            type: button.type,
            title: button.title,
            url: button.url,
            payload: button.payload || null
          }))
        }
      };
    }

    // Add quick replies if available
    if (quick_replies.length > 0) {
      messagePayload.message.quick_replies = quick_replies.map(reply => ({
        content_type: "text",
        title: reply.title,
        payload: reply.payload || reply.title
      }));
    }

    // Send the message
    await axiosPost(url, messagePayload, params);

    // Turn off typing indicator
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_off" }, params);

  } catch (e) {
    // Extract and log the error message concisely
    const errorMessage = e.response?.data?.error?.message || e.message;
    console.error(`Error in ${path.basename(__filename)}: ${errorMessage}`);
  }
};

module.exports = { sendMessage };
