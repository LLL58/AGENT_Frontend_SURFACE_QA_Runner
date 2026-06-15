/**
 * Surface QA 沙盒测试应用 - 应用逻辑
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  console.log('应用已加载');
  
  // 初始化各个页面的功能
  initSearch();
  initLogin();
  initDashboard();
  initProfile();
  initErrorPage();
  initSlowPage();
  initFormValidation();
  initAdminPage();
});

/**
 * 初始化搜索功能
 */
function initSearch() {
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  const searchResult = document.getElementById('search-result');
  
  if (searchButton && searchInput && searchResult) {
    searchButton.addEventListener('click', function() {
      const query = searchInput.value.trim();
      if (query) {
        searchResult.style.display = 'block';
        searchResult.innerHTML = `<p>搜索 "${query}" 的结果：</p><ul><li>结果 1</li><li>结果 2</li><li>结果 3</li></ul>`;
        console.log('搜索:', query);
      } else {
        alert('请输入搜索关键词');
      }
    });
    
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchButton.click();
      }
    });
  }
}

/**
 * 初始化登录功能
 */
function initLogin() {
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // 验证
      let hasError = false;
      
      if (!username) {
        showFieldError('username-error', '请输入用户名');
        hasError = true;
      } else {
        hideFieldError('username-error');
      }
      
      if (!password) {
        showFieldError('password-error', '请输入密码');
        hasError = true;
      } else if (password.length < 6) {
        showFieldError('password-error', '密码至少 6 个字符');
        hasError = true;
      } else {
        hideFieldError('password-error');
      }
      
      if (hasError) return;
      
      // 模拟登录请求
      console.log('尝试登录:', username);
      
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showMessage(loginMessage, '登录成功！正在跳转...', 'success');
            setTimeout(function() {
              window.location.href = '/dashboard';
            }, 1000);
          } else {
            showMessage(loginMessage, '登录失败：' + data.message, 'error');
          }
        })
        .catch(error => {
          showMessage(loginMessage, '登录失败：网络错误', 'error');
          console.error('登录错误:', error);
        });
    });
    
    // 忘记密码
    const forgotPassword = document.getElementById('forgot-password');
    if (forgotPassword) {
      forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        alert('密码重置功能暂未实现');
      });
    }
    
    // 注册
    const register = document.getElementById('register');
    if (register) {
      register.addEventListener('click', function(e) {
        e.preventDefault();
        alert('注册功能暂未实现');
      });
    }
  }
}

/**
 * 初始化仪表盘功能
 */
function initDashboard() {
  const refreshButton = document.getElementById('refresh-button');
  const exportButton = document.getElementById('export-button');
  
  if (refreshButton) {
    refreshButton.addEventListener('click', function() {
      console.log('刷新数据');
      alert('数据已刷新');
    });
  }
  
  if (exportButton) {
    exportButton.addEventListener('click', function() {
      console.log('导出数据');
      alert('数据导出功能暂未实现');
    });
  }
}

/**
 * 初始化个人资料功能
 */
function initProfile() {
  const profileForm = document.getElementById('profile-form');
  const profileMessage = document.getElementById('profile-message');
  const editButton = document.getElementById('edit-button');
  const cancelButton = document.getElementById('cancel-button');
  const uploadAvatar = document.getElementById('upload-avatar');
  
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const bio = document.getElementById('bio').value;
      
      console.log('保存资料:', { name, email, phone, bio });
      
      // 模拟保存请求
      fetch('/api/users/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, bio }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showMessage(profileMessage, '资料保存成功！', 'success');
          } else {
            showMessage(profileMessage, '保存失败：' + data.message, 'error');
          }
        })
        .catch(error => {
          showMessage(profileMessage, '保存失败：网络错误', 'error');
          console.error('保存错误:', error);
        });
    });
  }
  
  if (editButton) {
    editButton.addEventListener('click', function() {
      console.log('编辑资料');
      alert('编辑模式已开启');
    });
  }
  
  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      console.log('取消编辑');
      window.location.reload();
    });
  }
  
  if (uploadAvatar) {
    uploadAvatar.addEventListener('click', function() {
      console.log('上传头像');
      alert('头像上传功能暂未实现');
    });
  }
}

