/**
 * Neon收藏功能 - 完整版本
 * 包含编辑模式、拖拽排序等Firebase版本的完整功能
 */

console.log('📋 Neon收藏功能脚本已加载');

// 全局变量
let currentFavorites = [];
let isSelectionMode = false;
let selectedFavorites = new Set();
let isCustomizing = false; // 编辑模式标志
let orderChanged = false; // 排序变化标志
let editingFavIndex = null; // 编辑索引
let currentCategory = 'all'; // 当前选中的分类

// 全局收藏功能
window.loadFavsFromCloud = async function() {
    console.log('📋 加载收藏...');
    
    const token = localStorage.getItem('neon_auth_token');
    const favBox = document.getElementById('my-fav-box');
    
    if (!token) {
        console.log('⚠️ 用户未登录 - 隐藏收藏区域');
        // 未登录时隐藏收藏区域
        if (favBox) {
            favBox.style.display = 'none';
        }
        currentFavorites = [];
        return [];
    }
    
    // 有令牌时显示收藏区域
    if (favBox) {
        console.log('✅ 用户已登录，显示收藏区域');
        favBox.style.display = 'block';
        favBox.style.visibility = 'visible';
    }
    
    console.log('✅ 找到认证令牌，开始获取收藏数据');
    
    try {
        const response = await fetch('/api/favorites', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log(`✅ 成功加载了 ${data.favorites.length} 个收藏`);
                currentFavorites = data.favorites;
                window.renderFavs();
                return data.favorites;
            } else {
                console.log('❌ 获取收藏失败:', data.error);
                // 即使失败也显示空列表
                currentFavorites = [];
                window.renderFavs();
            }
        } else {
            console.log('❌ 获取收藏失败 - 状态码:', response.status);
            const errorText = await response.text();
            console.log('错误内容:', errorText);
            
            // 如果是令牌问题，提示用户重新登录
            if (response.status === 401 || response.status === 403) {
                console.log('⚠️ 令牌无效，需要重新登录');
                alert('登录已过期，请重新登录后查看收藏');
                localStorage.removeItem('neon_auth_token');
                // 令牌无效时隐藏收藏区域
                if (favBox) {
                    favBox.style.display = 'none';
                }
                currentFavorites = [];
            }
        }
        return [];
    } catch (error) {
        console.error('💥 加载收藏网络错误:', error);
        // 网络错误时也显示空列表
        currentFavorites = [];
        window.renderFavs();
        return [];
    }
};

// 渲染收藏 - Firebase版本完整功能
window.renderFavs = function() {
    console.log('🎨 渲染收藏...');
    
    const favList = document.getElementById('fav-list');
    if (!favList) {
        console.log('找不到 #fav-list');
        return;
    }
    
    // 清空收藏列表
    favList.innerHTML = '';
    
    // 在收藏列表外面渲染分类标签栏（单独一行）
    renderCategoryTabs();
    
    // 根据当前分类筛选收藏
    const filteredFavorites = filterFavoritesByCategory(currentFavorites, currentCategory);
    
    // 添加链接卡片
    const addCard = document.createElement('div');
    addCard.id = 'fav-add-card';
    addCard.className = 'fav-card';
    addCard.innerHTML = '<svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill: #3385ff;width: 22px;margin-right: 10px;"><path d="M577.088 0H448.96v448.512H0v128h448.96V1024h128.128V576.512H1024v-128H577.088z"></path></svg><div style="color:#3385ff;">添加链接</div>';
    addCard.onclick = window.openFavForm;
    favList.appendChild(addCard);
    
    // 渲染收藏卡片
    filteredFavorites.forEach((fav, idx) => {
        // 找到在原数组中的索引
        const originalIndex = currentFavorites.findIndex(f => f.id === fav.id);
        
        const card = document.createElement('div');
        card.className = 'fav-card';
        card.setAttribute('data-index', originalIndex);
        
        // 为卡片添加分类属性，用于tooltip显示
        if (fav.category) {
            card.setAttribute('data-category', fav.category);
        }
        
        // 在编辑模式下添加editing类
        if (isCustomizing) {
            card.classList.add('editing');
        }
        
        const iconUrl = fav.icon || `https://ico.cxr.cool/${getDomainFromUrl(fav.url)}.ico`;
        
        // 添加分类标签显示 - 完全隐藏，只在悬浮时显示tooltip
        const categoryTag = fav.category ? `<span class="fav-category-tag" data-category="${fav.category}"></span>` : '';
        
        card.innerHTML = `
            <a href="${fav.url}" target="_blank" class="fav-link">
                <img src="${iconUrl}" class="fav-icon" onerror="this.src='https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';this.onerror=null;">
                <div class="fav-context">
                    <div class="fav-title">${fav.title}</div>
                    <div class="fav-desc">${fav.description || ''}</div>
                    ${categoryTag}
                </div>
            </a>
            ${isCustomizing ? `<span onclick="removeFavorite(${originalIndex})" class="fav-remove">×</span>` : ''}
            ${isCustomizing ? `<div class="fav-drag-handle">⋮⋮</div>` : ''}
        `;
        favList.appendChild(card);
        
        // 编辑模式下点击卡片弹出编辑弹窗
        if (isCustomizing) {
            card.addEventListener('click', function(e) {
                // 避免点击删除按钮、拖拽手柄、a标签时触发编辑
                if (
                    e.target.classList.contains('fav-remove') ||
                    e.target.classList.contains('fav-drag-handle') ||
                    e.target.closest('a')
                ) {
                    return;
                }
                window.openEditFavForm(originalIndex);
            });
        }
    });
    
    // 编辑模式下初始化SortableJS
    if (isCustomizing) {
        if (window._sortableInstance) {
            window._sortableInstance.destroy();
        }
        
        // 动态加载SortableJS
        if (typeof Sortable === 'undefined') {
            loadSortableJS().then(() => {
                initSortable(favList);
            });
        } else {
            initSortable(favList);
        }
        
        // 显示编辑模式提示
        showEditModeTip();
    } else {
        if (window._sortableInstance) {
            window._sortableInstance.destroy();
            window._sortableInstance = null;
        }
    }
    
    // 更新分享控件
    if (typeof updateShareControls === 'function') {
        updateShareControls();
    }
    
    console.log(`渲染了 ${filteredFavorites.length} 个收藏（共 ${currentFavorites.length} 个）`);
};

