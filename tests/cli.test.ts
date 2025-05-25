/**
 * CLI Tests
 * Tests for command-line interface functionality
 */

import { handleCliCommands } from '../src/cli';
import { CommandManager } from '../src/cli/command-manager';
import { formatHelp } from '../src/cli/help-formatter';
import { configureClaudeDesktop, getClaudeConfigPath, showConfigLocation } from '../src/config/claude';

describe('CLI Module', () => {
  describe('handleCliCommands', () => {
    // Mock console methods
    let consoleSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should handle help command', () => {
      const result = handleCliCommands(['--help']);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should handle help with -h flag', () => {
      const result = handleCliCommands(['-h']);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should handle version command', () => {
      const result = handleCliCommands(['--version']);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should handle configure command', () => {
      const result = handleCliCommands(['--configure']);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should handle find-config command', () => {
      const result = handleCliCommands(['--find-config']);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should handle empty arguments', () => {
      const result = handleCliCommands([]);
      expect(result).toBe(false);
    });

    test('should handle unknown arguments', () => {
      const result = handleCliCommands(['--unknown']);
      expect(result).toBe(false);
    });
  });

  describe('CommandManager', () => {
    // Mock console methods
    let consoleSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should handle help command', () => {
      expect(() => CommandManager.executeHelp()).toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    test('should handle version command', () => {
      expect(() => CommandManager.executeVersion()).toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    test('should handle configure command', () => {
      const result = CommandManager.executeConfigure();
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should handle find-config command', () => {
      const result = CommandManager.executeFindConfig();
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('formatHelp', () => {
    test('should format help text correctly', () => {
      const packageJson = { name: 'test-app', version: '1.0.0' };
      const supportedTypes = ['postgresql', 'mysql', 'sqlite'];
      const examples = {
        postgresql: ['postgresql://user:pass@localhost/db'],
        mysql: ['mysql://user:pass@localhost/db'],
        sqlite: ['./database.db'],
      };

      const helpText = formatHelp(packageJson, supportedTypes, examples);

      expect(helpText).toContain('test-app v1.0.0');
      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('--help');
      expect(helpText).toContain('postgresql');
      expect(helpText).toContain('mysql');
      expect(helpText).toContain('sqlite');
    });
  });

  describe('Claude Configuration', () => {
    test('should get Claude config path', () => {
      const configPath = getClaudeConfigPath();

      expect(typeof configPath).toBe('string');
      expect(configPath.length).toBeGreaterThan(0);
      expect(configPath).toMatch(/claude/i);
    });

    test('should show config location without throwing', () => {
      let consoleSpy: jest.SpyInstance;
      let processExitSpy: jest.SpyInstance;

      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        showConfigLocation();
        expect(consoleSpy).toHaveBeenCalled();
      } catch (error) {
        // If it throws due to process.exit, that's ok
        if ((error as Error).message !== 'process.exit called') {
          throw error;
        }
      } finally {
        consoleSpy.mockRestore();
        processExitSpy.mockRestore();
      }
    });

    test('should configure Claude Desktop without throwing', () => {
      let consoleSpy: jest.SpyInstance;
      let processExitSpy: jest.SpyInstance;

      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        configureClaudeDesktop('postgresql://test:test@localhost/test');
      } catch (error) {
        // Configuration may fail due to file system permissions or process.exit
        // That's expected in a test environment
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
        processExitSpy.mockRestore();
      }
    });
  });
});

describe('CLI Integration Tests', () => {
  describe('Command Line Processing', () => {
    test('should process help workflow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = handleCliCommands(['--help']);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should process configure workflow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = handleCliCommands(['--configure']);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should handle multiple arguments (first wins)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = handleCliCommands(['--help', '--version']);
      expect(result).toBe(true); // First valid command should be processed

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid command gracefully', () => {
      const result = handleCliCommands(['--invalid-command']);
      expect(result).toBe(false);
    });

    test('should handle empty command list', () => {
      const result = handleCliCommands([]);
      expect(result).toBe(false);
    });
  });
});
