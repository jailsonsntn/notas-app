// Variáveis globais
let notes = [];
let categories = [];
let activeCategory = 'minhas-notas';
let editingNoteId = null;
let selectedCategoryColor = 'blue';
let isDarkTheme = false;
let restoreNoteId = null;

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    setupRichEditor();
    renderCategories();
    renderCategoriesDropdown();
    renderNotes();
    applyTheme();
});

// Carregar dados do localStorage
function loadData() {
    // Carregar notas
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
        // Converter strings de data para objetos Date
        notes.forEach(note => {
            if (note.createdAt) note.createdAt = new Date(note.createdAt);
            if (note.expiresAt) note.expiresAt = new Date(note.expiresAt);
            if (note.deletedAt) note.deletedAt = new Date(note.deletedAt);
        });
    } else {
        // Notas iniciais para demonstração
        initializeDefaultNotes();
    }

    // Carregar categorias
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    }

    // Carregar categoria ativa
    const savedActiveCategory = localStorage.getItem('activeCategory');
    if (savedActiveCategory) {
        activeCategory = savedActiveCategory;
    }
    
    // Carregar tema
    const savedTheme = localStorage.getItem('isDarkTheme');
    if (savedTheme !== null) {
        isDarkTheme = JSON.parse(savedTheme);
    }
}

// Inicializar notas padrão
function initializeDefaultNotes() {
    const now = new Date();
    
    notes = [
        {
            id: 1,
            title: 'Preparar apresentação para a reunião',
            content: '',
            tags: ['trabalho', 'pendente'],
            categories: [],
            createdAt: now,
            hasReminder: true,
            reminderDate: '24 de abr. 10:00',
            isFavorite: false,
            isArchived: false,
            isQuickNote: false,
            isTask: false,
            isInTrash: false
        },
        {
            id: 2,
            title: 'Ideia de projeto',
            content: 'Aplicativo de organização pessoal',
            tags: ['ideia'],
            categories: [],
            createdAt: now,
            isFavorite: false,
            isArchived: false,
            isQuickNote: false,
            isTask: false,
            isInTrash: false
        },
        {
            id: 3,
            title: 'Comprar passagens',
            content: '',
            tags: [],
            categories: [],
            createdAt: now,
            isFavorite: false,
            isArchived: false,
            isQuickNote: false,
            isTask: false,
            isInTrash: false
        },
        {
            id: 4,
            title: 'Anotações rápidas',
            content: 'seções principais<br>design<br>funcionalidades',
            tags: [],
            categories: [],
            createdAt: now,
            isFavorite: false,
            isArchived: false,
            isQuickNote: true,
            expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 dias
            isTask: false,
            isInTrash: false
        },
        {
            id: 5,
            title: 'IDEIAS PARA O BLOG?',
            content: 'Seções principais<br>design<br>funcionalidades',
            tags: ['ideia'],
            categories: [],
            createdAt: now,
            isFavorite: false,
            isArchived: false,
            isQuickNote: false,
            isTask: false,
            isInTrash: false
        },
        {
            id: 6,
            title: 'Estudar para o exame de matemática',
            content: '',
            tags: [],
            categories: [],
            createdAt: now,
            isFavorite: false,
            isArchived: false,
            isQuickNote: false,
            isTask: true,
            taskItems: [
                { id: 'task-1', text: 'Estudar para oxame', completed: false }
            ],
            isInTrash: false
        }
    ];
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('activeCategory', activeCategory);
    localStorage.setItem('isDarkTheme', JSON.stringify(isDarkTheme));
}

