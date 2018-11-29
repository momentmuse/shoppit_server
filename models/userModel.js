/* eslint-disable no-console */
const userModel = {};
const db = require('./../schemas');

userModel.getOwnInfo = async user_id => {
  const userInfo = await db.User.findOne({
    where: { user_id },
    include: [
      {
        model: db.Category,
        as: 'category',
        attributes: ['category_id', 'category_name'],
        required: false
      }
    ]
  });

  return userInfo.get({ plain: true });
};

userModel.getFriends = async user_id => {
  const me = await db.User.findOne({
    where: { user_id }
  });

  const user1Friends = await me.getUser_1();
  const user2Friends = await me.getUser_2();
  return user1Friends.concat(user2Friends);
};

userModel.addCategory = async (user_id, category_id) => {
  const created = await db.UserCategory.findOrCreate({
    where: {
      user_id,
      category_id
    }
  });
  return created;
};

userModel.removeCategory = async (user_id, category_id) => {
  await db.UserCategory.destroy({
    where: {
      user_id,
      category_id
    }
  });
};

userModel.getLikedItems = async user_id => {
  const user = await db.User.findOne({
    where: { user_id }
  });
  const allItems = await user.getItem();
  const filtered = allItems
    .filter(item => item.UserItem.affinity === true)
    .map(item => {
      delete item.dataValues.UserItem;
      item.dataValues.affinity = true;
      return item;
    });

  const likedItems = [];

  await Promise.all(
    filtered.map(async item => {
      item.dataValues.categories = [];
      let cat = await item.getCategory({
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        }
      });
      cat = cat.map(c => {
        delete c.dataValues.ItemCategory;
        return c;
      });

      delete item.dataValues.ItemCategory;
      item.dataValues.categories.push(...cat);
      likedItems.push(item);
    })
  );

  return likedItems;
};

module.exports = userModel;
