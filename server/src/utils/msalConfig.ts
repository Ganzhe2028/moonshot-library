import { Configuration, LogLevel } from '@azure/msal-node';

// MSAL配置
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID || '', // 应用程序客户端ID
    authority: process.env.MSAL_AUTHORITY || 'https://login.microsoftonline.com/common', // 认证服务器
    clientSecret: process.env.MSAL_CLIENT_SECRET || '', // 应用程序密钥
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Info,
    },
  },
};

export default msalConfig;