/**
 * 初始化错误页面功能
 */
function initErrorPage() {
  const triggerError = document.getElementById('trigger-error');
  const triggerNetworkError = document.getElementById('trigger-network-error');
  const triggerAsyncError = document.getElementById('trigger-async-error');
  const triggerConsoleError = document.getElementById('trigger-console-error');
  const errorOutput = document.getElementById('error-output');
  const errorMessage = document.getElementById('error-message');
  
  if (triggerError) {
    triggerError.addEventListener('click', function() {
      console.log('触发 JavaScript 错误');
      // 故意触发一个错误
      undefinedFunction();
    });
  }
  
  if (triggerNetworkError) {
    triggerNetworkError.addEventListener('click', function() {
      console.log('触发网络请求错误');
      // 请求不存在的 API
      fetch('/api/non-existent')
        .then(function(response) {
          if (!response.ok) {
            throw new Error('网络请求失败: ' + response.status);
          }
          return response.json();
        })
        .catch(function(error) {
          showError(errorOutput, errorMessage, error.message);
        });
    });
  }
  
  if (triggerAsyncError) {
    triggerAsyncError.addEventListener('click', function() {
      console.log('触发异步错误');
      // 在异步操作中抛出错误
      setTimeout(function() {
        try {
          JSON.parse('invalid json');
        } catch (error) {
          showError(errorOutput, errorMessage, '异步错误: ' + error.message);
        }
      }, 100);
    });
  }
  
  if (triggerConsoleError) {
    triggerConsoleError.addEventListener('click', function() {
      console.log('触发控制台错误');
      console.error('这是一个故意触发的控制台错误');
      showError(errorOutput, errorMessage, '控制台错误已输出');
    });
  }
}

/**
 * 初始化慢响应页面功能
 */
function initSlowPage() {
  const slowRequest = document.getElementById('slow-request');
  const timeoutRequest = document.getElementById('timeout-request');
  const fastRequest = document.getElementById('fast-request');
  const slowResult = document.getElementById('slow-result');
  const timeoutResult = document.getElementById('timeout-result');
  const fastResult = document.getElementById('fast-result');
  const requestLog = document.getElementById('request-log');
  const logContent = document.getElementById('log-content');
  
  function addLog(message) {
    if (requestLog && logContent) {
      requestLog.style.display = 'block';
      const time = new Date().toLocaleTimeString();
      logContent.textContent += `[${time}] ${message}\n`;
    }
  }
  
  if (slowRequest) {
    slowRequest.addEventListener('click', function() {
      console.log('发送慢请求');
      slowResult.style.display = 'block';
      addLog('发送慢请求...');
      
      fetch('/api/slow')
        .then(response => response.json())
        .then(data => {
          slowResult.innerHTML = '请求成功！';
          addLog('慢请求完成: ' + JSON.stringify(data));
        })
        .catch(error => {
          slowResult.innerHTML = '请求失败: ' + error.message;
          addLog('慢请求失败: ' + error.message);
        });
    });
  }
  
  if (timeoutRequest) {
    timeoutRequest.addEventListener('click', function() {
      console.log('发送超时请求');
      timeoutResult.style.display = 'block';
      addLog('发送超时请求...');
      
      // 设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      fetch('/api/timeout', { signal: controller.signal })
        .then(response => response.json())
        .then(data => {
          clearTimeout(timeoutId);
          timeoutResult.innerHTML = '请求成功！';
          addLog('超时请求完成: ' + JSON.stringify(data));
        })
        .catch(error => {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            timeoutResult.innerHTML = '请求超时！';
            addLog('超时请求超时');
          } else {
            timeoutResult.innerHTML = '请求失败: ' + error.message;
            addLog('超时请求失败: ' + error.message);
          }
        });
    });
  }
  
  if (fastRequest) {
    fastRequest.addEventListener('click', function() {
      console.log('发送快速请求');
      fastResult.style.display = 'block';
      addLog('发送快速请求...');
      
      fetch('/api/users')
        .then(response => response.json())
        .then(data => {
          fastResult.innerHTML = '请求成功！获取到 ' + data.length + ' 个用户';
          addLog('快速请求完成: 获取到 ' + data.length + ' 个用户');
        })
        .catch(error => {
          fastResult.innerHTML = '请求失败: ' + error.message;
          addLog('快速请求失败: ' + error.message);
        });
    });
  }
}

