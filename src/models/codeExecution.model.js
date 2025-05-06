module.exports = (sequelize, Sequelize) => {
  const CodeExecution = sequelize.define('codeExecution', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    languageId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    code: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    stdin: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    stdout: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    stderr: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    compilationOutput: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    executionTime: {
      type: Sequelize.INTEGER,  // in milliseconds
      allowNull: true
    },
    memoryUsage: {
      type: Sequelize.INTEGER,  // in kilobytes
      allowNull: true
    },
    exitCode: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('pending', 'running', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    error: {
      type: Sequelize.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return CodeExecution;
};