// Configurar event listeners
function setupEventListeners() {
    // Event listener para o input de novas notas
    const noteInput = document.querySelector('.note-input');
    noteInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            addNewNote(this.value.trim());
            this.value = '';
        }
    });

    // Event listeners para itens da barra lateral
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-category]');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover classe active de todos os itens
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            // Adicionar classe active ao item clicado
            this.classList.add('active');
            
            // Atualizar categoria ativa
            activeCategory = this.dataset.category;
            
            // Atualizar título da categoria
            updateCategoryTitle();
            
            // Filtrar notas pela categoria
            renderNotes();
            
            // Salvar categoria ativa
            saveData();
        });
    });

    // Event listener para botão de criar categoria
    document.getElementById('create-category-btn').addEventListener('click', openCategoryModal);

    // Event listener para alternar tema
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Event listeners para modais
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.querySelector('.modal-overlay').addEventListener('click', closeAllModals);

    // Evitar que cliques dentro do modal fechem o modal
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // Event listeners para botões do modal de nota
    document.getElementById('cancel-note-btn').addEventListener('click', closeAllModals);
    document.getElementById('save-note-btn').addEventListener('click', saveNoteFromModal);

    // Event listener para checkbox de tarefa no modal
    document.getElementById('note-is-task').addEventListener('change', function() {
        document.getElementById('task-items-section').style.display = this.checked ? 'block' : 'none';
    });

    // Event listener para adicionar categoria
    document.getElementById('add-category-btn').addEventListener('click', addCategoryFromModal);
    document.getElementById('categories-dropdown').addEventListener('change', function() {
        if (this.value) {
            addCategoryFromModal(this.value);
            this.value = '';
        }
    });

    // Event listener para adicionar tag
    document.getElementById('add-tag-btn').addEventListener('click', addTagFromModal);
    document.getElementById('new-tag-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTagFromModal();
        }
    });

    // Event listener para adicionar item de tarefa
    document.getElementById('add-task-btn').addEventListener('click', addTaskItemFromModal);
    document.getElementById('new-task-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTaskItemFromModal();
        }
    });

    // Event listeners para botões do modal de categoria
    document.getElementById('cancel-category-btn').addEventListener('click', closeAllModals);
    document.getElementById('save-category-btn').addEventListener('click', saveCategoryFromModal);

    // Event listeners para opções de cor no modal de categoria
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedCategoryColor = this.dataset.color;
        });
    });

    // Event listeners para opções de visualização
    document.querySelectorAll('.view-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.view-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.dataset.view;
            const notesGrid = document.querySelector('.notes-grid');
            
            if (view === 'list') {
                notesGrid.classList.add('list-view');
            } else {
                notesGrid.classList.remove('list-view');
            }
        });
    });

    // Event listeners para botões do modal de esvaziar lixeira
    document.getElementById('cancel-empty-trash-btn').addEventListener('click', closeAllModals);
    document.getElementById('confirm-empty-trash-btn').addEventListener('click', emptyTrash);

    // Event listeners para botões do modal de restaurar nota
    document.getElementById('cancel-restore-note-btn').addEventListener('click', closeAllModals);
    document.getElementById('confirm-restore-note-btn').addEventListener('click', restoreNoteFromTrash);

    // Verificar notas expiradas a cada minuto
    setInterval(checkExpiredNotes, 60000);
}

// Configurar editor de texto rico
function setupRichEditor() {
    const buttons = document.querySelectorAll('.rich-editor-toolbar button');
    const editor = document.getElementById('rich-editor');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const command = this.dataset.command;
            
            if (command === 'foreColor' || command === 'hiliteColor') {
                // Não fazer nada aqui, o input de cor vai lidar com isso
            } else {
                document.execCommand(command, false, null);
            }
            
            // Atualizar estado ativo dos botões
            updateButtonStates();
        });
    });
    
    // Event listeners para inputs de cor
    document.querySelectorAll('.color-picker-input').forEach(input => {
        input.addEventListener('input', function() {
            const command = this.parentElement.dataset.command;
            document.execCommand(command, false, this.value);
        });
    });
    
    // Atualizar estado dos botões quando o cursor se move
    editor.addEventListener('keyup', updateButtonStates);
    editor.addEventListener('mouseup', updateButtonStates);
    editor.addEventListener('mousedown', updateButtonStates);
    
    // Função para atualizar estado dos botões
    function updateButtonStates() {
        buttons.forEach(button => {
            const command = button.dataset.command;
            
            if (command === 'foreColor' || command === 'hiliteColor') {
                // Não alterar estado para botões de cor
                return;
            }
            
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
}

// Alternar tema claro/escuro
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    applyTheme();
    saveData();
    
    // Atualizar texto e ícone do botão
    const themeToggle = document.getElementById('theme-toggle');
    if (isDarkTheme) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Modo claro</span>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Modo escuro</span>';
    }
}

// Aplicar tema atual
function applyTheme() {
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    // Atualizar texto e ícone do botão
    const themeToggle = document.getElementById('theme-toggle');
    if (isDarkTheme) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Modo claro</span>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Modo escuro</span>';
    }
}

