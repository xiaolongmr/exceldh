/**
 * Neon 用户资料管理模块
 * 替换Firebase版本的账号设置功能
 */

import { TokenUtils } from './neon-db.js';
import { API_BASE_URL } from '../api/neon-config.js';

/**
 * 获取认证头部
 */
function getAuthHeaders() {
    const token = TokenUtils.getStoredToken();
    if (!token) {
        throw new Error('未找到认证令牌');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/**
 * 打开账号设置弹窗
 */
window.openAccountSettings = async function () {
    try {
        const modal = document.getElementById('account-settings-modal');
        if (!modal) {
            console.error('未找到账号设置弹窗');
            return;
        }

        modal.style.display = 'flex';

        // 获取当前用户信息
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('获取用户信息失败');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '获取用户信息失败');
        }

        const profile = result.profile;

        // 预填资料
        const avatarPreview = document.getElementById('avatar-preview');
        const nicknameInput = document.getElementById('nickname-input');
        const emailInput = document.getElementById('email-input');
        const bioInput = document.getElementById('bio-input');
        const registerTime = document.getElementById('register-time');
        const verifyEmailBtn = document.getElementById('verify-email-btn');
        const emailVerifiedStatus = document.getElementById('email-verified-status');

        if (avatarPreview) {
            avatarPreview.src = profile.avatar || 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
            avatarPreview.removeAttribute('data-uploaded');
        }

        if (nicknameInput) {
            nicknameInput.value = profile.nickname || profile.displayName || '';
        }

        if (emailInput) {
            emailInput.value = profile.email || '';
            emailInput.readOnly = true;
        }

        if (bioInput) {
            bioInput.value = profile.bio || '';
        }

        // 注册时间
        if (registerTime && profile.createdAt) {
            const date = new Date(profile.createdAt);
            registerTime.textContent = date.toLocaleString('zh-CN');
        } else if (registerTime) {
            registerTime.textContent = '未知';
        }

        // 邮箱验证状态
        if (profile.isEmailVerified) {
            if (verifyEmailBtn) verifyEmailBtn.style.display = 'none';
            if (emailVerifiedStatus) emailVerifiedStatus.textContent = '已验证';
        } else {
            if (verifyEmailBtn && !profile.isAnonymous) {
                verifyEmailBtn.style.display = 'inline-block';
                verifyEmailBtn.onclick = () => sendVerificationEmail();
            }
            if (emailVerifiedStatus) emailVerifiedStatus.textContent = '未验证';
        }

    } catch (error) {
        console.error('打开账号设置失败:', error);
        alert('获取用户信息失败：' + error.message);
    }
};

/**
 * 关闭账号设置弹窗
 */
window.closeAccountSettings = function () {
    const modal = document.getElementById('account-settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

/**
 * 保存用户资料
 */
window.saveUserProfile = async function () {
    try {
        const nicknameInput = document.getElementById('nickname-input');
        const bioInput = document.getElementById('bio-input');
        const saveBtn = document.getElementById('save-profile-btn');

        if (!nicknameInput || !bioInput) {
            throw new Error('表单元素未找到');
        }

        const nickname = nicknameInput.value.trim();
        const bio = bioInput.value.trim();

        if (!nickname) {
            alert('昵称不能为空');
            nicknameInput.focus();
            return;
        }

        // 显示加载状态
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                nickname,
                bio,
                displayName: nickname
            })
        });

        if (!response.ok) {
            throw new Error('保存失败');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '保存失败');
        }

        alert('保存成功！');

        // 更新全局用户资料
        if (window.userProfile) {
            window.userProfile.nickname = nickname;
            window.userProfile.bio = bio;
        }

        // 更新UI中的用户头像显示
        if (window.authManager && window.authManager.updateUserAvatar) {
            window.authManager.updateUserAvatar();
        }

    } catch (error) {
        console.error('保存用户资料失败:', error);
        alert('保存失败：' + error.message);
    } finally {
        // 恢复按钮状态
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '保存资料';
        }
    }
};

/**
 * 头像上传功能
 */
