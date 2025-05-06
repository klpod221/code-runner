const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { CodeExecution, Language } = require('../models');
const { executeCode } = require('../services/codeExecutor.service');

// Execute code
exports.runCode = async (req, res) => {
  try {
    const { languageId, code, stdin, files } = req.body;
    const userId = req.user.id;
    
    // Validate request body
    if (!languageId) {
      return res.status(400).json({
        message: 'Language ID is required'
      });
    }
    
    if (!code && (!files || !Array.isArray(files) || files.length === 0)) {
      return res.status(400).json({
        message: 'Either code or files must be provided'
      });
    }
    
    // Validate language
    const language = await Language.findOne({
      where: { id: languageId, isActive: true }
    });
    
    if (!language) {
      return res.status(404).json({
        message: 'Language not found or not supported'
      });
    }
    
    // Create a record in database
    const codeExecution = await CodeExecution.create({
      userId,
      languageId,
      code: Array.isArray(files) && files.length > 0 ? JSON.stringify(files) : code,
      stdin: stdin || '',
      status: 'pending'
    });
    
    // Prepare files for execution
    let filesToExecute = [];
    if (Array.isArray(files) && files.length > 0) {
      // Multiple files - process files array
      // Each file object should have { name, content, isMain (boolean) }
      filesToExecute = files.map(file => ({
        name: file.name,
        content: file.content,
        isMain: !!file.isMain
      }));
    } else {
      // Single file code
      const fileName = `main${language.extension}`;
      filesToExecute = [{
        name: fileName,
        content: code,
        isMain: true
      }];
    }
    
    // Execute code directly using the service
    try {
      const result = await executeCode({
        language: language.name,
        files: filesToExecute,
        stdin: stdin || ''
      });
      
      // Update the code execution record with results
      await codeExecution.update({
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compilationOutput: result.compilationOutput || '',
        executionTime: result.executionTime || 0,
        memoryUsage: result.memoryUsage || 0,
        exitCode: result.exitCode || 0,
        status: result.success ? 'completed' : 'failed',
        error: ''
      });
      
      res.status(200).json({
        message: 'Code execution completed',
        result: {
          id: codeExecution.id,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compilationOutput: result.compilationOutput || '',
          executionTime: result.executionTime || 0,
          memoryUsage: result.memoryUsage || 0,
          exitCode: result.exitCode || 0,
          success: result.success
        }
      });
    } catch (error) {
      // Update the code execution record with error
      await codeExecution.update({
        stdout: '',
        stderr: error.message || 'Execution failed',
        exitCode: 1,
        status: 'failed',
        error: error.message || 'Execution failed'
      });
      
      res.status(500).json({
        message: 'Code execution failed',
        error: error.message
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error executing code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get code execution by ID
exports.getExecutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const codeExecution = await CodeExecution.findOne({
      where: { id, userId },
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'name', 'displayName', 'extension']
        }
      ]
    });
    
    if (!codeExecution) {
      return res.status(404).json({
        message: 'Code execution not found'
      });
    }
    
    res.status(200).json({
      message: 'Code execution retrieved successfully',
      execution: codeExecution
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving code execution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's code execution history
exports.getUserExecutions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const executions = await CodeExecution.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'name', 'displayName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    res.status(200).json({
      message: 'Code executions retrieved successfully',
      executions: executions.rows,
      totalCount: executions.count,
      totalPages: Math.ceil(executions.count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving code executions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};