// Atualizar título da categoria atual
function updateCategoryTitle() {
    const title = document.getElementById('current-category-title');
    
    switch (activeCategory) {
        case 'minhas-notas':
            title.textContent = 'Minhas notas';
            break;
        case 'favoritos':
            title.textContent = 'Favoritos';
            break;
        case 'tarefas':
            title.textContent = 'Tarefas';
            break;
        case 'ideias':
            title.textContent = 'Idéias';
            break;
        case 'anotacoes-rapidas':
            title.textContent = 'Anotações rápidas';
            break;
        case 'arquivadas':
            title.textContent = 'Arquivadas';
            break;
        case 'lixeira':
            title.textContent = 'Lixeira';
            break;
        default:
            // Para categorias personalizadas
            const category = categories.find(cat => cat.id === activeCategory);
            if (category) {
                title.textContent = category.name;
            } else {
                title.textContent = 'Notas';
            }
    }
}

// Adicionar nova nota
function addNewNote(text) {
    const now = new Date();
    const newNote = {
        id: Date.now(),
        title: text,
        content: '',
        tags: [],
        categories: [],
        createdAt: now,
        isFavorite: false,
        isArchived: false,
        isQuickNote: activeCategory === 'anotacoes-rapidas',
        isTask: activeCategory === 'tarefas',
        taskItems: [],
        isInTrash: false
    };
    
    // Se for anotação rápida, definir data de expiração
    if (newNote.isQuickNote) {
        newNote.expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias
    }
    
    // Se estiver em uma categoria personalizada, adicionar categoria correspondente
    if (!['minhas-notas', 'favoritos', 'tarefas', 'ideias', 'anotacoes-rapidas', 'arquivadas', 'lixeira'].includes(activeCategory)) {
        const category = categories.find(cat => cat.id === activeCategory);
        if (category) {
            newNote.categories.push(category.id);
        }
    }
    
    // Se estiver na categoria ideias, adicionar tag ideia
    if (activeCategory === 'ideias') {
        newNote.tags.push('ideia');
    }
    
    notes.unshift(newNote);
    saveData();
    renderNotes();
}

