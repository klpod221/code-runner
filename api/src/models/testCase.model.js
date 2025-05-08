module.exports = (sequelize, Sequelize) => {
  const TestCase = sequelize.define(
    "testCase",
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codeExecutionId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      input: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      expectedOutput: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      actualOutput: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      passed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      executionTime: {
        type: Sequelize.INTEGER, // in milliseconds
        allowNull: true,
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    },
    {
      timestamps: true,
    }
  );

  return TestCase;
};