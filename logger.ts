const timestamp = (): string => `[${new Date().toISOString()}]`;

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(`${timestamp()} ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]): void => {
    console.error(`${timestamp()} ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]): void => {
    if (Deno.env.get("DEBUG")) {
      console.debug(`${timestamp()} ${message}`, ...args);
    }
  }
}; 