// Renderizar notas
function renderNotes() {
    const notesGrid = document.querySelector('.notes-grid');
    notesGrid.innerHTML = '';
    
    // Filtrar notas por categoria
    let filteredNotes = filterNotesByCategory();
    
    // Verificar se há notas para exibir
    if (filteredNotes.length === 0) {
        let emptyMessage = 'Nenhuma nota encontrada';
        let emptyIcon = 'fa-sticky-note';
        
        if (activeCategory === 'lixeira') {
            emptyMessage = 'A lixeira está vazia';
            emptyIcon = 'fa-trash-alt';
        }
        
        notesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas ${emptyIcon} fa-3x"></i>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    // Adicionar botão para esvaziar lixeira se estiver na categoria lixeira e houver notas
    if (activeCategory === 'lixeira' && filteredNotes.length > 0) {
        const emptyTrashBtn = document.createElement('button');
        emptyTrashBtn.className = 'btn btn-danger empty-trash-btn';
        emptyTrashBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Esvaziar lixeira';
        emptyTrashBtn.addEventListener('click', openEmptyTrashModal);
        
        notesGrid.appendChild(emptyTrashBtn);
    }
    
    // Renderizar cada nota
    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.id = note.id;
        
        // Adicionar classes específicas
        if (note.isFavorite) noteCard.classList.add('favorite');
        if (note.isTask) noteCard.classList.add('task');
        if (note.isQuickNote) noteCard.classList.add('quick-note');
        if (note.isArchived) noteCard.classList.add('archived');
        if (note.isInTrash) noteCard.classList.add('trash');
        
        // Renderizar tags
        let tagsHTML = '';
        if (note.tags && note.tags.length > 0) {
            tagsHTML = `
                <div class="note-tags">
                    ${note.tags.map(tag => {
                        // Verificar se é uma tag de categoria personalizada
                        const category = categories.find(cat => cat.name.toLowerCase() === tag.toLowerCase());
                        const tagClass = category ? `tag-${category.color}` : `tag-${getTagColor(tag)}`;
                        return `<span class="tag ${tagClass}">${tag}</span>`;
                    }).join('')}
                </div>
            `;
        }
        
        // Renderizar categorias
        let categoriesHTML = '';
        if (note.categories && note.categories.length > 0) {
            categoriesHTML = `
                <div class="note-categories">
                    ${note.categories.map(categoryId => {
                        const category = categories.find(cat => cat.id === categoryId);
                        if (category) {
                            return `<span class="tag tag-${category.color}">${category.name}</span>`;
                        }
                        return '';
                    }).join('')}
                </div>
            `;
        }
        
        // Renderizar data
        let dateHTML = '';
        if (note.hasReminder && note.reminderDate) {
            dateHTML = `
                <div class="note-date">
                    <i class="fas fa-bell"></i>
                    <span>${note.reminderDate}</span>
                </div>
            `;
        } else if (note.isQuickNote && note.expiresAt) {
            const daysLeft = Math.ceil((new Date(note.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
            dateHTML = `
                <div class="note-date expiration">
                    <i class="fas fa-clock"></i>
                    <span>Expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</span>
                </div>
            `;
        } else if (note.isArchived && note.expiresAt) {
            const daysLeft = Math.ceil((new Date(note.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
            dateHTML = `
                <div class="note-date expiration">
                    <i class="fas fa-archive"></i>
                    <span>Arquivada - ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restantes</span>
                </div>
            `;
        } else if (note.isInTrash && note.deletedAt) {
            const daysLeft = Math.ceil((new Date(note.deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000 - new Date()) / (1000 * 60 * 60 * 24));
            dateHTML = `
                <div class="note-date expiration">
                    <i class="fas fa-trash-alt"></i>
                    <span>Excluída - ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restantes</span>
                </div>
            `;
        }
        
        // Renderizar conteúdo
        let contentHTML = '';
        if (note.isTask && note.taskItems && note.taskItems.length > 0) {
            contentHTML = `
                <div class="task-list">
                    ${note.taskItems.map(item => {
                        const checkedAttr = item.completed ? 'checked' : '';
                        const textStyle = item.completed ? 'style="text-decoration: line-through; color: #888;"' : '';
                        return `
                            <div class="checkbox-item">
                                <input type="checkbox" id="${item.id}" ${checkedAttr} data-note-id="${note.id}" ${note.isInTrash ? 'disabled' : ''}>
                                <label for="${item.id}" ${textStyle}>${item.text}</label>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (note.content) {
            contentHTML = `<div class="note-content-text">${note.content}</div>`;
        }
        
        // Renderizar ações da nota (diferentes para lixeira)
        let actionsHTML = '';
        if (note.isInTrash) {
            actionsHTML = `
                <div class="note-actions">
                    <button class="note-action restore" title="Restaurar" data-id="${note.id}">
                        <i class="fas fa-trash-restore"></i>
                    </button>
                    <button class="note-action delete-permanent" title="Excluir permanentemente" data-id="${note.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        } else {
            actionsHTML = `
                <div class="note-actions">
                    <button class="note-action edit" title="Editar" data-id="${note.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="note-action favorite ${note.isFavorite ? 'active' : ''}" title="Favorito" data-id="${note.id}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="note-action archive" title="${note.isArchived ? 'Desarquivar' : 'Arquivar'}" data-id="${note.id}">
                        <i class="fas ${note.isArchived ? 'fa-inbox' : 'fa-archive'}"></i>
                    </button>
                    <button class="note-action delete" title="Excluir" data-id="${note.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        
        noteCard.innerHTML = `
            <div class="note-content">
                <h3>${note.title}</h3>
                ${contentHTML}
                ${categoriesHTML}
                ${tagsHTML}
                ${dateHTML}
            </div>
            ${actionsHTML}
        `;
        
        notesGrid.appendChild(noteCard);
    });
    
    // Adicionar event listeners para ações das notas
    addNoteActionListeners();
}

// Filtrar notas por categoria
function filterNotesByCategory() {
    switch (activeCategory) {
        case 'minhas-notas':
            // Todas as notas não arquivadas e não na lixeira
            return notes.filter(note => !note.isArchived && !note.isInTrash);
        
        case 'favoritos':
            // Apenas notas favoritas não arquivadas e não na lixeira
            return notes.filter(note => note.isFavorite && !note.isArchived && !note.isInTrash);
        
        case 'tarefas':
            // Apenas tarefas não arquivadas e não na lixeira
            return notes.filter(note => note.isTask && !note.isArchived && !note.isInTrash);
        
        case 'ideias':
            // Notas com tag 'ideia' não arquivadas e não na lixeira
            return notes.filter(note => note.tags.includes('ideia') && !note.isArchived && !note.isInTrash);
        
        case 'anotacoes-rapidas':
            // Anotações rápidas não arquivadas e não na lixeira
            return notes.filter(note => note.isQuickNote && !note.isArchived && !note.isInTrash);
        
        case 'arquivadas':
            // Apenas notas arquivadas e não na lixeira
            return notes.filter(note => note.isArchived && !note.isInTrash);
        
        case 'lixeira':
            // Apenas notas na lixeira
            return notes.filter(note => note.isInTrash);
        
        default:
            // Para categorias personalizadas, filtrar por categoria correspondente e não na lixeira
            return notes.filter(note => 
                note.categories && 
                note.categories.includes(activeCategory) && 
                !note.isArchived &&
                !note.isInTrash
            );
    }
}

// Adicionar event listeners para ações das notas
function addNoteActionListeners() {
    // Event listener para editar nota
    document.querySelectorAll('.note-action.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.dataset.id);
            openNoteModal(noteId);
        });
    });
    
    // Event listener para favoritar/desfavoritar nota
    document.querySelectorAll('.note-action.favorite').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.dataset.id);
            toggleFavorite(noteId);
        });
    });
    
    // Event listener para arquivar/desarquivar nota
    document.querySelectorAll('.note-action.archive').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.dataset.id);
            toggleArchive(noteId);
        });
    });
    
    // Event listener para excluir nota (mover para lixeira)
    document.querySelectorAll('.note-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.dataset.id);
            moveToTrash(noteId);
        });
    });
    
    // Event listener para restaurar nota da lixeira
    document.querySelectorAll('.note-action.restore').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.dataset.id);
            openRestoreNoteModal(noteId);
        });
    });
    
    // Event listener para excluir permanentemente nota
    document.querySelectorAll('.note-action.delete-permanent').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.dataset.id);
            deletePermanently(noteId);
        });
    });
    
    // Event listener para checkboxes de tarefas
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const noteId = parseInt(this.dataset.noteId);
            const taskId = this.id;
            toggleTaskCompletion(noteId, taskId, this.checked);
            
            // Atualizar visual (riscar texto se marcado)
            const label = document.querySelector(`label[for="${taskId}"]`);
            if (label) {
                if (this.checked) {
                    label.style.textDecoration = 'line-through';
                    label.style.color = '#888';
                } else {
                    label.style.textDecoration = 'none';
                    label.style.color = 'var(--text-color)';
                }
            }
        });
    });
}

