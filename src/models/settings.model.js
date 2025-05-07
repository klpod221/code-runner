module.exports = (sequelize, Sequelize) => {
  const Settings = sequelize.define(
    "settings",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return Settings;
};