/**
 * 初始化表单验证页面功能
 */
function initFormValidation() {
  const validationForm = document.getElementById('validation-form');
  const validationMessage = document.getElementById('validation-message');
  const testErrorsButton = document.getElementById('val-test-errors');
  const resetButton = document.getElementById('val-reset');
  
  if (validationForm) {
    validationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // 清除所有错误
      clearAllErrors();
      
      // 验证表单
      let hasError = false;
      
      // 姓名验证
      const name = document.getElementById('val-name').value;
      if (!name) {
        showFieldError('val-name-error', '姓名不能为空');
        hasError = true;
      } else if (name.length < 2) {
        showFieldError('val-name-error', '姓名至少 2 个字符');
        hasError = true;
      }
      
      // 邮箱验证
      const email = document.getElementById('val-email').value;
      if (!email) {
        showFieldError('val-email-error', '邮箱不能为空');
        hasError = true;
      } else if (!isValidEmail(email)) {
        showFieldError('val-email-error', '邮箱格式不正确');
        hasError = true;
      }
      
      // 密码验证
      const password = document.getElementById('val-password').value;
      if (!password) {
        showFieldError('val-password-error', '密码不能为空');
        hasError = true;
      } else if (password.length < 6) {
        showFieldError('val-password-error', '密码至少 6 个字符');
        hasError = true;
      }
      
      // 确认密码验证
      const confirmPassword = document.getElementById('val-confirm-password').value;
      if (!confirmPassword) {
        showFieldError('val-confirm-password-error', '请再次输入密码');
        hasError = true;
      } else if (confirmPassword !== password) {
        showFieldError('val-confirm-password-error', '两次输入的密码不一致');
        hasError = true;
      }
      
      // 年龄验证
      const age = document.getElementById('val-age').value;
      if (!age) {
        showFieldError('val-age-error', '年龄不能为空');
        hasError = true;
      } else if (isNaN(age) || age < 1 || age > 120) {
        showFieldError('val-age-error', '年龄必须是 1-120 之间的数字');
        hasError = true;
      }
      
      // 网站验证（可选）
      const website = document.getElementById('val-website').value;
      if (website && !isValidUrl(website)) {
        showFieldError('val-website-error', '网站地址格式不正确');
        hasError = true;
      }
      
      // 同意条款验证
      const agree = document.getElementById('val-agree').checked;
      if (!agree) {
        showFieldError('val-agree-error', '请同意服务条款');
        hasError = true;
      }
      
      if (hasError) {
        showMessage(validationMessage, '表单验证失败，请检查输入', 'error');
        console.error('表单验证失败');
      } else {
        showMessage(validationMessage, '表单验证成功！', 'success');
        console.log('表单验证成功');
      }
    });
  }
  
  if (testErrorsButton) {
    testErrorsButton.addEventListener('click', function() {
      // 故意触发所有验证错误
      document.getElementById('val-name').value = '';
      document.getElementById('val-email').value = 'invalid-email';
      document.getElementById('val-password').value = '123';
      document.getElementById('val-confirm-password').value = '456';
      document.getElementById('val-age').value = '200';
      document.getElementById('val-website').value = 'invalid-url';
      document.getElementById('val-agree').checked = false;
      
      // 触发提交
      validationForm.dispatchEvent(new Event('submit'));
    });
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      clearAllErrors();
      validationForm.reset();
      if (validationMessage) {
        validationMessage.style.display = 'none';
      }
    });
  }
}

