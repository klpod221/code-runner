const { Language } = require("../models");

// Get all supported languages
exports.getAllLanguages = async (req, res) => {
  try {
    const languages = await Language.findAll({
      where: { isActive: true },
      attributes: [
        "id",
        "name",
        "displayName",
        "extension",
        "version",
        "isCompiled",
      ],
    });

    res.status(200).json({
      message: "Languages retrieved successfully",
      languages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving languages",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get language by ID
exports.getLanguageById = async (req, res) => {
  try {
    const { id } = req.params;

    const language = await Language.findOne({
      where: { id, isActive: true },
      attributes: [
        "id",
        "name",
        "displayName",
        "extension",
        "version",
        "isCompiled",
      ],
    });

    if (!language) {
      return res.status(404).json({
        message: "Language not found",
      });
    }

    res.status(200).json({
      message: "Language retrieved successfully",
      language,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving language",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