// 渲染分类标签栏
function renderCategoryTabs() {
    // 先清除之前的分类标签栏
    const existingCategoryTabs = document.getElementById('fav-category-tabs');
    if (existingCategoryTabs) {
        existingCategoryTabs.remove();
    }
    
    // 如果没有收藏数据，不显示分类标签栏
    if (!currentFavorites || currentFavorites.length === 0) {
        return;
    }
    
    // 获取所有分类
    const categories = getUniqueCategories(currentFavorites);
    
    // 如果没有分类，不显示分类标签栏
    if (categories.length === 0) {
        return;
    }
    
    // 创建分类标签栏容器（在收藏列表外面）
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'fav-category-tabs';
    categoryContainer.id = 'fav-category-tabs';
    
    // 添加“全部”标签
    const allTab = document.createElement('button');
    allTab.className = 'fav-category-tab' + (currentCategory === 'all' ? ' active' : '');
    allTab.textContent = '全部';
    allTab.onclick = () => switchCategory('all');
    categoryContainer.appendChild(allTab);
    
    // 添加各分类标签
    categories.forEach(category => {
        const tab = document.createElement('button');
        tab.className = 'fav-category-tab' + (currentCategory === category ? ' active' : '');
        tab.textContent = category || '未分类';
        tab.onclick = () => switchCategory(category || '');
        categoryContainer.appendChild(tab);
    });
    
    // 插入到收藏区域的头部（在 my-fav-box-header 之后）
    const favBox = document.getElementById('my-fav-box');
    const favBoxHeader = favBox.querySelector('.my-fav-box-header');
    if (favBox && favBoxHeader) {
        // 在 header 之后插入分类标签栏
        favBoxHeader.insertAdjacentElement('afterend', categoryContainer);
    }
}

// 获取所有唯一分类
function getUniqueCategories(favorites) {
    if (!favorites || !Array.isArray(favorites)) {
        return [];
    }
    
    const categories = new Set();
    favorites.forEach(fav => {
        // 确保fav对象存在且有category属性
        if (fav && fav.category && fav.category.trim()) {
            categories.add(fav.category.trim());
        }
    });
    return Array.from(categories).sort();
}

// 根据分类筛选收藏
function filterFavoritesByCategory(favorites, category) {
    if (!favorites || !Array.isArray(favorites)) {
        return [];
    }
    
    if (category === 'all') {
        return favorites;
    }
    
    return favorites.filter(fav => {
        // 确保fav对象存在
        if (!fav) {
            return false;
        }
        
        if (category === '') {
            // 未分类
            return !fav.category || !fav.category.trim();
        }
        
        return fav.category && fav.category.trim() === category;
    });
}

// 切换分类
function switchCategory(category) {
    currentCategory = category;
    
    // 为body添加CSS类来控制tooltip显示
    if (category === 'all') {
        document.body.classList.remove('specific-category-active');
    } else {
        document.body.classList.add('specific-category-active');
    }
    
    // 更新标签样式
    const tabs = document.querySelectorAll('.fav-category-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (
            (category === 'all' && tab.textContent === '全部') ||
            (category === '' && tab.textContent === '未分类') ||
            (category !== 'all' && category !== '' && tab.textContent === category)
        ) {
            tab.classList.add('active');
        }
    });
    
    // 重新渲染收藏列表
    window.renderFavs();
    
    console.log(`切换到分类: ${category || '未分类'}`);
}

// 动态加载SortableJS
function loadSortableJS() {
    return new Promise((resolve, reject) => {
        if (typeof Sortable !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
        script.onload = () => {
            console.log('✅ SortableJS库已加载');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ SortableJS库加载失败');
            reject(new Error('SortableJS加载失败'));
        };
        document.head.appendChild(script);
    });
}

// 初始化Sortable实例
function initSortable(favList) {
    window._sortableInstance = new Sortable(favList, {
        animation: 150,
        handle: '.fav-drag-handle',
        draggable: '.fav-card[data-index]',
        filter: '#fav-add-card',
        onEnd: function(evt) {
            if (evt.oldIndex === evt.newIndex) return;
            
            // 排除addCard的影响（addCard总是第一个）
            const realOld = evt.oldIndex - 1;
            const realNew = evt.newIndex - 1;
            
            // 🔧 修复：获取当前筛选后的收藏数据
            const filteredFavorites = filterFavoritesByCategory(currentFavorites, currentCategory);
            
            // 确保索引在筛选数据范围内有效
            if (realOld < 0 || realNew < 0 || realOld >= filteredFavorites.length || realNew >= filteredFavorites.length) {
                console.log('拖拽索引无效，重新渲染');
                window.renderFavs();
                return;
            }
            
            // 🔧 修复：基于筛选数据进行拖拽，然后更新原始数组
            const movedItem = filteredFavorites[realOld];
            
            if (!movedItem) {
                console.error('❌ 拖拽失败: 找不到移动的项目');
                return;
            }
            
            // 在原始数组中找到被移动项目的位置
            const originalOldIndex = currentFavorites.findIndex(f => f.id === movedItem.id);
            
            // 计算目标位置在原始数组中的索引
            let originalNewIndex;
            if (realNew === 0) {
                // 移动到第一个位置
                if (filteredFavorites.length > 0) {
                    const firstItem = filteredFavorites[0];
                    originalNewIndex = currentFavorites.findIndex(f => f.id === firstItem.id);
                } else {
                    originalNewIndex = 0;
                }
            } else if (realNew >= filteredFavorites.length - 1) {
                // 移动到最后一个位置
                const lastItem = filteredFavorites[filteredFavorites.length - 1];
                originalNewIndex = currentFavorites.findIndex(f => f.id === lastItem.id);
            } else {
                // 移动到中间位置
                const targetItem = filteredFavorites[realNew];
                originalNewIndex = currentFavorites.findIndex(f => f.id === targetItem.id);
            }
            
            // 如果是同一位置，不需要移动
            if (originalOldIndex === originalNewIndex) {
                return;
            }
            
            // 在原始数组中移动项目
            const moved = currentFavorites.splice(originalOldIndex, 1)[0];
            currentFavorites.splice(originalNewIndex, 0, moved);
            
            // 标记排序已发生变化
            orderChanged = true;
            
            console.log(`✅ 拖拽成功: "${moved.title}" 从位置 ${realOld} 移动到 ${realNew}`);
            console.log('📋 当前筛选排序:', filteredFavorites.map((f, i) => `${i}: ${f.title}`).slice(0, 5));
            console.log('📋 完整数据排序:', currentFavorites.map((f, i) => `${i}: ${f.title}`).slice(0, 5));
            
            // 重新渲染（但不重新初始化Sortable）
            setTimeout(() => {
                window.renderFavs();
            }, 50);
        }
    });
}

// 切换编辑模式
window.toggleCustomMode = async function() {
    isCustomizing = !isCustomizing;
    
    // 进入编辑模式时重置排序变化标记
    if (isCustomizing) {
        orderChanged = false;
        console.log('📝 进入编辑模式');
    } else {
        console.log('💾 退出编辑模式，正在保存...');
    }
    
    window.renderFavs();
    
    const btn = document.getElementById('fav-custom-btn');
    if (btn) {
        btn.innerHTML = isCustomizing ? '<span>💾保存</span>' : '<span>⚙️编辑</span>';
    }
    
    if (!isCustomizing) {
        // 退出编辑模式时保存排序
        const saveSuccess = await updateFavsOrder();
        
        // 只有在排序发生变化且保存成功时才显示提示并重新加载数据
        if (orderChanged && saveSuccess) {
            showDragSuccessMessage();
            orderChanged = false;
            
            // 重新加载数据以确保显示最新排序
            setTimeout(() => {
                console.log('🔄 重新加载数据以验证排序');
                window.loadFavsFromCloud();
            }, 500);
        } else if (orderChanged && !saveSuccess) {
            console.error('❌ 排序保存失败');
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('排序保存失败，请重试', 'error');
            }
        }
    }
};

