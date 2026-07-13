require('dotenv').config();
const pool = require('./database');

async function seed() {
  try {
    await pool.query("INSERT INTO categories (name, description) VALUES ('默认分类', '未分类文章')");
    console.log('默认分类插入成功');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

seed();
