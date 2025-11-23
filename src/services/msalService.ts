import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest, tokenRequest } from '../utils/msalConfig';
import axios from 'axios';

class MsalService {
  private msalInstance: PublicClientApplication;
  private isInitialized: boolean = false;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.msalInstance.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error('MSAL初始化失败:', error);
    }
  }

  // 检查是否有已登录账户
  async getAccount() {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts[0] || null;
  }

  // 启动Microsoft登录流程
  async signIn() {
    try {
      // 首先检查是否已登录
      const account = await this.getAccount();
      if (account) {
        return account;
      }

      // 发起登录请求
      const authResult = await this.msalInstance.loginPopup(loginRequest);
      return authResult.account;
    } catch (error) {
      console.error('Microsoft登录失败:', error);
      throw error;
    }
  }

  // 使用重定向方式登录
  signInRedirect() {
    try {
      return this.msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Microsoft重定向登录失败:', error);
      throw error;
    }
  }

  // 处理重定向回调
  async handleRedirectCallback() {
    try {
      const authResult = await this.msalInstance.handleRedirectPromise();
      if (authResult) {
        return authResult.account;
      }
      return null;
    } catch (error) {
      console.error('处理重定向回调失败:', error);
      throw error;
    }
  }

  // 获取访问令牌
  async getToken(): Promise<string | null> {
    try {
      const account = await this.getAccount();
      if (!account) {
        return null;
      }

      const silentRequest = {
        ...tokenRequest,
        account,
      };

      // 尝试静默获取令牌
      const authResult = await this.msalInstance.acquireTokenSilent(silentRequest);
      return authResult.accessToken;
    } catch (error) {
      console.error('获取令牌失败:', error);
      
      // 如果静默获取失败，尝试交互方式获取
      try {
        const account = await this.getAccount();
        if (!account) {
          return null;
        }
        
        const interactiveRequest = {
          ...tokenRequest,
          account,
        };
        
        const authResult = await this.msalInstance.acquireTokenPopup(interactiveRequest);
        return authResult.accessToken;
      } catch (popupError) {
        console.error('交互方式获取令牌失败:', popupError);
        return null;
      }
    }
  }

  // 注销登录
  async signOut() {
    try {
      const account = await this.getAccount();
      if (!account) {
        return;
      }

      await this.msalInstance.logoutPopup({
        account,
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
      });
    } catch (error) {
      console.error('Microsoft注销失败:', error);
      throw error;
    }
  }

  // 后端验证并完成登录
  async verifyWithBackend(accessToken: string): Promise<any> {
    try {
      const response = await axios.post('/api/auth/msal/verify', {
        token: accessToken,
      }, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('后端验证失败:', error);
      throw error;
    }
  }

  // 开始完整的M365 SSO登录流程
  async msalLoginFlow(): Promise<any> {
    try {
      // 1. 登录Microsoft账户
      const account = await this.signIn();
      if (!account) {
        throw new Error('未获取到Microsoft账户信息');
      }

      // 2. 获取访问令牌
      const accessToken = await this.getToken();
      if (!accessToken) {
        throw new Error('未获取到访问令牌');
      }

      // 3. 向后端验证令牌并完成登录
      const backendResponse = await this.verifyWithBackend(accessToken);
      
      return backendResponse;
    } catch (error) {
      console.error('M365 SSO登录流程失败:', error);
      throw error;
    }
  }
}

// 导出单例
export default new MsalService();