// Renderizar categorias na barra lateral
function renderCategories() {
    const categoriesContainer = document.getElementById('custom-categories');
    categoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'sidebar-item';
        categoryItem.dataset.category = category.id;
        
        if (activeCategory === category.id) {
            categoryItem.classList.add('active');
        }
        
        categoryItem.innerHTML = `
            <i class="fas fa-tag" style="color: var(--${category.color}-color, var(--primary-color));"></i>
            <span>${category.name}</span>
        `;
        
        // Event listener para selecionar categoria
        categoryItem.addEventListener('click', function() {
            document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            activeCategory = category.id;
            updateCategoryTitle();
            renderNotes();
            saveData();
        });
        
        categoriesContainer.appendChild(categoryItem);
    });
}

// Renderizar dropdown de categorias no modal
function renderCategoriesDropdown() {
    const dropdown = document.getElementById('categories-dropdown');
    
    // Manter apenas a primeira opção (placeholder)
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Adicionar categorias ao dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        dropdown.appendChild(option);
    });
}

// Abrir modal para editar nota
function openNoteModal(noteId = null) {
    // Limpar o modal
    document.getElementById('edit-note-title').value = '';
    document.getElementById('rich-editor').innerHTML = '';
    document.getElementById('edit-note-content').value = '';
    document.getElementById('note-categories-list').innerHTML = '';
    document.getElementById('note-tags-list').innerHTML = '';
    document.getElementById('task-items-container').innerHTML = '';
    document.getElementById('note-is-task').checked = false;
    document.getElementById('note-is-favorite').checked = false;
    document.getElementById('note-is-quick').checked = false;
    document.getElementById('task-items-section').style.display = 'none';
    
    // Definir título do modal
    document.getElementById('modal-title').textContent = noteId ? 'Editar nota' : 'Nova nota';
    
    // Se estiver editando uma nota existente
    if (noteId) {
        editingNoteId = noteId;
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            // Preencher campos do modal
            document.getElementById('edit-note-title').value = note.title;
            document.getElementById('rich-editor').innerHTML = note.content;
            document.getElementById('edit-note-content').value = note.content;
            document.getElementById('note-is-task').checked = note.isTask;
            document.getElementById('note-is-favorite').checked = note.isFavorite;
            document.getElementById('note-is-quick').checked = note.isQuickNote;
            
            // Mostrar seção de tarefas se for uma tarefa
            if (note.isTask) {
                document.getElementById('task-items-section').style.display = 'block';
                
                // Preencher itens de tarefa
                if (note.taskItems && note.taskItems.length > 0) {
                    note.taskItems.forEach(item => {
                        addTaskItemToModal(item.id, item.text, item.completed);
                    });
                }
            }
            
            // Preencher categorias
            if (note.categories && note.categories.length > 0) {
                note.categories.forEach(categoryId => {
                    addCategoryToModal(categoryId);
                });
            }
            
            // Preencher tags
            if (note.tags && note.tags.length > 0) {
                note.tags.forEach(tag => {
                    addTagToModal(tag);
                });
            }
        }
    } else {
        editingNoteId = null;
    }
    
    // Abrir o modal
    document.getElementById('note-modal').style.display = 'block';
    document.querySelector('.modal-overlay').style.display = 'block';
}

