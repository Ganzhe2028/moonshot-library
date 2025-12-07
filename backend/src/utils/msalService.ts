// 确保在导入其他模块前加载环境变量
// 由于模块加载顺序，这里也需要加载 .env 以确保环境变量可用
import dotenv from 'dotenv';
import path from 'path';
// 从 backend 目录加载 .env 文件
// 使用 process.cwd() 获取项目根目录，然后定位到 backend/.env
const backendDir = path.resolve(process.cwd());
const envPath = path.join(backendDir, '.env');
dotenv.config({ path: envPath });

import { AuthorizationUrlRequest, ConfidentialClientApplication, Configuration } from '@azure/msal-node';
// 为不支持的MSAL类型定义自定义类型
type AuthCodeRequest = {
  code: string;
  scopes: string[];
  redirectUri: string;
};

// 为MSAL响应定义兼容的TokenResponse类型
type TokenResponse = {
  accessToken: string;
  idToken: string | {
    claims: Record<string, unknown>;
  };
  expiresOn: Date;
  tokenType: string;
  scopes: string[];
};
import { User } from '../types';
import { createUserFromMicrosoft } from '../models/user';
import { generateRefreshToken, generateToken } from './auth';

// 创建MSAL配置
const isDev = process.env.NODE_ENV === 'development';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID || '',
    clientSecret: process.env.MSAL_CLIENT_SECRET || '',
    authority: process.env.MSAL_AUTHORITY || 'https://login.microsoftonline.com/common'
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => {
        if (!containsPii) {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3
    }
  }
};

// 检查MSAL凭据是否有效
const isMsalConfigValid = () => {
  const hasClientId = !!msalConfig.auth.clientId && msalConfig.auth.clientId !== 'MSAL_CLIENT_ID';
  const hasClientSecret = !!msalConfig.auth.clientSecret && msalConfig.auth.clientSecret !== 'CLIENT_SECRET';

  // 添加详细的验证日志
  console.log('MSAL配置验证:');
  console.log(`  环境: ${process.env.NODE_ENV}`);
  console.log(`  有ClientId: ${hasClientId}`);
  console.log(`  ClientId长度: ${msalConfig.auth.clientId ? msalConfig.auth.clientId.length : 0}`);
  console.log(`  有ClientSecret: ${hasClientSecret}`);
  console.log(`  ClientSecret长度: ${msalConfig.auth.clientSecret ? msalConfig.auth.clientSecret.length : 0}`);

  // 在开发模式下，允许使用测试凭据
  const isValid = isDev || (hasClientId && hasClientSecret);
  console.log(`  配置有效性: ${isValid}`);
  return isValid;
};

// 创建MSAL客户端实例或返回null
let msalClient: ConfidentialClientApplication | null = null;
console.log('开始MSAL客户端初始化...');
if (isMsalConfigValid()) {
  try {
    console.log('尝试创建MSAL客户端实例...');
    // 只有在凭据为空时才使用模拟功能
    // 如果配置了有效的凭据，即使在开发模式下也使用真实的MSAL客户端
    if (!msalConfig.auth.clientId || !msalConfig.auth.clientSecret) {
      console.log('MSAL凭据不完整，将使用模拟功能');
      msalClient = null;
    } else {
      msalClient = new ConfidentialClientApplication(msalConfig);
      console.log('MSAL客户端初始化成功!');
      if (isDev) {
        console.log('注意：当前为开发模式，但已配置真实的MSAL凭据，将使用真实的Microsoft 365登录');
      }
    }
  } catch (error) {
    console.warn('MSAL客户端初始化失败:', error);
    // 初始化失败时回退到模拟功能
    console.log('MSAL初始化失败，将使用模拟功能');
    msalClient = null;
  }
} else {
  console.log('MSAL配置无效，将使用模拟功能');
}

// 验证MSAL凭据有效性的辅助函数

// 获取认证URL
export const getAuthUrl = async (redirectUri?: string, state?: string): Promise<string> => {

  // 在没有msalClient时使用模拟URL，无论开发还是生产环境
  if (!msalClient) {
    console.log('使用模拟的Microsoft登录URL');
    const backendUrl = process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback';
    return `${backendUrl}?code=mock-code&state=${state || 'mock-state'}`;
  }

  // 使用类型断言来处理AuthorizationUrlRequest
  const authCodeUrlParameters = {
    scopes: (process.env.MSAL_SCOPES || 'user.read,email,profile,openid').split(','),
    redirectUri: redirectUri || process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback',
    state: state || ''
  } as AuthorizationUrlRequest;

  try {
    const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
    return authUrl;
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw new Error('Failed to generate authentication URL');
  }
};

// 通过授权码获取令牌
export const getTokenByCode = async (code: string, redirectUri?: string): Promise<TokenResponse> => {

  // 在没有msalClient或使用mock-code时返回模拟令牌，无论开发还是生产环境
  if (!msalClient || code === 'mock-code') {
    console.log('使用模拟的Microsoft令牌响应');
    return {
      accessToken: 'mock-access-token',
      idToken: {
        claims: {
          sub: '123456',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'test@example.com',
          given_name: 'Test'
        }
      },
      expiresOn: new Date(Date.now() + 3600000),
      tokenType: 'Bearer',
      scopes: ['user.read', 'email', 'profile', 'openid']
    };
  }

  const tokenRequest: AuthCodeRequest = {
    code,
    scopes: (process.env.MSAL_SCOPES || 'user.read,email,profile,openid').split(','),
    redirectUri: redirectUri || process.env.MSAL_REDIRECT_URI || 'http://localhost:3000/api/auth/msal/callback'
  };

  try {
    const result = await msalClient.acquireTokenByCode(tokenRequest);
    // 适配MSAL的AuthenticationResult到我们的TokenResponse类型
    return {
      accessToken: result.accessToken,
      idToken: {
        claims: result.idTokenClaims || {}
      },
      expiresOn: result.expiresOn || new Date(),
      tokenType: result.tokenType || 'Bearer',
      scopes: result.scopes || []
    } as TokenResponse;
  } catch (error) {
    console.error('Error acquiring token by code:', error);
    throw new Error('Failed to acquire token');
  }
};

// 处理用户登录并创建/更新本地用户
export const handleLogin = async (
  code: string,
  redirectUri?: string
): Promise<{ user: User; token: string; refreshToken: string }> => {
  // 获取令牌
  const tokenResponse = await getTokenByCode(code, redirectUri);

  // 从令牌响应中提取用户信息
  const { idToken } = tokenResponse;
  const userInfo = typeof idToken === 'object' && idToken?.claims ? idToken.claims : {};

  // 生成唯一用户ID
  const microsoftId = userInfo.sub as string || '123456';
  const userId = `microsoft_${microsoftId}`;
  const email = userInfo.email as string || userInfo.preferred_username as string || 'test@example.com';
  const name = userInfo.name as string || 'Microsoft User';

  // 使用专用的Microsoft用户创建函数处理用户同步
  // 在开发模式下，如果是模拟令牌，也确保用户被创建到数据库
  const microsoftData = {
    id: userId,
    email,
    name,
    microsoftId,
    role: 'student' as const // 默认角色，使用as const确保类型符合联合类型要求
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
