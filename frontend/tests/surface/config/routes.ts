import type { SurfaceRoute } from '../core/types.js';

/**
 * 示例路由配置
 */
export const routes: SurfaceRoute[] = [
  {
    id: 'login',
    name: '登录页',
    url: '/login',
    requireLogin: false,
  },
  {
    id: 'dashboard',
    name: '首页',
    url: '/dashboard',
    requireLogin: true,
  },
  {
    id: 'profile',
    name: '个人资料',
    url: '/profile',
    requireLogin: true,
  },
];
