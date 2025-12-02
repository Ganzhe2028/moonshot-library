import { LogLevel } from '@azure/msal-browser';

// MSAL配置对象
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || 'your-azure-ad-client-id',
    authority: import.meta.env.VITE_MSAL_AUTHORITY || 'https://login.microsoftonline.com/common',
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || 'http://localhost:5173',
    postLogoutRedirectUri: import.meta.env.VITE_MSAL_POST_LOGOUT_REDIRECT_URI || 'http://localhost:5173/login',
    clientCapabilities: ['CP1'], // 明确指定这是一个SPA应用
    // SPA应用程序特定配置
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
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
          default:
            return;
        }
      },
      logLevel: LogLevel.Info,
      piiLoggingEnabled: false,
    },
  },
};

// 请求范围
const loginRequest = {
  scopes: (import.meta.env.VITE_MSAL_SCOPES || 'User.Read,email,profile,openid').split(','),
};

// 获取令牌的请求
const tokenRequest = {
  scopes: (import.meta.env.VITE_MSAL_SCOPES || 'User.Read,email,profile,openid').split(','),
  forceRefresh: false,
};

export { msalConfig, loginRequest, tokenRequest };