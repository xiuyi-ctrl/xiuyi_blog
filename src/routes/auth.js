const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../config/database');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

let proxyAgent = undefined;

async function getGithubAxios() {
  if (!proxyAgent && process.env.HTTP_PROXY) {
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    proxyAgent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }
  return axios.create({
    timeout: 30000,
    headers: { 'User-Agent': 'Xiuyi-Blog' },
    httpsAgent: proxyAgent
  });
}

router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: 'read:user user:email',
    state: req.query.state || ''
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${CLIENT_URL}/guestbook?error=no_code`);
  }

  try {
    const githubAxios = await getGithubAxios();

    const tokenRes = await githubAxios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL
    }, { headers: { 'Accept': 'application/json' } });

    const tokenData = tokenRes.data;

    if (tokenData.error) {
      return res.redirect(`${CLIENT_URL}/guestbook?error=token_failed`);
    }

    const userRes = await githubAxios.get('https://api.github.com/user', {
      headers: { 'Authorization': `token ${tokenData.access_token}` }
    });

    const githubUser = userRes.data;

    const emailRes = await githubAxios.get('https://api.github.com/user/emails', {
      headers: { 'Authorization': `token ${tokenData.access_token}` }
    });

    const emails = emailRes.data;
    const primaryEmail = emails.find(e => e.primary)?.email || emails[0]?.email || '';

    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE github_id = ?',
      [githubUser.id.toString()]
    );

    let user;

    if (existingUsers.length > 0) {
      await pool.query(
        'UPDATE users SET username = ?, avatar = ?, email = ? WHERE github_id = ?',
        [githubUser.login, githubUser.avatar_url, primaryEmail, githubUser.id.toString()]
      );
      user = existingUsers[0];
      user.username = githubUser.login;
      user.avatar = githubUser.avatar_url;
      user.email = primaryEmail;
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password, avatar, github_id) VALUES (?, ?, ?, ?, ?)',
        [githubUser.login, primaryEmail, 'github_oauth', githubUser.avatar_url, githubUser.id.toString()]
      );
      user = {
        id: result.insertId,
        username: githubUser.login,
        email: primaryEmail,
        avatar: githubUser.avatar_url
      };
    }

    const appToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${CLIENT_URL}/guestbook?token=${appToken}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    }))}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error.message);
    res.redirect(`${CLIENT_URL}/guestbook?error=server_error`);
  }
});

router.get('/github/status', (req, res) => {
  res.json({ clientId: GITHUB_CLIENT_ID });
});

module.exports = router;