// 显示编辑模式提示
function showEditModeTip() {
    // 检查是否已经显示过提示
    if (localStorage.getItem('fav-drag-tip-shown')) return;
    
    const tip = document.createElement('div');
    tip.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 14px;
            z-index: 10001;
            max-width: 300px;
            text-align: center;
            line-height: 1.5;
        ">
            <div style="margin-bottom: 10px; font-size: 16px; font-weight: bold;">📝 编辑模式提示</div>
            <div style="margin-bottom: 15px;">
                • 点击 <span style="color: #ff6b6b;">×</span> 删除收藏<br>
                • 拖拽 <span style="color: #3385ff;">⋮⋮</span> 调整顺序<br>
                • 点击 💾保存 退出编辑
            </div>
            <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('fav-drag-tip-shown', 'true');" 
                    style="
                        background: #3385ff;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 13px;
                    ">
                知道了
            </button>
        </div>
    `;
    
    document.body.appendChild(tip);
    
    // 5秒后自动移除提示
    setTimeout(() => {
        if (tip.parentNode) {
            tip.remove();
            localStorage.setItem('fav-drag-tip-shown', 'true');
        }
    }, 5000);
}

// 显示拖拽成功消息
function showDragSuccessMessage() {
    if (typeof showCustomAlert === 'function') {
        showCustomAlert('收藏排序已保存', 'success');
    } else {
        alert('收藏排序已保存');
    }
}

// 获取域名工具函数
function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

// 删除收藏（编辑模式专用）
function removeFavorite(idx) {
    if (idx < 0 || idx >= currentFavorites.length) {
        console.log('删除索引无效:', idx);
        return;
    }
    
    const favorite = currentFavorites[idx];
    if (!favorite) {
        console.log('找不到要删除的收藏');
        return;
    }
    
    if (!confirm(`确定删除“${favorite.title}”吗？`)) {
        return;
    }
    
    const favoriteId = favorite.id;
    console.log('🗑️ 删除收藏:', favoriteId);
    
    // 调用全局删除函数
    window.removeFav(favoriteId);
}

// 强制重新加载完整收藏数据（调试用）
window.forceReloadAllFavorites = async function() {
    console.log('🔄 强制重新加载完整收藏数据...');
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        console.log('❌ 没有认证令牌');
        return;
    }
    
    try {
        const response = await fetch('/api/favorites', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log(`✅ 强制重新加载了 ${data.favorites.length} 个收藏`);
                currentFavorites = data.favorites;
                
                // 重置到全部分类
                currentCategory = 'all';
                
                // 重新渲染
                window.renderFavs();
                
                console.log('📋 当前currentFavorites内容:');
                currentFavorites.forEach((fav, index) => {
                    console.log(`  [${index}] ${fav.title}`);
                });
                
                return data.favorites;
            }
        }
    } catch (error) {
        console.error('❌ 强制重新加载失败:', error);
    }
};

// 更新收藏顺序到云端
async function updateFavsOrder() {
    if (currentFavorites.length === 0) {
        console.log('没有收藏项目，跳过排序保存');
        return true;
    }
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        console.log('用户未登录，无法保存排序');
        return false;
    }
    
    try {
        console.log('🔄 保存收藏排序...', currentFavorites.length, '个项目');
        
        // 🔍 详细调试：检查currentFavorites数据完整性
        console.log('🔍 currentFavorites数据检查:');
        console.log('数组长度:', currentFavorites.length);
        console.log('是否为数组:', Array.isArray(currentFavorites));
        currentFavorites.forEach((fav, index) => {
            console.log(`  [${index}] ID: ${fav.id}, 标题: ${fav.title}`);
        });
        
        // 🔧 修复：发送所有收藏项目的排序数据，确保完整更新
        // 构建所有收藏的排序数据（不仅仅是当前筛选的）
        const orderData = currentFavorites.map((fav, index) => ({
            id: fav.id,
            order: index + 1  // 从1开始的排序
        }));
        
        console.log('📋 发送完整排序数据:', orderData.length, '个项目');
        console.log('📋 排序数据详情:', orderData);
        
        if (orderData.length === 0) {
            console.warn('⚠️ 排序数据为空，跳过保存');
            return true;
        }
        
        const response = await fetch('/api/favorites/reorder', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orders: orderData })
        });
        
        console.log('📞 API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log('✅ 收藏排序已保存');
                return true;
            } else {
                console.error('❗ 排序保存失败:', data.error || '未知错误');
                return false;
            }
        } else {
            const errorText = await response.text();
            console.error('❗ API请求失败:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('❗ 保存排序失败:', error);
        
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('排序保存失败：' + error.message, 'error');
        }
        return false;
    }
}
// 提交收藏表单
window.submitFavForm = async function() {
    const url = document.getElementById('fav-form-url').value.trim();
    const title = document.getElementById('fav-form-title').value.trim();
    const icon = document.getElementById('fav-form-icon').value.trim();
    const description = document.getElementById('fav-form-desc').value.trim();
    const category = document.getElementById('fav-form-category').value.trim();
    
    if (!url || !title) {
        alert('请填写必填项：URL和网站名称');
        return;
    }
    
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
    }
    
    const favoriteData = {
        url: fullUrl,
        title: title,
        icon: icon || null,
        description: description || null,
        category: category || null
    };
    
    const success = await window.addFavToCloud(favoriteData);
    if (success) {
        window.closeFavForm();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('收藏添加成功', 'success');
        }
    }
};

// 添加收藏到云端
window.addFavToCloud = async function(favoriteData) {
    console.log('➕ 添加收藏');
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) return false;
    
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(favoriteData)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log('添加成功');
                window.loadFavsFromCloud();
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('添加失败:', error);
        return false;
    }
};

window.removeFav = async function(favoriteId) {
    console.log('🗑️ 开始删除收藏:', favoriteId);
    
    // 找到要删除的收藏项目
    const favorite = currentFavorites.find(f => f.id === favoriteId);
    const favoriteTitle = favorite ? favorite.title : '未知项目';
    
    if (!confirm(`确定删除“${favoriteTitle}”吗？`)) {
        console.log('用户取消删除');
        return;
    }
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        alert('用户未登录');
        return;
    }
    
    console.log('📞 发送删除请求:', favoriteId);
    
    try {
        const response = await fetch(`/api/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📞 API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('🗑️ API响应数据:', data);
            
            if (data.success) {
                console.log('✅ 删除成功');
                
                // 显示成功提示
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert(`已删除“${favoriteTitle}”`, 'success');
                } else {
                    alert(`已删除“${favoriteTitle}”`);
                }
                
                // 重新加载收藏数据
                setTimeout(() => {
                    window.loadFavsFromCloud();
                }, 300);
                
            } else {
                console.error('❗ 删除失败:', data.error || '未知错误');
                alert('删除失败：' + (data.error || '未知错误'));
            }
        } else {
            const errorText = await response.text();
            console.error('❗ API请求失败:', response.status, errorText);
            
            if (response.status === 404) {
                alert('没有找到该收藏项目');
            } else if (response.status === 401 || response.status === 403) {
                alert('认证失败，请重新登录');
            } else {
                alert('删除失败，请稍后重试');
            }
        }
    } catch (error) {
        console.error('❗ 删除收藏失败:', error);
        alert('网络错误，请检查网络连接');
    }
};

