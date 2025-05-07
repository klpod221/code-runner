const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db.config");

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
    logging: false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./user.model")(sequelize, Sequelize);
db.CodeExecution = require("./codeExecution.model")(sequelize, Sequelize);
db.Language = require("./language.model")(sequelize, Sequelize);
db.testCase = require("./testCase.model.js")(sequelize, Sequelize);

// Define associations
db.User.hasMany(db.CodeExecution, { as: "executions" });
db.CodeExecution.belongsTo(db.User, { foreignKey: "userId", as: "user" });
db.CodeExecution.belongsTo(db.Language, {
  foreignKey: "languageId",
  as: "language",
});

// Set up relationship between CodeExecution and TestCase
db.CodeExecution.hasMany(db.testCase, {
  foreignKey: "codeExecutionId",
  as: "testCases",
});
db.testCase.belongsTo(db.CodeExecution, {
  foreignKey: "codeExecutionId",
  as: "codeExecution",
});

module.exports = db;
