import { createLogger, Logger } from './logger';

describe('createLogger', () => {
  it('should create a logger with log and error functions', () => {
    const logger = createLogger('test-logger');
    expect(logger).toHaveProperty('log');
    expect(logger).toHaveProperty('error');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should log messages with correct format', () => {
    const logger = createLogger('test-logger');
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.log('Test log message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        name: 'test-logger',
        message: 'Test log message',
        details: undefined,
      }),
    );

    consoleLogSpy.mockRestore();
  });

  it('should log messages with details', () => {
    const logger = createLogger('test-logger');
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const details = { key: 'value' };

    logger.log('Test log message with details', details);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        name: 'test-logger',
        message: 'Test log message with details',
        details: details,
      }),
    );

    consoleLogSpy.mockRestore();
  });

  it('should log error messages with correct format', () => {
    const logger = createLogger('test-logger');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    logger.error('Test error message');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        name: 'test-logger',
        message: 'Test error message',
        details: undefined,
      }),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should log error messages with details', () => {
    const logger = createLogger('test-logger');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const details = { key: 'value' };

    logger.error('Test error message with details', details);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        name: 'test-logger',
        message: 'Test error message with details',
        details: details,
      }),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle errors during JSON stringification', () => {
    const logger = createLogger('test-logger');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const circularObject: any = {};
    circularObject.circular = circularObject;

    logger.error('Test error message with circular object', circularObject);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const firstCall = consoleErrorSpy.mock.calls[0][0];
    expect(firstCall).toContain("Converting circular structure to JSON");

    consoleErrorSpy.mockRestore();
  });

  it('should use default logger name if none is provided', () => {
    const logger = createLogger();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.log('Test log message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        name: 'logger',
        message: 'Test log message',
        details: undefined,
      }),
    );

    consoleLogSpy.mockRestore();
  });

  it('should return the same logger instance for the same name', () => {
    const logger1 = createLogger('test-logger');
    const logger2 = createLogger('test-logger');
    expect(logger1).toBe(logger2);
  });

  it('should return different logger instances for different names', () => {
    const logger1 = createLogger('test-logger-1');
    const logger2 = createLogger('test-logger-2');
    expect(logger1).not.toBe(logger2);
  });
});