// Salvar nota a partir do modal
function saveNoteFromModal() {
    const title = document.getElementById('edit-note-title').value.trim();
    const content = document.getElementById('rich-editor').innerHTML;
    const isTask = document.getElementById('note-is-task').checked;
    const isFavorite = document.getElementById('note-is-favorite').checked;
    const isQuickNote = document.getElementById('note-is-quick').checked;
    
    // Verificar se há título
    if (!title) {
        alert('Por favor, insira um título para a nota.');
        return;
    }
    
    // Coletar categorias
    const selectedCategories = [];
    document.querySelectorAll('#note-categories-list .category').forEach(categoryElement => {
        selectedCategories.push(categoryElement.dataset.id);
    });
    
    // Coletar tags
    const tags = [];
    document.querySelectorAll('#note-tags-list .tag').forEach(tagElement => {
        tags.push(tagElement.textContent.trim());
    });
    
    // Coletar itens de tarefa
    const taskItems = [];
    if (isTask) {
        document.querySelectorAll('#task-items-container .task-item').forEach(taskElement => {
            const taskId = taskElement.dataset.id;
            const taskText = taskElement.querySelector('.task-text').textContent.trim();
            const taskCompleted = taskElement.querySelector('input[type="checkbox"]').checked;
            
            taskItems.push({
                id: taskId,
                text: taskText,
                completed: taskCompleted
            });
        });
    }
    
    const now = new Date();
    
    // Se estiver editando uma nota existente
    if (editingNoteId) {
        const noteIndex = notes.findIndex(n => n.id === editingNoteId);
        
        if (noteIndex !== -1) {
            // Manter algumas propriedades da nota original
            const originalNote = notes[noteIndex];
            const updatedNote = {
                ...originalNote,
                title,
                content,
                categories: selectedCategories,
                tags,
                isTask,
                isFavorite,
                isQuickNote,
                taskItems: isTask ? taskItems : []
            };
            
            // Atualizar data de expiração se for anotação rápida
            if (isQuickNote && !originalNote.isQuickNote) {
                updatedNote.expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias
            } else if (!isQuickNote && !updatedNote.isArchived) {
                delete updatedNote.expiresAt;
            }
            
            notes[noteIndex] = updatedNote;
        }
    } else {
        // Criar nova nota
        const newNote = {
            id: Date.now(),
            title,
            content,
            categories: selectedCategories,
            tags,
            createdAt: now,
            isFavorite,
            isArchived: false,
            isQuickNote,
            isTask,
            taskItems: isTask ? taskItems : [],
            isInTrash: false
        };
        
        // Se for anotação rápida, definir data de expiração
        if (isQuickNote) {
            newNote.expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias
        }
        
        notes.unshift(newNote);
    }
    
    // Salvar dados e atualizar interface
    saveData();
    renderNotes();
    closeAllModals();
}

// Adicionar categoria ao modal
function addCategoryToModal(categoryId) {
    const categoriesList = document.getElementById('note-categories-list');
    const category = categories.find(cat => cat.id === categoryId);
    
    if (!category) return;
    
    // Verificar se a categoria já existe
    if (categoriesList.querySelector(`.category[data-id="${categoryId}"]`)) {
        return;
    }
    
    const categoryElement = document.createElement('div');
    categoryElement.className = `category tag tag-${category.color}`;
    categoryElement.dataset.id = categoryId;
    categoryElement.innerHTML = `
        ${category.name}
        <span class="remove-category"><i class="fas fa-times"></i></span>
    `;
    
    // Event listener para remover categoria
    categoryElement.querySelector('.remove-category').addEventListener('click', function() {
        categoryElement.remove();
    });
    
    categoriesList.appendChild(categoryElement);
}

// Adicionar categoria a partir do dropdown
function addCategoryFromModal(categoryId) {
    if (!categoryId) {
        const dropdown = document.getElementById('categories-dropdown');
        categoryId = dropdown.value;
        
        if (!categoryId) return;
        
        // Resetar dropdown
        dropdown.value = '';
    }
    
    addCategoryToModal(categoryId);
}

