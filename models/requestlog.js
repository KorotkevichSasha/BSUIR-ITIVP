'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RequestLog extends Model {}

  RequestLog.init({
    requestedAt: { type: DataTypes.DATE, allowNull: false },
    method: { type: DataTypes.STRING(16), allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: false },
    statusCode: { type: DataTypes.INTEGER, allowNull: false },
    durationMs: { type: DataTypes.DOUBLE, allowNull: false },
  }, {
    sequelize,
    modelName: 'RequestLog',
    timestamps: false,
  });

  return RequestLog;
};
