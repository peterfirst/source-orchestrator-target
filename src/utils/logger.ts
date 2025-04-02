export interface logger {
  log: Function;
  error: Function;
}

export class Logger implements logger {
  constructor(private name: string) {
    this.name = name;
  }

  private createLogObject(message: string, details?: Object) {
    try {
      return JSON.stringify({
        name: this.name,
        message,
        details,
      });
    } catch (error) {
      return JSON.stringify(error);
    }
  }

  log(message: string, details?: Object): void {
    console.log(this.createLogObject(message, details));
  }

  error(message: string, details?: Object): void {
    console.error(this.createLogObject(message, details));
  }
}
