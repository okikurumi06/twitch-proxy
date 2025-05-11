const fetch = require("node-fetch");

let accessToken = null;
let expiresAt = 0;

module.exports = async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  async function getAccessToken() {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials"
      })
    });
    const data = await response.json();
    accessToken = data.access_token;
    expiresAt = Date.now() + data.expires_in * 1000;
  }

  if (!accessToken || Date.now() >= expiresAt) {
    await getAccessToken();
  }

  const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${accessToken}`
    }
  });

  const data = await userRes.json();
  const iconUrl = data.data?.[0]?.profile_image_url || null;

  res.status(200).json({ username, iconUrl });
};