// Adicionar tag ao modal
function addTagToModal(tagText) {
    const tagsList = document.getElementById('note-tags-list');
    const tag = document.createElement('div');
    
    // Verificar se a tag já existe
    const existingTags = Array.from(tagsList.querySelectorAll('.tag')).map(t => t.textContent.trim());
    if (existingTags.includes(tagText)) {
        return;
    }
    
    // Verificar se é uma tag de categoria personalizada
    const category = categories.find(cat => cat.name.toLowerCase() === tagText.toLowerCase());
    const tagClass = category ? `tag-${category.color}` : `tag-${getTagColor(tagText)}`;
    
    tag.className = `tag ${tagClass}`;
    tag.innerHTML = `
        ${tagText}
        <span class="remove-tag"><i class="fas fa-times"></i></span>
    `;
    
    // Event listener para remover tag
    tag.querySelector('.remove-tag').addEventListener('click', function() {
        tag.remove();
    });
    
    tagsList.appendChild(tag);
}

// Adicionar tag a partir do modal
function addTagFromModal() {
    const tagInput = document.getElementById('new-tag-input');
    const tagText = tagInput.value.trim();
    
    if (tagText) {
        addTagToModal(tagText);
        tagInput.value = '';
    }
}

// Adicionar item de tarefa ao modal
function addTaskItemToModal(id = null, text = '', completed = false) {
    const taskContainer = document.getElementById('task-items-container');
    const taskId = id || `task-${Date.now()}`;
    
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.id = taskId;
    
    taskItem.innerHTML = `
        <div class="checkbox-item">
            <input type="checkbox" id="${taskId}-modal" ${completed ? 'checked' : ''}>
            <span class="task-text" ${completed ? 'style="text-decoration: line-through; color: #888;"' : ''}>${text}</span>
            <span class="remove-task"><i class="fas fa-times"></i></span>
        </div>
    `;
    
    // Event listener para remover item
    taskItem.querySelector('.remove-task').addEventListener('click', function() {
        taskItem.remove();
    });
    
    // Event listener para marcar/desmarcar item
    const checkbox = taskItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function() {
        const taskText = taskItem.querySelector('.task-text');
        if (this.checked) {
            taskText.style.textDecoration = 'line-through';
            taskText.style.color = '#888';
        } else {
            taskText.style.textDecoration = 'none';
            taskText.style.color = 'var(--text-color)';
        }
    });
    
    taskContainer.appendChild(taskItem);
}

// Adicionar item de tarefa a partir do modal
function addTaskItemFromModal() {
    const taskInput = document.getElementById('new-task-input');
    const taskText = taskInput.value.trim();
    
    if (taskText) {
        addTaskItemToModal(null, taskText, false);
        taskInput.value = '';
    }
}

// Abrir modal para criar categoria
function openCategoryModal() {
    // Limpar o modal
    document.getElementById('category-name').value = '';
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector(`.color-option[data-color="blue"]`).classList.add('selected');
    selectedCategoryColor = 'blue';
    
    // Abrir o modal
    document.getElementById('category-modal').style.display = 'block';
    document.querySelector('.modal-overlay').style.display = 'block';
}

// Salvar categoria a partir do modal
function saveCategoryFromModal() {
    const categoryName = document.getElementById('category-name').value.trim();
    
    if (!categoryName) {
        alert('Por favor, insira um nome para a categoria.');
        return;
    }
    
    // Verificar se já existe uma categoria com esse nome
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
        alert('Já existe uma categoria com esse nome.');
        return;
    }
    
    // Criar nova categoria
    const newCategory = {
        id: `category-${Date.now()}`,
        name: categoryName,
        color: selectedCategoryColor
    };
    
    categories.push(newCategory);
    saveData();
    renderCategories();
    renderCategoriesDropdown();
    closeAllModals();
}

// Fechar todos os modais
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.querySelector('.modal-overlay').style.display = 'none';
}

// Alternar favorito
function toggleFavorite(noteId) {
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
        notes[noteIndex].isFavorite = !notes[noteIndex].isFavorite;
        saveData();
        renderNotes();
    }
}

// Alternar arquivamento
function toggleArchive(noteId) {
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1) {
        const note = notes[noteIndex];
        note.isArchived = !note.isArchived;
        
        // Se estiver arquivando, definir data de expiração
        if (note.isArchived) {
            const now = new Date();
            note.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
        } else if (!note.isQuickNote) {
            // Se estiver desarquivando e não for anotação rápida, remover data de expiração
            delete note.expiresAt;
        } else {
            // Se for anotação rápida, redefinir data de expiração para 5 dias
            const now = new Date();
            note.expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias
        }
        
        saveData();
        renderNotes();
    }
}

