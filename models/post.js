'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate() {}
  }

  Post.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      game: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      mediaType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [['screenshot', 'video']] },
      },
      mediaUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      comments: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      likesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      modelName: 'Post',
    },
  );

  return Post;
};
