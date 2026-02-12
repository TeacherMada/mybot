// commands/id.js
export const name = "id";
export const description = "Affiche ton ID Messenger pour l'utiliser comme ADMIN_ID";

export async function execute(senderId, args, pageAccessToken, sendMessage) {
  await sendMessage(senderId, {
    text: `${senderId}`
  }, pageAccessToken);
}