// 编辑收藏功能
window.editFavorite = function(favoriteId) {
    console.log('✏️ 编辑收藏:', favoriteId);
    
    const favorite = currentFavorites.find(f => f.id === favoriteId);
    if (!favorite) {
        alert('找不到该收藏项目');
        return;
    }
    
    // 更新分类选择器
    updateCategorySelect();
    
    // 填充表单
    document.getElementById('fav-form-url').value = favorite.url || '';
    document.getElementById('fav-form-title').value = favorite.title || '';
    document.getElementById('fav-form-icon').value = favorite.icon || '';
    document.getElementById('fav-form-desc').value = favorite.description || '';
    document.getElementById('fav-form-category').value = favorite.category || '';
    
    // 同步分类选择器的值
    const categorySelect = document.getElementById('fav-form-category-select');
    if (categorySelect && favorite.category) {
        categorySelect.value = favorite.category;
    }
    
    // 更新图标预览
    const iconPreview = document.getElementById('icon-preview-img-html');
    if (iconPreview) {
        iconPreview.src = favorite.icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI0Y3RjdGNyIvPgo8cGF0aCBkPSJNOCAxMkgyNFYxNEg4VjEyWk04IDE2SDI0VjE4SDhWMTZaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPgo=';
    }
    
    // 修改确认按钮的事件
    const confirmBtn = document.getElementById('confirmEditFavForm') || document.querySelector('#fav-form-modal .btn-primary');
    if (confirmBtn) {
        confirmBtn.onclick = () => updateFavorite(favoriteId);
        confirmBtn.textContent = '更新';
    }
    
    // 更改标题
    const modalTitle = document.querySelector('#fav-form-modal .fav-form-title');
    if (modalTitle) {
        modalTitle.textContent = '编辑链接';
    }
    
    // 显示模态框
    const modal = document.getElementById('fav-form-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // 绑定取消按钮
        const cancelBtn = modal.querySelector('.btn-secondary');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                editingFavIndex = null;
                modal.style.display = 'none';
                if (modalTitle) modalTitle.textContent = '添加链接';
            };
        }
    }
};

// 编辑模式下点击卡片编辑函数
window.openEditFavForm = function(index) {
    if (index < 0 || index >= currentFavorites.length) {
        console.log('编辑索引无效:', index);
        return;
    }
    
    const favorite = currentFavorites[index];
    if (favorite && favorite.id) {
        window.editFavorite(favorite.id);
    }
};

// 更新分类选择器
function updateCategorySelect() {
    const categorySelect = document.getElementById('fav-form-category-select');
    if (!categorySelect) return;
    
    // 清空选项
    categorySelect.innerHTML = '<option value="">选择分类...</option>';
    
    // 获取所有分类
    const categories = getUniqueCategories(currentFavorites);
    
    // 添加分类选项
    categories.forEach(category => {
        if (category) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        }
    });
}

// 分类选择器变化事件
function handleCategorySelectChange() {
    const categorySelect = document.getElementById('fav-form-category-select');
    const categoryInput = document.getElementById('fav-form-category');
    
    if (categorySelect && categoryInput) {
        if (categorySelect.value) {
            categoryInput.value = categorySelect.value;
        }
    }
}

