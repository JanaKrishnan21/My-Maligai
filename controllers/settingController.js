import Setting from '../models/Setting.js';

export const getSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        shopName: process.env.DEFAULT_SHOP_NAME || 'My Maligai',
        phone: process.env.DEFAULT_SHOP_PHONE || '+91 98765 43210',
      });
    }
    res.json({ success: true, setting });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting(req.body);
    } else {
      Object.assign(setting, req.body);
    }

    await setting.save();
    res.json({ success: true, message: 'Settings updated successfully', setting });
  } catch (error) {
    next(error);
  }
};
