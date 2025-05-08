const { Language } = require("../models");
const { v4: uuidv4 } = require("uuid");

/**
 * Initialize the database with default languages
 */
const initLanguages = async () => {
  try {
    // Check if languages already exist
    const count = await Language.count();
    if (count > 0) {
      return;
    }

    // Default languages to initialize
    const languages = [
      {
        id: uuidv4(),
        name: "nodejs",
        displayName: "Node.js",
        extension: ".js",
        version: process.env.NODEJS_VERSION,
        runCommand: "node",
        isCompiled: false,
        isActive: true,
      },
      {
        id: uuidv4(),
        name: "python",
        displayName: "Python",
        extension: ".py",
        version: process.env.PYTHON_VERSION,
        runCommand: "python3",
        isCompiled: false,
        isActive: true,
      },
      {
        id: uuidv4(),
        name: "java",
        displayName: "Java",
        extension: ".java",
        version: process.env.JAVA_VERSION,
        compileCommand: "javac",
        runCommand: "java",
        isCompiled: true,
        isActive: true,
      },
      {
        id: uuidv4(),
        name: "cpp",
        displayName: "C++",
        extension: ".cpp",
        version: process.env.CPP_VERSION,
        compileCommand: "g++ -o output",
        runCommand: "./output",
        isCompiled: true,
        isActive: true,
      },
      {
        id: uuidv4(),
        name: "c",
        displayName: "C",
        extension: ".c",
        version: process.env.C_VERSION,
        compileCommand: "gcc -o output",
        runCommand: "./output",
        isCompiled: true,
        isActive: true,
      },
    ];

    // Insert languages
    await Language.bulkCreate(languages);
    console.log("Default languages initialized successfully");
  } catch (error) {
    console.error("Error initializing languages:", error);
  }
};

module.exports = {
  initLanguages,
};
