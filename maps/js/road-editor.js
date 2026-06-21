// ===== 道路模板编辑器 =====

const MODULE_TYPES = [
    { name: 'Lane', label: '车道', defaultWidth: 3.5, color: '#4a90d9' },
    { name: 'Sidewalk', label: '人行道', defaultWidth: 3, color: '#8bc34a' },
    { name: 'BikeLane', label: '自行车道', defaultWidth: 1.5, color: '#ff9800' },
    { name: 'Median', label: '中央分隔带', defaultWidth: 2, color: '#9c27b0' },
    { name: 'reservedWidth', label: '预留宽度', defaultWidth: 3, color: '#78909c' }
];

let roadEditorOpen = false;
let currentEditingTemplate = null;
let currentEditingModules = [];

function initRoadEditor() {
    const editorHtml = `
        <div id="roadEditor" class="road-editor">
            <div class="editor-header">
                <h2>道路模板编辑器</h2>
                <button class="close-btn" onclick="closeRoadEditor()">✕</button>
            </div>
            
            <div class="editor-body">
                <div class="template-list-panel">
                    <h3>现有模板</h3>
                    <div id="templateList" class="template-list"></div>
                    <button class="add-template-btn" onclick="createNewTemplate()">+ 新建模板</button>
                </div>
                
                <div class="editor-panel">
                    <div class="template-info">
                        <input type="text" id="templateName" placeholder="模板名称" />
                        <input type="text" id="templateId" placeholder="模板ID (英文)" />
                    </div>
                    
                    <div class="modules-section">
                        <h3>道路模块</h3>
                        <div id="modulesContainer" class="modules-container"></div>
                        <div class="total-width">总宽度: <span id="totalWidth">0</span>m</div>
                    </div>
                    
                    <div class="add-module-section">
                        <h4>添加模块</h4>
                        <div class="module-type-buttons">
                            ${MODULE_TYPES.map(m =>
        `<button class="module-btn" data-type="${m.name}" data-width="${m.defaultWidth}" 
                                        style="background-color: ${m.color}">${m.label}</button>`
    ).join('')}
                        </div>
                        <button class="add-bidirectional-btn" onclick="addBidirectionalLanes()">添加双向车道</button>
                    </div>
                </div>
            </div>
            
            <div class="editor-footer">
                <button class="save-btn" onclick="saveTemplate()">保存模板</button>
                <button class="delete-btn" onclick="deleteTemplate()">删除模板</button>
            </div>
        </div>
        <div id="roadEditorOverlay" class="editor-overlay" onclick="closeRoadEditor()"></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .road-editor {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 1000px;
            height: 80vh;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 45;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #2c3e50;
            color: #fff;
            border-radius: 12px 12px 0 0;
        }
        
        .editor-header h2 {
            margin: 0;
            font-size: 18px;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            padding: 5px 10px;
        }
        
        .editor-body {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .template-list-panel {
            width: 250px;
            border-right: 1px solid #e0e0e0;
            padding: 15px;
            overflow-y: auto;
        }
        
        .template-list-panel h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666;
        }
        
        .template-list {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin-bottom: 10px;
        }
        
        .template-item {
            padding: 10px;
            background: #f5f5f5;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        }
        
        .template-item:hover, .template-item.active {
            background: #4a90d9;
            color: #fff;
        }
        
        .template-item.internal-road {
            background: #f0f0f0;
            color: #999;
            cursor: not-allowed;
            opacity: 0.7;
        }
        
        .template-item.internal-road:hover {
            background: #f0f0f0;
            color: #999;
        }
        
        .add-template-btn {
            width: 100%;
            padding: 10px;
            border: 2px dashed #ccc;
            border-radius: 6px;
            background: none;
            cursor: pointer;
            color: #666;
            font-size: 13px;
        }
        
        .add-template-btn:hover {
            border-color: #4a90d9;
            color: #4a90d9;
        }
        
        .editor-panel {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        
        .template-info {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .template-info input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .modules-section {
            margin-bottom: 20px;
        }
        
        .modules-section h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666;
        }
        
        .modules-container {
            min-height: 150px;
            border: 2px dashed #ddd;
            border-radius: 6px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .module-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: #f8f9fa;
            border-radius: 4px;
            transition: all 0.2s;
        }
        
        .module-item:hover {
            background: #e9ecef;
        }
        
        .module-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }
        
        .module-name {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
        }
        
        .module-width {
            width: 60px;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
            text-align: center;
        }
        
        .module-remove {
            background: #ff6b6b;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 5px 8px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .module-remove:hover {
            background: #ee5a5a;
        }
        
        .module-item.selectable {
            cursor: pointer;
        }
        
        .module-item.selectable:hover {
            background: #dbeafe;
        }
        
        .module-item.selected {
            background: #3b82f6;
            color: #fff;
        }
        
        .module-item.selected .module-color {
            box-shadow: 0 0 0 2px #fff;
        }
        
        .module-width-fixed {
            width: 60px;
            padding: 5px;
            font-size: 12px;
            text-align: center;
            color: #666;
        }
        
        .module-item.selected .module-width-fixed {
            color: #fff;
        }
        
        .module-insert {
            background: #22c55e;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 5px 8px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .module-insert:hover {
            background: #16a34a;
        }
        
        .insert-menu {
            margin-top: 10px;
            padding: 15px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
        }
        
        .insert-menu h4 {
            margin: 0 0 10px 0;
            font-size: 13px;
            color: #0369a1;
        }
        
        .insert-module-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .insert-module-btn {
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
            cursor: pointer;
        }
        
        .cancel-insert {
            padding: 6px 15px;
            background: #e5e7eb;
            color: #374151;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        }
        
        .cancel-insert:hover {
            background: #d1d5db;
        }
        
        .total-width {
            margin-top: 10px;
            text-align: right;
            font-size: 14px;
            color: #666;
            font-weight: 500;
        }
        
        .add-module-section {
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }
        
        .add-module-section h4 {
            margin: 0 0 10px 0;
            font-size: 13px;
            color: #666;
        }
        
        .module-type-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .module-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 13px;
            cursor: pointer;
            transition: transform 0.1s;
        }
        
        .module-btn:hover {
            transform: translateY(-2px);
        }
        
        .add-bidirectional-btn {
            padding: 8px 20px;
            background: #2c3e50;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
        }
        
        .add-bidirectional-btn:hover {
            background: #34495e;
        }
        
        .editor-footer {
            display: flex;
            gap: 10px;
            padding: 15px 20px;
            background: #f5f5f5;
            border-radius: 0 0 12px 12px;
        }
        
        .save-btn {
            flex: 1;
            padding: 12px;
            background: #4a90d9;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
        }
        
        .save-btn:hover {
            background: #3a80c9;
        }
        
        .delete-btn {
            padding: 12px 25px;
            background: #ff6b6b;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
        }
        
        .delete-btn:hover {
            background: #ee5a5a;
        }
        
        .editor-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 44;
        }
        
        .road-editor.hidden {
            display: none;
        }
        
        .editor-overlay.hidden {
            display: none;
        }
    `;

    document.head.appendChild(style);
    document.body.insertAdjacentHTML('beforeend', editorHtml);

    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const width = parseFloat(btn.dataset.width);
            addModule(type, width);
        });
    });

    loadTemplates();
}

