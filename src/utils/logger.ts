export interface Logger {
  log: (message: string, details?: Object) => void;
  error: (message: string, details?: Object) => void;
}

const cache: { [key: string]: Logger } = {};

export function createLogger(name: string = "logger"): Logger {
  if (cache[name]) {
    return cache[name];
  }
  
  const createLogObject = (message: string, details?: Object) => {
    try {
      return JSON.stringify({
        name,
        message,
        details,
      });
    } catch (error) {
      if (error instanceof Error) {
        return error.toString();
      } else {
        return 'Caught something that is not an Error object';
      }
    }
  };

  const logger = {
    log: (message: string, details?: Object): void => {
      console.log(createLogObject(message, details));
    },
    error: (message: string, details?: Object): void => {
      console.error(createLogObject(message, details));
    },
  }

  cache[name] = logger;

  return logger;
}