// Mover nota para a lixeira
function moveToTrash(noteId) {
    if (confirm('Tem certeza que deseja mover esta nota para a lixeira?')) {
        const noteIndex = notes.findIndex(n => n.id === noteId);
        
        if (noteIndex !== -1) {
            const now = new Date();
            notes[noteIndex].isInTrash = true;
            notes[noteIndex].deletedAt = now;
            notes[noteIndex].expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
            
            saveData();
            renderNotes();
        }
    }
}

// Abrir modal para restaurar nota
function openRestoreNoteModal(noteId) {
    restoreNoteId = noteId;
    document.getElementById('restore-note-modal').style.display = 'block';
    document.querySelector('.modal-overlay').style.display = 'block';
}

// Restaurar nota da lixeira
function restoreNoteFromTrash() {
    if (restoreNoteId) {
        const noteIndex = notes.findIndex(n => n.id === restoreNoteId);
        
        if (noteIndex !== -1) {
            notes[noteIndex].isInTrash = false;
            delete notes[noteIndex].deletedAt;
            
            // Se for anotação rápida, redefinir data de expiração para 5 dias
            if (notes[noteIndex].isQuickNote) {
                const now = new Date();
                notes[noteIndex].expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias
            } else if (notes[noteIndex].isArchived) {
                // Se for arquivada, redefinir data de expiração para 30 dias
                const now = new Date();
                notes[noteIndex].expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
            } else {
                // Se não for nem rápida nem arquivada, remover data de expiração
                delete notes[noteIndex].expiresAt;
            }
            
            saveData();
            renderNotes();
        }
        
        restoreNoteId = null;
        closeAllModals();
    }
}

// Excluir nota permanentemente
function deletePermanently(noteId) {
    if (confirm('Tem certeza que deseja excluir permanentemente esta nota? Esta ação não pode ser desfeita.')) {
        notes = notes.filter(n => n.id !== noteId);
        saveData();
        renderNotes();
    }
}

// Abrir modal para esvaziar lixeira
function openEmptyTrashModal() {
    document.getElementById('empty-trash-modal').style.display = 'block';
    document.querySelector('.modal-overlay').style.display = 'block';
}

// Esvaziar lixeira
function emptyTrash() {
    notes = notes.filter(note => !note.isInTrash);
    saveData();
    renderNotes();
    closeAllModals();
}

// Alternar conclusão de tarefa
function toggleTaskCompletion(noteId, taskId, completed) {
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex !== -1 && notes[noteIndex].taskItems) {
        const taskIndex = notes[noteIndex].taskItems.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            notes[noteIndex].taskItems[taskIndex].completed = completed;
            saveData();
        }
    }
}

// Verificar notas expiradas
function checkExpiredNotes() {
    const now = new Date();
    let hasExpired = false;
    
    // Verificar notas na lixeira que expiraram (30 dias)
    notes = notes.filter(note => {
        // Se a nota está na lixeira e tem data de exclusão e já expirou
        if (note.isInTrash && note.deletedAt && new Date(note.expiresAt) < now) {
            hasExpired = true;
            return false; // Remover nota
        }
        return true; // Manter nota
    });
    
    // Verificar anotações rápidas que expiraram (5 dias)
    notes = notes.filter(note => {
        // Se a nota é uma anotação rápida, não está na lixeira, tem data de expiração e já expirou
        if (note.isQuickNote && !note.isInTrash && note.expiresAt && new Date(note.expiresAt) < now) {
            hasExpired = true;
            return false; // Remover nota
        }
        return true; // Manter nota
    });
    
    // Verificar notas arquivadas que expiraram (30 dias)
    notes = notes.filter(note => {
        // Se a nota está arquivada, não está na lixeira, tem data de expiração e já expirou
        if (note.isArchived && !note.isInTrash && note.expiresAt && new Date(note.expiresAt) < now) {
            hasExpired = true;
            return false; // Remover nota
        }
        return true; // Manter nota
    });
    
    if (hasExpired) {
        saveData();
        renderNotes();
    }
}

// Obter cor para tag
function getTagColor(tag) {
    // Cores predefinidas para tags comuns
    const tagColors = {
        'trabalho': 'blue',
        'pendente': 'yellow',
        'ideia': 'purple',
        'pessoal': 'green',
        'urgente': 'red',
        'importante': 'orange'
    };
    
    return tagColors[tag.toLowerCase()] || 'blue';
}
