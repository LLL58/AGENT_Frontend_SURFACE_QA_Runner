import type { SurfaceRoute } from '../core/types.js';

/**
 * 示例路由配置
 */
export const routes: SurfaceRoute[] = [
  {
    id: 'home',
    name: '主页',
    url: '/',
    requireLogin: false,
  },
  {
    id: 'login',
    name: '登录页',
    url: '/login',
    requireLogin: false,
  },
  {
    id: 'dashboard',
    name: '仪表盘',
    url: '/dashboard',
    requireLogin: false,
  },
  {
    id: 'profile',
    name: '个人资料',
    url: '/profile',
    requireLogin: false,
  },
  {
    id: 'error',
    name: '错误页面',
    url: '/error',
    requireLogin: false,
  },
  {
    id: 'white-screen',
    name: '白屏页面',
    url: '/white-screen',
    requireLogin: false,
  },
  {
    id: 'slow',
    name: '慢响应页面',
    url: '/slow',
    requireLogin: false,
  },
  {
    id: 'form',
    name: '表单验证页面',
    url: '/form',
    requireLogin: false,
  },
  {
    id: 'admin',
    name: '权限页面',
    url: '/admin',
    requireLogin: false,
  },
];
