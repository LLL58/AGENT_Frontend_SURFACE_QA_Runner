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
];
