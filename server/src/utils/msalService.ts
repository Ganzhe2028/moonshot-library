import { ConfidentialClientApplication, Configuration, AuthCodeRequest, TokenResponse, AuthorizationUrlRequest } from '@azure/msal-node';
import { User } from '../types';
import { createUserFromMicrosoft } from '../models/user';
import { generateToken, generateRefreshToken } from './auth';

// 创建MSAL配置
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID || '',
    clientSecret: process.env.MSAL_CLIENT_SECRET || '',
    authority: process.env.MSAL_AUTHORITY || 'https://login.microsoftonline.com/common',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => {
        if (!containsPii) {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

// 检查MSAL凭据是否有效
const isMsalConfigValid = () => {
  const isDev = process.env.NODE_ENV === 'development';
  // 在开发模式下，允许使用测试凭据
  return isDev || (msalConfig.auth.clientId && msalConfig.auth.clientSecret);
};

// 创建MSAL客户端实例或返回null
let msalClient: ConfidentialClientApplication | null = null;
if (isMsalConfigValid()) {
  try {
    msalClient = new ConfidentialClientApplication(msalConfig);
  } catch (error) {
    console.warn('MSAL客户端初始化失败，将在开发模式下使用模拟功能:', error);
    msalClient = null;
  }
}

// 模拟用户数据 (用于开发测试)
const mockUser = {
  id: 'microsoft_123456',
  email: 'test@example.com',
  name: 'Test User',
  microsoftId: '123456',
  role: 'student',
  grade: '9',
  avatarColor: '#8b5cf6'
};

// 获取认证URL
export const getAuthUrl = async (redirectUri?: string, state?: string): Promise<string> => {
  // 开发模式下返回模拟URL（重定向到后端回调）
  if (!msalClient) {
    console.log('开发模式: 使用模拟的Microsoft登录URL');
    const backendUrl = process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback';
    return `${backendUrl}?code=mock-code&state=${state || 'mock-state'}`;
  }
  
  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: (process.env.MSAL_SCOPES || 'user.read,email,profile,openid').split(','),
    redirectUri: redirectUri || process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback',
    state: state,
  };

  try {
    const response = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
    return response;
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw new Error('Failed to generate authentication URL');
  }
};

// 通过授权码获取令牌
export const getTokenByCode = async (code: string, redirectUri?: string): Promise<TokenResponse> => {
  // 开发模式下返回模拟令牌
  if (!msalClient || code === 'mock-code') {
    console.log('开发模式: 使用模拟的Microsoft令牌响应');
    return {
      accessToken: 'mock-access-token',
      idToken: {
        claims: {
          sub: '123456',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'test@example.com',
          given_name: 'Test',
        },
      } as any,
      expiresOn: new Date(Date.now() + 3600000),
      tokenType: 'Bearer',
      scopes: ['user.read', 'email', 'profile', 'openid'],
    };
  }
  
  const tokenRequest: AuthCodeRequest = {
    code,
    scopes: (process.env.MSAL_SCOPES || 'user.read,email,profile,openid').split(','),
    redirectUri: redirectUri || process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback',
  };

  try {
    const response = await msalClient.acquireTokenByCode(tokenRequest);
    return response;
  } catch (error) {
    console.error('Error acquiring token by code:', error);
    throw new Error('Failed to acquire token');
  }
};

// 处理用户登录并创建/更新本地用户
export const handleLogin = async (code: string, redirectUri?: string): Promise<{ user: User; token: string; refreshToken: string }> => {
  // 获取令牌
  const tokenResponse = await getTokenByCode(code, redirectUri);
  
  // 从令牌响应中提取用户信息
  const { idToken } = tokenResponse;
  const userInfo = idToken?.claims || {};

  // 生成唯一用户ID
  const microsoftId = userInfo.sub as string || '123456';
  const userId = `microsoft_${microsoftId}`;
  const email = userInfo.email as string || userInfo.preferred_username as string || 'test@example.com';
  const name = userInfo.name as string || 'Microsoft User';
  
  // 使用专用的Microsoft用户创建函数处理用户同步
  // 在开发模式下，如果是模拟令牌，也确保用户被创建到数据库
  const microsoftData = {
    id: userId,
    email: email,
    name: name,
    microsoftId,
    role: 'student' // 默认角色
  };
  
  // 确保用户存在于数据库中（如果不存在则创建，如果存在则更新）
  const user = await createUserFromMicrosoft(microsoftData);
  console.log('Microsoft user synchronized successfully:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
  
  // 生成JWT令牌和刷新令牌
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return { user, token, refreshToken };
};

// 检查MSAL配置是否可用
export const isMsalAvailable = (): boolean => {
  return !!msalClient;
};

// 导出 msalService 对象（用于向后兼容）
export const msalService = {
  getAuthUrl,
  handleLogin,
  isMsalAvailable
};