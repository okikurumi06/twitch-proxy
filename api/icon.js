export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing Twitch credentials' });
  }

  try {
    // アクセストークン取得
    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // ユーザー情報取得
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = await userRes.json();

    if (!userData.data || userData.data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userData.data[0];

    return res.status(200).json({
      username: user.login,                     // ログイン名
      displayName: user.display_name,           // 表示名 ← 追加！
      iconUrl: user.profile_image_url           // プロフィール画像URL
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