function loadTemplates() {
    // 优先从localStorage加载用户保存的模板
    try {
        const stored = localStorage.getItem('maps_road_presets');
        if (stored) {
            lanePresets = JSON.parse(stored);
            renderTemplateList();
            return;
        }
    } catch (e) { console.warn('读取本地模板失败:', e); }

    // 没有本地模板时，尝试从静态文件加载
    fetch('./template/road.json')
        .then(res => res.json())
        .then(data => {
            lanePresets = data;
            renderTemplateList();
        })
        .catch(() => {
            lanePresets = { ...defaultLanePresets };
            renderTemplateList();
        });
}

function renderTemplateList() {
    const container = document.getElementById('templateList');
    container.innerHTML = '';

    Object.keys(lanePresets).forEach(key => {
        const template = lanePresets[key];
        const item = document.createElement('div');
        item.className = key === 'internalRoad' ? 'template-item internal-road' : 'template-item';
        item.textContent = template.name;
        item.dataset.id = key;

        if (key !== 'internalRoad') {
            item.addEventListener('click', () => selectTemplate(key));
        }

        container.appendChild(item);
    });

    if (currentEditingTemplate) {
        const activeItem = container.querySelector(`[data-id="${currentEditingTemplate}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}

function selectTemplate(id) {
    currentEditingTemplate = id;
    const template = lanePresets[id];

    document.getElementById('templateName').value = template.name;
    document.getElementById('templateId').value = id;

    currentEditingModules = JSON.parse(JSON.stringify(template.modules));
    renderModules();

    document.querySelectorAll('.template-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-id="${id}"]`).classList.add('active');
}

let selectedModuleIndex = null;

function renderModules() {
    const container = document.getElementById('modulesContainer');
    container.innerHTML = '';

    if (currentEditingModules.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">暂无模块，请添加</p>';
        document.getElementById('totalWidth').textContent = '0';
        return;
    }

    currentEditingModules.forEach((module, index) => {
        const moduleType = MODULE_TYPES.find(m => m.name === module.name);
        const color = moduleType ? moduleType.color : '#ccc';
        const isSelectable = module.name !== 'reservedWidth';
        const isSelected = selectedModuleIndex === index;

        const item = document.createElement('div');
        item.className = `module-item ${isSelectable ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="module-color" style="background-color: ${color}"></div>
            <div class="module-name">${module.name}</div>
            ${module.name === 'reservedWidth' ? `
                <input type="number" class="module-width" value="${module.width}" 
                       onchange="updateModuleWidth(${index}, this.value)" step="0.5" min="0.5" />
            ` : `
                <span class="module-width-fixed">${module.width}m</span>
            `}
            ${isSelectable ? `
                <button class="module-insert" onclick="event.stopPropagation(); showInsertMenu(${index})">↓</button>
            ` : ''}
            <button class="module-remove" onclick="event.stopPropagation(); removeModule(${index})">✕</button>
        `;

        if (isSelectable) {
            item.addEventListener('click', () => {
                selectedModuleIndex = isSelected ? null : index;
                renderModules();
            });
        }

        container.appendChild(item);
    });

    updateTotalWidth();
}

function showInsertMenu(afterIndex) {
    const container = document.getElementById('modulesContainer');
    const menu = document.createElement('div');
    menu.className = 'insert-menu';
    menu.innerHTML = `
        <h4>插入模块到下方</h4>
        <div class="insert-module-buttons">
            ${MODULE_TYPES.map(m =>
        `<button class="insert-module-btn" data-type="${m.name}" data-width="${m.defaultWidth}" 
                        style="background-color: ${m.color}">${m.label}</button>`
    ).join('')}
        </div>
        <button class="cancel-insert" onclick="removeInsertMenu()">取消</button>
    `;

    menu.querySelectorAll('.insert-module-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const width = parseFloat(btn.dataset.width);
            insertModule(afterIndex + 1, type, width);
            removeInsertMenu();
        });
    });

    container.appendChild(menu);
}

