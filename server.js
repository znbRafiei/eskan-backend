const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ساخت دیتابیس در قالب یک فایل ساده و رایگان درون پوشه پروژه
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// تعریف جدول تنظیمات طبقات
const Config = sequelize.define('Config', {
  key: { type: DataTypes.STRING, unique: true },
  value: { type: DataTypes.JSON }
});

//定义 جدول رزروها
const Reservation = sequelize.define('Reservation', {
  roomId: { type: DataTypes.STRING, unique: true },
  guestName: { type: DataTypes.STRING }
});

// اتصال و ساخت جداول
sequelize.sync()
  .then(() => console.log('دیتابیس رایگان SQLite آماده استفاده است...'))
  .catch(err => console.error('خطا در راه‌اندازی دیتابیس:', err));

// مسیر دریافت اطلاعات
app.get('/api/data', async (req, res) => {
  try {
    const countsConfig = await Config.findOne({ where: { key: 'floorCounts' } });
    const counts = countsConfig ? countsConfig.value : { 1: 0, 2: 0, 3: 0 };

    const resList = await Reservation.findAll();
    const reservations = {};
    resList.forEach(item => { reservations[item.roomId] = item.guestName; });

    res.json({ counts, reservations });
  } catch (err) { res.status(500).send('خطای سرور'); }
});

// مسیر ثبت تغییرات
app.post('/api/data', async (req, res) => {
  const { action, counts, roomId, guestName } = req.body;
  try {
    if (action === 'setCounts') {
      const [config] = await Config.findOrCreate({ where: { key: 'floorCounts' }, defaults: { value: counts } });
      if (config) { config.value = counts; await config.save(); }
    } else if (action === 'set') {
      const [reservation] = await Reservation.findOrCreate({ where: { roomId }, defaults: { guestName } });
      if (reservation) { reservation.guestName = guestName; await reservation.save(); }
    } else if (action === 'delete') {
      await Reservation.destroy({ where: { roomId } });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).send('خطای سرور'); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`سرور روی پورت ${PORT} روشن شد`));