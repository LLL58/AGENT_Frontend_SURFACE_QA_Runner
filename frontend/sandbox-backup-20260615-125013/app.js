/**
 * Surface QA 测试应用 - 应用逻辑
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
      
      if (!username || !password) {
        showMessage(loginMessage, '请填写用户名和密码', 'error');
        return;
      }
      
      // 模拟登录请求
      console.log('尝试登录:', username);
      
      // 模拟成功登录
      setTimeout(function() {
        showMessage(loginMessage, '登录成功！正在跳转...', 'success');
        setTimeout(function() {
          window.location.href = '/dashboard';
        }, 1000);
      }, 500);
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
      setTimeout(function() {
        showMessage(profileMessage, '资料保存成功！', 'success');
      }, 500);
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

// 导出函数供测试使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSearch,
    initLogin,
    initDashboard,
    initProfile,
    initErrorPage,
    showMessage,
    showError
  };
}