function removeInsertMenu() {
    const menu = document.querySelector('.insert-menu');
    if (menu) menu.remove();
}

function insertModule(index, type, width) {
    currentEditingModules.splice(index, 0, {
        name: type,
        width: width
    });
    selectedModuleIndex = null;
    renderModules();
}

function addModule(type, width) {
    if (!currentEditingTemplate) {
        showWarning('请先选择或创建一个模板！');
        return;
    }

    const moduleType = MODULE_TYPES.find(m => m.name === type);
    currentEditingModules.push({
        name: type,
        width: width
    });

    renderModules();
}

function addBidirectionalLanes() {
    if (!currentEditingTemplate) {
        showWarning('请先选择或创建一个模板！');
        return;
    }

    currentEditingModules.push(
        { name: 'Lane', width: 3.5 },
        { name: 'Lane', width: 3.5 },
        { name: 'Median', width: 2 },
        { name: 'Lane', width: 3.5 },
        { name: 'Lane', width: 3.5 }
    );

    renderModules();
}

function updateModuleWidth(index, value) {
    currentEditingModules[index].width = parseFloat(value) || 0.5;
    updateTotalWidth();
}

function removeModule(index) {
    currentEditingModules.splice(index, 1);
    renderModules();
}

function updateTotalWidth() {
    const total = currentEditingModules.reduce((sum, m) => sum + m.width, 0);
    document.getElementById('totalWidth').textContent = total.toFixed(1);
}

function createNewTemplate() {
    const newId = `template_${Date.now()}`;
    lanePresets[newId] = {
        name: '新模板',
        modules: []
    };

    renderTemplateList();
    selectTemplate(newId);
}

function saveTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const id = document.getElementById('templateId').value.trim();

    if (!name) {
        showWarning('请输入模板名称！');
        return;
    }

    if (!id || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(id)) {
        showWarning('请输入有效的模板ID（英文开头，仅字母、数字、下划线）！');
        return;
    }

    if (currentEditingModules.length === 0) {
        showWarning('请至少添加一个模块！');
        return;
    }

    if (id !== currentEditingTemplate && lanePresets[id]) {
        if (!confirm(`模板ID "${id}" 已存在，是否覆盖？`)) {
            return;
        }
        delete lanePresets[currentEditingTemplate];
    }

    lanePresets[id] = {
        name: name,
        modules: JSON.parse(JSON.stringify(currentEditingModules))
    };

    try {
        localStorage.setItem('maps_road_presets', JSON.stringify(lanePresets));
        showWarning('模板保存成功！');
        currentEditingTemplate = id;
        renderTemplateList();
        renderLaneButtons();
    } catch (err) {
        console.error('保存失败:', err);
        showWarning('保存失败：' + err.message);
    }
}

function deleteTemplate() {
    if (!currentEditingTemplate) {
        showWarning('请先选择一个模板！');
        return;
    }

    if (currentEditingTemplate === 'internalRoad') {
        showWarning('内部道路模板不能删除！');
        return;
    }

    if (!confirm(`确定要删除模板 "${lanePresets[currentEditingTemplate].name}" 吗？`)) {
        return;
    }

    delete lanePresets[currentEditingTemplate];

    try {
        localStorage.setItem('maps_road_presets', JSON.stringify(lanePresets));
        showWarning('模板删除成功！');
        currentEditingTemplate = null;
        currentEditingModules = [];
        document.getElementById('templateName').value = '';
        document.getElementById('templateId').value = '';
        renderModules();
        renderTemplateList();
        renderLaneButtons();
    } catch (err) {
        console.error('删除失败:', err);
        showWarning('删除失败：' + err.message);
    }
}

function openRoadEditor() {
    if (!roadEditorOpen) {
        initRoadEditor();
        roadEditorOpen = true;
    }
    document.getElementById('roadEditor').classList.remove('hidden');
    document.getElementById('roadEditorOverlay').classList.remove('hidden');
}

function closeRoadEditor() {
    document.getElementById('roadEditor').classList.add('hidden');
    document.getElementById('roadEditorOverlay').classList.add('hidden');
}