// 更新收藏功能
async function updateFavorite(favoriteId) {
    console.log('📝 开始更新收藏:', favoriteId);
    console.log('📝 favoriteId类型检查:', typeof favoriteId, '值:', favoriteId);
    
    // 验证UUID格式
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(favoriteId)) {
        console.error('❌ 无效的favoriteId格式:', favoriteId);
        alert('无效的收藏ID格式');
        return;
    }
    
    const url = document.getElementById('fav-form-url').value.trim();
    const title = document.getElementById('fav-form-title').value.trim();
    const icon = document.getElementById('fav-form-icon').value.trim();
    const description = document.getElementById('fav-form-desc').value.trim();
    const category = document.getElementById('fav-form-category').value.trim();
    
    if (!url || !title) {
        alert('请填写必填项：URL和网站名称');
        return;
    }
    
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
    }
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        alert('用户未登录');
        return;
    }
    
    console.log('📞 发送更新请求:', {
        favoriteId,
        url: fullUrl,
        title,
        icon: icon || null,
        description: description || null,
        category: category || null
    });
    
    try {
        const response = await fetch(`/api/favorites/${favoriteId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                url: fullUrl, 
                title: title, 
                icon: icon || null, 
                description: description || null,
                category: category || null
            })
        });
        
        console.log('📞 API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📝 API响应数据:', data);
            
            if (data.success) {
                console.log('✅ 更新成功');
                editingFavIndex = null;
                document.getElementById('fav-form-modal').style.display = 'none';
                
                // 恢复标题
                const modalTitle = document.querySelector('#fav-form-modal .fav-form-title');
                if (modalTitle) modalTitle.textContent = '添加链接';
                
                // 显示成功提示
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('收藏已更新', 'success');
                } else {
                    alert('收藏已更新');
                }
                
                // 重新加载收藏数据
                setTimeout(() => {
                    window.loadFavsFromCloud();
                }, 300);
                
            } else {
                console.error('❗ 更新失败:', data.error || '未知错误');
                alert('更新失败: ' + (data.error || '未知错误'));
            }
        } else {
            const errorText = await response.text();
            console.error('❗ API请求失败:', response.status, errorText);
            
            if (response.status === 404) {
                alert('没有找到该收藏项目');
            } else if (response.status === 401 || response.status === 403) {
                alert('认证失败，请重新登录');
            } else {
                alert('更新失败，请稍后重试');
            }
        }
    } catch (error) {
        console.error('❗ 更新收藏失败:', error);
        alert('网络错误，请检查网络连接');
    }
}

// 打开收藏表单
window.openFavForm = function() {
    editingFavIndex = null;
    clearFavFormFields();
    updateCategorySelect(); // 更新分类选择器
    document.getElementById('fav-form-modal').style.display = 'flex';
    
    // 恢复确认按钮
    const confirmBtn = document.getElementById('confirmEditFavForm') || document.querySelector('#fav-form-modal .btn-primary');
    if (confirmBtn) {
        confirmBtn.onclick = window.submitFavForm || submitFavForm;
        confirmBtn.textContent = '确定';
    }
};

// 关闭收藏表单
window.closeFavForm = function() {
    editingFavIndex = null;
    document.getElementById('fav-form-modal').style.display = 'none';
    
    // 恢复标题
    const modalTitle = document.querySelector('#fav-form-modal .fav-form-title');
    if (modalTitle) modalTitle.textContent = '添加链接';
};

// 清空表单字段
function clearFavFormFields() {
    const ids = ['fav-form-url', 'fav-form-title', 'fav-form-icon', 'fav-form-desc', 'fav-form-category'];
    ids.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    
    // 清空分类选择器
    const categorySelect = document.getElementById('fav-form-category-select');
    if (categorySelect) categorySelect.value = '';
    
    const titleEl = document.querySelector('.fav-form-title');
    if (titleEl) titleEl.textContent = '添加链接';
}
// 检查令牌并加载收藏
function checkTokenAndLoadFavorites() {
    const token = localStorage.getItem('neon_auth_token');
    const favBox = document.getElementById('my-fav-box');
    
    console.log('🔍 检查认证状态:', !!token);
    
    if (token && favBox) {
        console.log('✅ 令牌存在，显示收藏区域并加载数据');
        favBox.style.display = 'block';
        window.loadFavsFromCloud();
    } else if (favBox) {
        console.log('⚠️ 无令牌，隐藏收藏区域');
        favBox.style.display = 'none';
    }
}

// 页面加载完成后自动加载收藏
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 页面加载完成，开始检查收藏状态');
    
    // 立即检查一次
    checkTokenAndLoadFavorites();
    
    // 延迟检查（以防认证系统尚未完全加载）
    setTimeout(() => {
        console.log('🔄 延迟检查收藏状态');
        checkTokenAndLoadFavorites();
    }, 1000);
    
    // 再次延迟检查
    setTimeout(() => {
        console.log('🔄 最终检查收藏状态');
        checkTokenAndLoadFavorites();
    }, 3000);
});

// 监听登录状态变化
window.addEventListener('storage', (e) => {
    if (e.key === 'neon_auth_token') {
        console.log('🔄 检测到令牌变化:', !!e.newValue);
        
        const favBox = document.getElementById('my-fav-box');
        
        if (e.newValue) {
            // 用户登录
            console.log('✅ 用户已登录，显示收藏区域并加载收藏');
            if (favBox) {
                favBox.style.display = 'block';
            }
            setTimeout(() => {
                checkTokenAndLoadFavorites();
            }, 500);
        } else {
            // 用户登出
            console.log('⚠️ 用户已登出，隐藏收藏区域');
            if (favBox) {
                favBox.style.display = 'none';
                // 清除分类标签栏
                const categoryTabs = document.getElementById('fav-category-tabs');
                if (categoryTabs) {
                    categoryTabs.remove();
                }
            }
            currentFavorites = [];
        }
    }
});

// 监听自定义登录事件
window.addEventListener('userLoggedIn', (e) => {
    console.log('🔄 监听到用户登录事件');
    setTimeout(checkTokenAndLoadFavorites, 500);
});

window.addEventListener('userLoggedOut', (e) => {
    console.log('🔄 监听到用户登出事件');
    const favBox = document.getElementById('my-fav-box');
    if (favBox) {
        favBox.style.display = 'none';
    }
    currentFavorites = [];
});

// 手动触发函数（供调试使用）
window.triggerFavoritesLoad = function() {
    console.log('🔄 手动触发收藏加载');
    window.loadFavsFromCloud();
    const favBox = document.getElementById('my-fav-box');
    if (favBox) favBox.style.display = 'block';
};

// 强制显示收藏区域
window.forceShowFavorites = function() {
    console.log('🔧 强制显示收藏区域');
    const favBox = document.getElementById('my-fav-box');
    if (favBox) {
        favBox.style.display = 'block';
        favBox.style.visibility = 'visible';
        favBox.style.opacity = '1';
        console.log('✅ 收藏区域已强制显示');
    }
    
    // 强制渲染收藏列表
    const favList = document.getElementById('fav-list');
    if (favList && currentFavorites.length === 0) {
        console.log('🎨 渲染空的收藏列表');
        window.renderFavs();
    }
};

// 诊断收藏显示问题
window.diagnoseFavorites = function() {
    console.log('🩺 开始诊断收藏显示问题...');
    
    const favBox = document.getElementById('my-fav-box');
    const favList = document.getElementById('fav-list');
    const token = localStorage.getItem('neon_auth_token');
    
    console.log('收藏容器状态:');
    console.log('- favBox 存在:', !!favBox);
    console.log('- favBox display:', favBox ? getComputedStyle(favBox).display : 'N/A');
    console.log('- favList 存在:', !!favList);
    console.log('- favList 内容长度:', favList ? favList.innerHTML.length : 0);
    console.log('- currentFavorites 长度:', currentFavorites.length);
    console.log('- 认证令牌存在:', !!token);
    
    // 强制显示
    window.forceShowFavorites();
    
    // 尝试加载数据
    window.loadFavsFromCloud();
};

// 页面加载后立即可用的全局函数
window.addEventListener('load', () => {
    console.log('🌟 收藏调试函数已准备就绪:');
    console.log('- window.forceShowFavorites() - 强制显示收藏区域');
    console.log('- window.diagnoseFavorites() - 诊断收藏显示问题');
    console.log('- window.triggerFavoritesLoad() - 手动触发收藏加载');
});

// ========================================
// 缺失函数补充 - 从 neon-favorites-global.js 移植
// ========================================

// 分组管理功能
window.favoriteGroups = [];
window.currentGroupId = null;

// 加载收藏分组
window.loadFavoriteGroups = async function() {
    console.log('📋 加载收藏分组...');
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        console.log('⚠️ 用户未登录，无法加载分组');
        return [];
    }
    
    try {
        const response = await fetch('/api/favorites/groups', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                window.favoriteGroups = result.groups;
                console.log(`✅ 收藏分组加载成功: ${result.groups.length} 个分组`);
                return result.groups;
            }
        }
        
        throw new Error('加载收藏分组失败');
    } catch (error) {
        console.error('加载收藏分组失败:', error);
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('加载分组失败：' + error.message, 'error');
        }
        return [];
    }
};

// 创建收藏分组
window.createFavoriteGroup = async function(name, description, color) {
    console.log('➕ 创建收藏分组:', name);
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        alert('用户未登录');
        return null;
    }
    
    try {
        const response = await fetch('/api/favorites/groups', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: description || '',
                color: color || '#007bff'
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('✅ 分组创建成功');
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('分组创建成功！', 'success');
                }
                await window.loadFavoriteGroups();
                return result.group;
            }
        }
        
        throw new Error('创建分组失败');
    } catch (error) {
        console.error('创建分组失败:', error);
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('创建分组失败：' + error.message, 'error');
        }
        return null;
    }
};

// 创建收藏分享
window.createFavoriteShare = async function(title, description, favoriteIds) {
    console.log('📍 创建收藏分享:', title);
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        alert('用户未登录');
        return null;
    }
    
    try {
        const response = await fetch('/api/shares', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                favoriteIds
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log('✅ 分享创建成功');
                return data;
            } else {
                throw new Error(data.error || '创建分享失败');
            }
        } else {
            throw new Error('分享创建失败');
        }
    } catch (error) {
        console.error('创建分享失败:', error);
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('创建分享失败：' + error.message, 'error');
        }
        return null;
    }
};

// 图标上传功能初始化
window.initIconUploadFeature = function() {
    console.log('🔧 初始化本地图标上传功能');
    
    const uploadBtn = document.getElementById('icon-upload-btn-html');
    const iconInput = document.getElementById('fav-form-icon');
    const iconPreview = document.getElementById('icon-preview-img-html');
    
    if (!uploadBtn || !iconInput || !iconPreview) {
        console.warn('⚠️ 本地图标上传相关元素未找到');
        return;
    }
    
    // 创建隐藏的文件输入框
    let fileInput = document.getElementById('icon-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'icon-file-input';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    // 绑定上传按钮事件
    uploadBtn.onclick = function() {
        fileInput.click();
    };
    
    // 绑定文件选择事件
    fileInput.onchange = function() {
        const file = fileInput.files[0];
        if (!file) return;
        
        // 显示上传状态
        uploadBtn.textContent = '上传中...';
        uploadBtn.disabled = true;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result;
            
            // 更新图标预览
            iconPreview.src = base64Data;
            iconInput.value = base64Data;
            
            // 恢复按钮状态
            uploadBtn.textContent = '点我本地上传';
            uploadBtn.disabled = false;
            
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('图标上传成功！', 'success');
            }
        };
        
        reader.onerror = function() {
            uploadBtn.textContent = '点我本地上传';
            uploadBtn.disabled = false;
            
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('图标上传失败', 'error');
            }
        };
        
        reader.readAsDataURL(file);
    };
    
    console.log('✅ 图标上传功能初始化完成');
};

// 自动初始化功能
setTimeout(() => {
    if (typeof window.initIconUploadFeature === 'function') {
        window.initIconUploadFeature();
    }
}, 1000);

// 分享功能
window.toggleSelectionMode = function() {
    isSelectionMode = !isSelectionMode;
    selectedFavorites.clear();
    
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.innerHTML = isSelectionMode ? 
            '<span>✖️取消选择</span>' : 
            '<span>💰分享</span>';
    }
    
    // 重新渲染收藏列表
    window.renderFavs(currentFavorites);
};

// 切换收藏选择状态
window.toggleFavoriteSelection = function(favoriteId) {
    if (selectedFavorites.has(favoriteId)) {
        selectedFavorites.delete(favoriteId);
    } else {
        selectedFavorites.add(favoriteId);
    }
    
    // 重新渲染收藏列表
    window.renderFavs(currentFavorites);
};

// 更新分享控件
function updateShareControls() {
    const shareControls = document.getElementById('share-controls');
    if (!shareControls) return;
    
    if (isSelectionMode) {
        shareControls.style.display = 'block';
        shareControls.innerHTML = `
            <div style="
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: 600;">已选择 ${selectedFavorites.size} 个收藏</span>
                    <button onclick="selectAllFavorites()" 
                            style="
                                background: #2196f3;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">全选</button>
                    <button onclick="clearSelection()" 
                            style="
                                background: #9e9e9e;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">清空</button>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="createShare()" 
                            ${selectedFavorites.size === 0 ? 'disabled' : ''}
                            style="
                                background: ${selectedFavorites.size === 0 ? '#ccc' : '#4caf50'};
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                cursor: ${selectedFavorites.size === 0 ? 'not-allowed' : 'pointer'};
                                font-weight: 600;
                            ">
                        🚀 生成分享链接
                    </button>
                </div>
            </div>
        `;
    } else {
        shareControls.style.display = 'none';
    }
}

// 全选收藏
window.selectAllFavorites = function() {
    currentFavorites.forEach(fav => {
        selectedFavorites.add(fav.id);
    });
    window.renderFavs(currentFavorites);
};

// 清空选择
window.clearSelection = function() {
    selectedFavorites.clear();
    window.renderFavs(currentFavorites);
};

// 创建分享
window.createShare = async function() {
    if (selectedFavorites.size === 0) {
        alert('请先选择要分享的收藏');
        return;
    }
    
    const selectedItems = currentFavorites.filter(fav => selectedFavorites.has(fav.id));
    
    // 简单的分享对话框
    const title = prompt('请输入分享标题:', `我的收藏分享 (${selectedItems.length}个网站)`);
    if (!title) return;
    
    const description = prompt('请输入分享描述(可选):', '');
    
    const token = localStorage.getItem('neon_auth_token');
    if (!token) {
        alert('用户未登录');
        return;
    }
    
    try {
        const response = await fetch('/api/shares', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                favoriteIds: Array.from(selectedFavorites)
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const shareUrl = `${window.location.origin}/share/${data.shareId}`;
                
                // 显示分享成功对话框
                showShareSuccess(shareUrl, title);
                
                // 退出选择模式
                toggleSelectionMode();
            } else {
                alert('分享创建失败: ' + (data.error || '未知错误'));
            }
        } else {
            alert('分享创建失败');
        }
    } catch (error) {
        console.error('分享创建失败:', error);
        alert('分享创建失败: ' + error.message);
    }
};

// 显示分享成功对话框
function showShareSuccess(shareUrl, title) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            text-align: center;
        ">
            <h3 style="color: #4caf50; margin-bottom: 20px;">🎉 分享创建成功！</h3>
            <p style="margin-bottom: 15px; color: #666;">分享标题：<strong>${title}</strong></p>
            <div style="
                background: #f5f5f5;
                padding: 10px;
                border-radius: 6px;
                margin: 15px 0;
                word-break: break-all;
                font-family: monospace;
                font-size: 14px;
            ">${shareUrl}</div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="copyToClipboard('${shareUrl}')" 
                        style="
                            background: #2196f3;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">
                    📋 复制链接
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="
                            background: #9e9e9e;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">
                    关闭
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 复制到剪贴板
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('链接已复制到剪贴板', 'success');
        } else {
            alert('链接已复制到剪贴板');
        }
    }).catch(err => {
        console.error('复制失败:', err);
        // 备用方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('链接已复制到剪贴板', 'success');
        } else {
            alert('链接已复制到剪贴板');
        }
    });
};

// 页面加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 绑定收藏功能事件...');
    
    // 绑定编辑按钮事件
    const customBtn = document.getElementById('fav-custom-btn');
    if (customBtn) {
        customBtn.addEventListener('click', window.toggleCustomMode);
        console.log('✅ 编辑按钮事件已绑定');
    }
    
    // 绑定分享按钮事件
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', window.toggleSelectionMode);
        console.log('✅ 分享按钮事件已绑定');
    }
    
    // 绑定批量添加按钮事件
    const batchAddBtn = document.getElementById('fav-batch-add-btn');
    if (batchAddBtn) {
        batchAddBtn.addEventListener('click', window.openBatchAddModal || (() => {
            console.log('批量添加功能暂未实现');
        }));
        console.log('✅ 批量添加按钮事件已绑定');
    }
    
    // 绑定分类选择器事件
    const categorySelect = document.getElementById('fav-form-category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategorySelectChange);
        console.log('✅ 分类选择器事件已绑定');
    }
    
    console.log('🎉 Neon收藏系统完全加载完成！');
    
    // 立即检查令牌和加载收藏
    checkTokenAndLoadFavorites();
    
    // 也在延迟后再检查一次（防止认证模块还未加载完成）
    setTimeout(checkTokenAndLoadFavorites, 1000);
    setTimeout(checkTokenAndLoadFavorites, 3000);
});

// 为兼容性添加函数别名
window.confirmEditFavForm = window.submitFavForm;

// 自动获取网站信息功能
window.autoGetIcon = async function () {
    const urlInput = document.getElementById('fav-form-url');
    const url = urlInput.value.trim();

    if (!url) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('请先填写网址', 'warning');
        } else {
            alert('请先填写网址');
        }
        return;
    }

    // 确保URL包含协议头
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
        urlInput.value = fullUrl;
    }

    try {
        // 显示加载状态
        const titleInput = document.getElementById('fav-form-title');
        const iconInput = document.getElementById('fav-form-icon');
        const descInput = document.getElementById('fav-form-desc');
        
        if (titleInput) titleInput.value = '加载中...';
        if (iconInput) iconInput.value = '';
        if (descInput) descInput.value = '';

        // 调用API获取网站信息
        const response = await fetch('https://v.api.aa1.cn/api/api-web-head-json/index.php?url=' + encodeURIComponent(fullUrl));
        const data = await response.json();

        if (data && data.code === 200) {
            // 填充表单
            if (titleInput) titleInput.value = data.title || '';
            if (iconInput) iconInput.value = 'https://ico.cxr.cool/' + (data.url.replace(/^https?:\/\//, '').split('/')[0]) + '.ico';
            if (descInput) descInput.value = data.description || '';
        } else {
            // 如果API失败，尝试使用备用方案
            if (titleInput) titleInput.value = '';
            if (iconInput) iconInput.value = 'https://ico.cxr.cool/' + (fullUrl.replace(/^https?:\/\//, '').split('/')[0]) + '.ico';
            if (descInput) descInput.value = '';
        }
        
        // 更新图标预览
        const iconPreview = document.getElementById('icon-preview-img-html');
        if (iconPreview && iconInput) {
            iconPreview.src = iconInput.value || 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
        }
        
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('网站信息获取成功', 'success');
        }
        
    } catch (error) {
        console.error('获取网站信息失败:', error);
        
        // 备用方案
        const titleInput = document.getElementById('fav-form-title');
        const iconInput = document.getElementById('fav-form-icon');
        const descInput = document.getElementById('fav-form-desc');
        
        if (titleInput) titleInput.value = '';
        if (iconInput) iconInput.value = 'https://ico.cxr.cool/' + (fullUrl.replace(/^https?:\/\//, '').split('/')[0]) + '.ico';
        if (descInput) descInput.value = '';
        
        // 更新图标预览
        const iconPreview = document.getElementById('icon-preview-img-html');
        if (iconPreview && iconInput) {
            iconPreview.src = iconInput.value || 'https://cdn.jsdmirror.com/gh/xiaolongmr/test@main/1.png';
        }
        
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('获取网站信息失败，已填入默认图标', 'warning');
        } else {
            alert('获取网站信息失败，已填入默认图标');
        }
    }
};

// 检查令牌并加载收藏
function checkTokenAndLoadFavorites() {
    const token = localStorage.getItem('neon_auth_token');
    const favBox = document.getElementById('my-fav-box');
    
    console.log('🔍 检查认证状态:', !!token);
    
    if (token && favBox) {
        console.log('✅ 令牌存在，显示收藏区域并加载数据');
        favBox.style.display = 'block';
        window.loadFavsFromCloud();
    } else if (favBox) {
        console.log('⚠️ 无令牌，隐藏收藏区域');
        favBox.style.display = 'none';
    }
}

console.log('✅ 收藏功能已准备就绪（包含编辑和分享功能）');

// 调试函数：诊断分类标签悬浮问题
window.diagnoseCategoryTooltip = function() {
    console.log('📊 诊断分类标签悬浮问题...');
    
    const favCards = document.querySelectorAll('.fav-card');
    const categoryTags = document.querySelectorAll('.fav-category-tag');
    
    console.log(`找到 ${favCards.length} 个收藏卡片`);
    console.log(`找到 ${categoryTags.length} 个分类标签`);
    
    categoryTags.forEach((tag, index) => {
        const category = tag.getAttribute('data-category');
        const parentCard = tag.closest('.fav-card');
        
        console.log(`标签 ${index + 1}:`);
        console.log(`  - 分类: ${category}`);
        console.log(`  - 父元素: ${parentCard ? 'fav-card' : '未找到'}`);
        console.log(`  - data-category 属性: ${tag.getAttribute('data-category')}`);
        
        // 检查CSS样式
        if (parentCard) {
            const afterStyles = window.getComputedStyle(tag, '::after');
            console.log(`  - 默认 ::after content: ${afterStyles.content}`);
            console.log(`  - 默认 ::after opacity: ${afterStyles.opacity}`);
        }
    });
    
    console.log(`当前分类筛选: ${currentCategory}`);
    console.log(`收藏数据总数: ${currentFavorites.length} 个`);
    
    const filteredFavorites = filterFavoritesByCategory(currentFavorites, currentCategory);
    console.log(`当前分类下收藏数: ${filteredFavorites.length} 个`);
};

// 调试函数：测试tooltip显示
window.testTooltipDisplay = function() {
    console.log('🔍 测试tooltip显示...');
    
    const firstCard = document.querySelector('.fav-card');
    if (firstCard) {
        const tag = firstCard.querySelector('.fav-category-tag');
        if (tag) {
            console.log('模拟鼠标悬浮到第一个收藏卡片');
            
            // 添加高亮显示
            firstCard.style.backgroundColor = '#fff3cd';
            firstCard.style.border = '2px solid #ffc107';
            
            // 触发悬浮事件
            const mouseEnterEvent = new MouseEvent('mouseenter', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            firstCard.dispatchEvent(mouseEnterEvent);
            
            setTimeout(() => {
                const afterStyles = window.getComputedStyle(tag, '::after');
                console.log('悬浮后的tooltip样式:');
                console.log(`  - content: ${afterStyles.content}`);
                console.log(`  - opacity: ${afterStyles.opacity}`);
                console.log(`  - visibility: ${afterStyles.visibility}`);
                console.log(`  - display: ${afterStyles.display}`);
                console.log(`  - position: ${afterStyles.position}`);
                
                // 恢复样式
                setTimeout(() => {
                    firstCard.style.backgroundColor = '';
                    firstCard.style.border = '';
                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    firstCard.dispatchEvent(mouseLeaveEvent);
                }, 3000);
            }, 500);
        } else {
            console.log('❌ 第一个卡片中未找到分类标签');
        }
    } else {
        console.log('❌ 未找到任何收藏卡片');
    }
};

// 调试函数：强制修复tooltip
window.forceFixTooltip = function() {
    console.log('🔧 强制修复tooltip显示...');
    
    // 添加强制样式
    const style = document.createElement('style');
    style.textContent = `
        .fav-card:hover .fav-category-tag::after {
            content: '分类: ' attr(data-category) !important;
            position: absolute !important;
            bottom: 100% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: rgba(0, 0, 0, 0.9) !important;
            color: white !important;
            padding: 6px 10px !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            white-space: nowrap !important;
            z-index: 9999 !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ 已添加强制tooltip样式');
};

console.log('🛠️ 调试函数已加载:');
console.log('  - diagnoseCategoryTooltip() - 诊断分类标签问题');
console.log('  - testTooltipDisplay() - 测试tooltip显示');
console.log('  - forceFixTooltip() - 强制修复tooltip');