/**
 * 初始化权限页面功能
 */
function initAdminPage() {
  const getUsersButton = document.getElementById('get-users');
  const deleteUserButton = document.getElementById('delete-user');
  const systemSettingsButton = document.getElementById('system-settings');
  const usersResult = document.getElementById('users-result');
  const deleteResult = document.getElementById('delete-result');
  const settingsResult = document.getElementById('settings-result');
  const adminLog = document.getElementById('admin-log');
  const adminLogContent = document.getElementById('admin-log-content');
  
  function addAdminLog(message) {
    if (adminLog && adminLogContent) {
      adminLog.style.display = 'block';
      const time = new Date().toLocaleTimeString();
      adminLogContent.textContent += `[${time}] ${message}\n`;
    }
  }
  
  if (getUsersButton) {
    getUsersButton.addEventListener('click', function() {
      console.log('获取用户列表');
      usersResult.style.display = 'block';
      addAdminLog('请求 GET /api/users');
      
      fetch('/api/users')
        .then(response => {
          addAdminLog('响应: ' + response.status);
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          usersResult.innerHTML = '获取成功：' + JSON.stringify(data);
          addAdminLog('成功: 获取到 ' + data.length + ' 个用户');
        })
        .catch(error => {
          usersResult.innerHTML = '获取失败：' + error.message;
          addAdminLog('失败: ' + error.message);
        });
    });
  }
  
  if (deleteUserButton) {
    deleteUserButton.addEventListener('click', function() {
      console.log('删除用户');
      deleteResult.style.display = 'block';
      addAdminLog('请求 DELETE /api/users/1');
      
      // 模拟删除请求（会返回 403）
      fetch('/api/forbidden')
        .then(response => {
          addAdminLog('响应: ' + response.status);
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          deleteResult.innerHTML = '删除成功';
          addAdminLog('成功: 用户已删除');
        })
        .catch(error => {
          deleteResult.innerHTML = '删除失败：' + error.message;
          addAdminLog('失败: ' + error.message);
        });
    });
  }
  
  if (systemSettingsButton) {
    systemSettingsButton.addEventListener('click', function() {
      console.log('系统设置');
      settingsResult.style.display = 'block';
      addAdminLog('请求 GET /api/unauthorized');
      
      // 模拟未授权请求
      fetch('/api/unauthorized')
        .then(response => {
          addAdminLog('响应: ' + response.status);
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          settingsResult.innerHTML = '获取成功';
          addAdminLog('成功: 获取系统设置');
        })
        .catch(error => {
          settingsResult.innerHTML = '获取失败：' + error.message;
          addAdminLog('失败: ' + error.message);
        });
    });
  }
}

/**
 * 显示消息
 */
function showMessage(element, message, type) {
  if (element) {
    element.textContent = message;
    element.className = 'message ' + type;
    element.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(function() {
      element.style.display = 'none';
    }, 3000);
  }
}

/**
 * 显示错误
 */
function showError(outputElement, messageElement, message) {
  if (outputElement && messageElement) {
    messageElement.textContent = message;
    outputElement.style.display = 'block';
    console.error(message);
  }
}

/**
 * 显示字段错误
 */
function showFieldError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

/**
 * 隐藏字段错误
 */
function hideFieldError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}

/**
 * 清除所有错误
 */
function clearAllErrors() {
  const errorElements = document.querySelectorAll('.error');
  errorElements.forEach(element => {
    element.style.display = 'none';
  });
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证 URL 格式
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 导出函数供测试使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSearch,
    initLogin,
    initDashboard,
    initProfile,
    initErrorPage,
    initSlowPage,
    initFormValidation,
    initAdminPage,
    showMessage,
    showError,
    showFieldError,
    hideFieldError,
    clearAllErrors,
    isValidEmail,
    isValidUrl,
  };
}
