const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// 🔥 Convert **bold** to Unicode Bold (Messenger compatible)
function convertMarkdownToBold(text) {
    const boldMap = {
        a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲",
        f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷",
        k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼",
        p: "𝗽", q: "𝗾", r: "𝗿", s: "𝗲",
        t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅",
        y: "𝘆", z: "𝘇",
        A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘",
        F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝",
        K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢",
        P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧",
        U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬",
        Z: "𝗭"
    };

    return text.replace(/\*\*(.*?)\*\*/g, (_, word) => {
        return word.split('').map(char => boldMap[char] || char).join('');
    });
}

module.exports = {
    name: 'tsanta',
    description: 'TeacherMada Agent',

    async execute(senderId, args, pageAccessToken) {

        const prompt = args.join(' ');

        if (!prompt) {
            return sendMessage(
                senderId,
                { text: "Soraty ny fanontanianao 😊" },
                pageAccessToken
            );
        }

        try {

            const { data } = await axios.get(
                'https://teachermada-agent.onrender.com/api/agent/chat',
                {
                    params: {
                        prompt: prompt,
                        id: senderId
                    }
                }
            );

            if (!data.success) {
                return sendMessage(
                    senderId,
                    { text: "⚠️ Tsy nahazo valiny avy amin'ny serveur aho.." },
                    pageAccessToken
                );
            }

            // 🔥 Convert escaped \n to real line breaks
            let cleanText = data.response.replace(/\\n/g, '\n');

            // 🔥 Convert Markdown **bold**
            cleanText = convertMarkdownToBold(cleanText);

            // 🔥 Send ONE message only
            await sendMessage(
                senderId,
                { text: cleanText },
                pageAccessToken
            );

        } catch (error) {

            console.error("❌ Messenger Error:", error.response?.data || error.message);

            await sendMessage(senderId, {
                text: "❌ Erreur système. Réessayez plus tard 👍"
            }, pageAccessToken);
        }
    }
};