function initAvatarUpload() {
    const uploadBtn = document.getElementById('avatar-upload-btn');
    const uploadInput = document.getElementById('avatar-upload');
    const cropperArea = document.getElementById('avatar-cropper-area');
    const cropperImg = document.getElementById('avatar-cropper-img');
    const confirmBtn = document.getElementById('avatar-cropper-confirm');
    const cancelBtn = document.getElementById('avatar-cropper-cancel');
    const avatarPreview = document.getElementById('avatar-preview');
    const loadingDiv = document.getElementById('avatar-loading');

    let cropper = null;

    if (uploadBtn && uploadInput) {
        uploadBtn.onclick = () => uploadInput.click();

        uploadInput.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件');
                return;
            }

            // 检查文件大小 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('图片大小不能超过5MB');
                return;
            }

            // 读取文件并显示裁剪界面
            const reader = new FileReader();
            reader.onload = function(e) {
                cropperImg.src = e.target.result;
                cropperArea.style.display = 'block';

                // 初始化裁剪器
                if (cropper) {
                    cropper.destroy();
                }
                
                if (typeof Cropper !== 'undefined') {
                    cropper = new Cropper(cropperImg, {
                        aspectRatio: 1,
                        viewMode: 1,
                        autoCropArea: 0.8,
                        responsive: true,
                        restore: false,
                        guides: false,
                        center: false,
                        highlight: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                    });
                }
            };
            reader.readAsDataURL(file);
        };
    }

    if (confirmBtn) {
        confirmBtn.onclick = async function() {
            if (!cropper) return;

            try {
                loadingDiv.style.display = 'flex';

                // 获取裁剪后的canvas
                const canvas = cropper.getCroppedCanvas({
                    width: 200,
                    height: 200,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                // 转换为blob
                canvas.toBlob(async (blob) => {
                    try {
                        // 这里应该上传到图片服务器，目前使用base64存储
                        const reader = new FileReader();
                        reader.onload = async function(e) {
                            const base64 = e.target.result;
                            
                            // 上传头像
                            const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ avatar: base64 })
                            });

                            if (!response.ok) {
                                throw new Error('上传头像失败');
                            }

                            const result = await response.json();
                            if (!result.success) {
                                throw new Error(result.error || '上传头像失败');
                            }

                            // 更新预览
                            avatarPreview.src = base64;
                            avatarPreview.setAttribute('data-uploaded', 'true');

                            // 更新全局用户资料
                            if (window.userProfile) {
                                window.userProfile.avatar = base64;
                            }

                            // 更新UI中的用户头像显示
                            if (window.authManager && window.authManager.updateUserAvatar) {
                                window.authManager.updateUserAvatar();
                            }

                            alert('头像上传成功！');
                            
                            // 隐藏裁剪界面
                            cropperArea.style.display = 'none';
                            if (cropper) {
                                cropper.destroy();
                                cropper = null;
                            }
                        };
                        reader.readAsDataURL(blob);
                    } catch (error) {
                        console.error('头像上传失败:', error);
                        alert('头像上传失败：' + error.message);
                    } finally {
                        loadingDiv.style.display = 'none';
                    }
                }, 'image/jpeg', 0.9);

            } catch (error) {
                console.error('头像处理失败:', error);
                alert('头像处理失败：' + error.message);
                loadingDiv.style.display = 'none';
            }
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = function() {
            cropperArea.style.display = 'none';
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            uploadInput.value = '';
        };
    }
}

/**
 * 发送邮箱验证邮件
 */
async function sendVerificationEmail() {
    try {
        // TODO: 实现邮箱验证功能
        alert('邮箱验证功能暂未实现，请联系管理员');
    } catch (error) {
        console.error('发送验证邮件失败:', error);
        alert('发送验证邮件失败：' + error.message);
    }
}

/**
 * 修改密码
 */
window.changePassword = async function() {
    const currentPassword = prompt('请输入当前密码：');
    if (!currentPassword) return;

    const newPassword = prompt('请输入新密码（至少6位）：');
    if (!newPassword || newPassword.length < 6) {
        alert('新密码至少需要6位');
        return;
    }

    const confirmPassword = prompt('请确认新密码：');
    if (newPassword !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/profile/password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            throw new Error('修改密码失败');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '修改密码失败');
        }

        alert('密码修改成功！');

    } catch (error) {
        console.error('修改密码失败:', error);
        alert('修改密码失败：' + error.message);
    }
};

/**
 * 删除账号
 */
window.deleteAccount = async function() {
    if (!confirm('确定要删除账号吗？此操作不可恢复！')) {
        return;
    }

    const password = prompt('请输入密码确认删除：');
    if (!password) return;

    try {
        const response = await fetch(`${API_BASE_URL}/profile/delete`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            throw new Error('删除账号失败');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '删除账号失败');
        }

        alert('账号已删除');
        
        // 清除本地数据并登出
        TokenUtils.removeStoredToken();
        if (window.authManager) {
            window.authManager.handleUserLogout();
        }

    } catch (error) {
        console.error('删除账号失败:', error);
        alert('删除账号失败：' + error.message);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定保存按钮事件
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) {
        saveBtn.onclick = saveUserProfile;
    }

    // 初始化头像上传功能
    initAvatarUpload();

    // 图标预览功能
    const iconInput = document.getElementById('fav-form-icon');
    const iconPreview = document.getElementById('icon-preview-img-html');
    if (iconInput && iconPreview) {
        iconInput.oninput = function() {
            const url = this.value.trim();
            if (url) {
                iconPreview.src = url;
                iconPreview.onerror = function() {
                    this.src = 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
                    this.onerror = null;
                };
            } else {
                iconPreview.src = 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
            }
        };
    }
});

// 导出主要函数
export { 
    openAccountSettings, 
    closeAccountSettings, 
    saveUserProfile, 
    changePassword, 
    deleteAccount 
};