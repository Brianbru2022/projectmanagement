// --- Wait for the DOM to be fully loaded ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const DOMElements = {
        siteSelectHeader: document.getElementById('site-select-header'),
        mainHeader: document.getElementById('main-header'),
        timelineContent: document.getElementById('timeline-content'),
        timelineDates: document.getElementById('timeline-dates'),
        emptyStateMessage: document.getElementById('empty-state-message'),
        addTaskModal: document.getElementById('add-task-modal'),
        addHierarchyModal: document.getElementById('add-hierarchy-modal'),
        confirmModal: document.getElementById('confirm-modal'),
        toastContainer: document.getElementById('toast-container'),
        // New elements for the settings modals
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        closeSettingsBtn: document.getElementById('close-settings-btn'),
        manageSitesOption: document.getElementById('manage-sites-option'),
        manageSitesModal: document.getElementById('manage-sites-modal'),
        closeManageSitesBtn: document.getElementById('close-manage-sites-btn'),
        addNewSiteOption: document.getElementById('add-new-site-option'),
        siteListToRemove: document.getElementById('site-list-to-remove'),
        confirmOkBtn: document.getElementById('confirm-ok-btn'),
        confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
        addHierarchyTitle: document.getElementById('add-hierarchy-title'),
        hierarchyNameInput: document.getElementById('hierarchy-name-input'),
        okHierarchyBtn: document.getElementById('ok-hierarchy-btn'),
        cancelHierarchyBtn: document.getElementById('cancel-hierarchy-btn'),
        addItemSelectionModal: document.getElementById('add-item-selection-modal'),
        cancelItemSelectionBtn: document.getElementById('cancel-item-selection-btn'),
        // Task Modal Elements
        addTaskForm: document.getElementById('add-task-form'),
        taskNameInput: document.getElementById('task-name'),
        taskDueDateInput: document.getElementById('task-due-date'),
        taskEndDateInput: document.getElementById('task-end-date'),
        taskDependencySelect: document.getElementById('task-dependency-select'),
        cancelAddTaskBtn: document.getElementById('cancel-add-task-btn'),
    };

    // --- State Variables (The single source of truth) ---
    let state = {
        sites: [],
        phases: [],
        sections: [],
        subsections: [],
        tasks: [],
        selectedSiteId: null,
        modalTarget: {
            parentId: null,
            parentType: null,
            typeToAdd: null,
        },
        siteToDeleteId: null
    };

    // --- Helper Functions ---
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
    const dateToYMD = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        DOMElements.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // --- Data Persistence ---
    const saveState = () => {
        localStorage.setItem('constructionTrackerState', JSON.stringify(state));
    };

    const loadState = () => {
        const savedState = localStorage.getItem('constructionTrackerState');
        if (savedState) {
            state = JSON.parse(savedState);
        }
    };
    
    const saveAndRender = () => {
        saveState();
        render();
    };

    // --- Core Rendering Logic ---
    const render = () => {
        renderSiteSelector();
        renderTimeline();
        console.log("Render complete. Current state:", state);
    };

    const renderSiteSelector = () => {
        const { sites, selectedSiteId } = state;
        DOMElements.siteSelectHeader.innerHTML = '';
        if (sites.length === 0) {
            DOMElements.siteSelectHeader.innerHTML = '<option value="">No sites available</option>';
            DOMElements.mainHeader.textContent = 'Construction Progress Tracker';
            return;
        }

        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site.id;
            option.textContent = site.name;
            option.selected = site.id === selectedSiteId;
            DOMElements.siteSelectHeader.appendChild(option);
        });

        const selectedSite = sites.find(s => s.id === selectedSiteId);
        DOMElements.mainHeader.textContent = selectedSite ? selectedSite.name : 'Select a Site';
    };

    const renderTimeline = () => {
        DOMElements.timelineContent.innerHTML = '';
        DOMElements.timelineDates.innerHTML = '';
        const { phases, sections, subsections, tasks, selectedSiteId } = state;
        
        if (!selectedSiteId || state.sites.length === 0) {
            DOMElements.emptyStateMessage.classList.remove('hidden');
            DOMElements.emptyStateMessage.innerHTML = `<p class="mb-4">Please select or create a site to view its timeline.</p>`;
            return;
        }

        const siteTasks = tasks.filter(t => t.siteId === selectedSiteId);
        const sitePhases = phases.filter(p => p.siteId === selectedSiteId);
        const siteSections = sections.filter(s => s.siteId === selectedSiteId);
        const siteSubsections = subsections.filter(ss => ss.siteId === selectedSiteId);
        
        if (siteTasks.length === 0 && sitePhases.length === 0) {
            DOMElements.emptyStateMessage.classList.remove('hidden');
            DOMElements.emptyStateMessage.innerHTML = `<p class="mb-4">This site has no phases or tasks. Add a phase to get started.</p>`;
            return;
        }
        
        DOMElements.emptyStateMessage.classList.add('hidden');
        renderDateHeaders(siteTasks);

        sitePhases.forEach(phase => {
            const phaseDiv = createCollapsibleDiv(phase, 'phase', 1);
            DOMElements.timelineContent.appendChild(phaseDiv);
            const phaseContent = phaseDiv.querySelector('.collapsible-content');

            const phaseSections = siteSections.filter(s => s.phaseId === phase.id);
            phaseSections.forEach(section => {
                const sectionDiv = createCollapsibleDiv(section, 'section', 2);
                phaseContent.appendChild(sectionDiv);
                const sectionContent = sectionDiv.querySelector('.collapsible-content');

                const sectionSubsections = siteSubsections.filter(ss => ss.sectionId === section.id);
                sectionSubsections.forEach(subsection => {
                    const subsectionDiv = createCollapsibleDiv(subsection, 'subsection', 3);
                    sectionContent.appendChild(subsectionDiv);
                    const subsectionContent = subsectionDiv.querySelector('.collapsible-content');
                    
                    const subsectionTasks = siteTasks.filter(t => t.subsectionId === subsection.id);
                    subsectionTasks.forEach(task => {
                        const taskRow = createTaskRow(task, siteTasks);
                        subsectionContent.appendChild(taskRow);
                    });
                });
                const sectionTasks = siteTasks.filter(t => t.sectionId === section.id && !t.subsectionId);
                sectionTasks.forEach(task => {
                    const taskRow = createTaskRow(task, siteTasks);
                    sectionContent.appendChild(taskRow);
                });
            });
            const phaseTasks = siteTasks.filter(t => t.phaseId === phase.id && !t.sectionId);
            phaseTasks.forEach(task => {
                const taskRow = createTaskRow(task, siteTasks);
                phaseContent.appendChild(taskRow);
            });
        });
        
        const siteLevelTasks = siteTasks.filter(t => !t.phaseId);
        siteLevelTasks.forEach(task => {
             const taskRow = createTaskRow(task, siteTasks);
             DOMElements.timelineContent.appendChild(taskRow);
        });
    };

    const createCollapsibleDiv = (item, type, level) => {
        const div = document.createElement('div');
        div.className = "flex flex-col border-b border-gray-200";
        const color = generateColor(item.id);
        const padding = (level * 1) + 1;

        div.innerHTML = `
            <div class="collapsible-header flex-none w-64 pr-4 pl-6 py-2 border-r border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                <div class="hierarchy-item-container flex items-center justify-between">
                    <div class="flex items-center" style="padding-left: ${padding}rem;">
                        <svg class="w-4 h-4 mr-1 transform rotate-0 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                        <span class="font-bold text-sm text-gray-700" style="color: ${color};">${item.name}</span>
                    </div>
                    <div class="add-icon-group flex gap-1">
                        ${level < 3 ? `
                            <button onclick="showAddItemMenu('${item.id}', '${type}')" class="text-gray-500 hover:text-green-600 transition-colors" title="Add new ${type === 'site' ? 'phase' : (type === 'phase' ? 'section' : 'sub-section')}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                            </button>
                        ` : ''}
                        <button onclick="showAddItemMenu('${item.id}', '${type}')" class="text-gray-500 hover:text-blue-600 transition-colors" title="Add new task">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="collapsible-content"></div>
        `;
        
        const header = div.querySelector('.collapsible-header');
        const content = div.querySelector('.collapsible-content');
        
        header.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) {
                return;
            }
            const icon = header.querySelector('svg');
            content.classList.toggle('expanded');
            icon.classList.toggle('rotate-180');
        });

        return div;
    };
    
    const createTaskRow = (task, allTasks) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = "flex items-center border-t border-gray-200 py-2 hover:bg-gray-50 transition-colors duration-200";

        // Timeline dimensions logic
        const allDates = allTasks.flatMap(task => [new Date(task.dueDate), new Date(task.endDate)]);
        const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date();
        const timelineStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
        timelineStart.setDate(timelineStart.getDate() - 7);

        const dueDate = new Date(task.dueDate);
        const endDate = new Date(task.endDate);
        const actualStartDate = task.actualStartDate ? new Date(task.actualStartDate) : null;
        const actualEndDate = task.actualEndDate ? new Date(task.actualEndDate) : null;
        
        const startDay = Math.floor((dueDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
        const endDay = Math.ceil((endDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
        const durationInDays = endDay - startDay;

        const actualStartDay = actualStartDate ? Math.floor((actualStartDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const actualEndDay = actualEndDate ? Math.ceil((actualEndDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const actualDurationInDays = (actualEndDay !== null && actualStartDay !== null) ? actualEndDay - actualStartDay : 0;
        
        const statusClass = getTaskStatus(task);
        
        rowDiv.innerHTML = `
            <div class="flex-none w-64 pr-4 pl-12 text-sm">${task.taskName}</div>
            <div class="relative flex-grow h-10 border-l border-gray-200">
                <div class="task-bar task-bar-due ${statusClass}"
                    style="left: ${startDay * 40}px; width: ${durationInDays * 40}px;"
                    title="Due: ${formatDate(dueDate)} to ${formatDate(endDate)}">
                    <div class="flex items-center gap-1">
                        <span>${task.taskName}</span>
                        <div class="ml-auto flex gap-2">
                            <button onclick="handleSetActualDate('${task.id}', 'Start')" class="text-white hover:text-gray-200" title="Set actual start date">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-3V2h-2v2h-4V2H8v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" /></svg>
                            </button>
                            <button onclick="handleSetActualDate('${task.id}', 'End')" class="text-white hover:text-gray-200" title="Set actual end date">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-3V2h-2v2h-4V2H8v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
                ${actualStartDate && actualEndDate ? `<div class="task-bar task-bar-actual ${statusClass}" style="left: ${actualStartDay * 40}px; width: ${actualDurationInDays * 40}px;" title="Actual: ${formatDate(actualStartDate)} to ${formatDate(actualEndDate)}"></div>` : ''}
            </div>
        `;
        return rowDiv;
    };
    
    const renderDateHeaders = (tasks) => {
        const allDates = tasks.flatMap(task => [new Date(task.dueDate), new Date(task.endDate)]);
        if (allDates.length === 0) return;
        
        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));
        const timelineStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
        const timelineEnd = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
        
        timelineStart.setDate(timelineStart.getDate() - 7);
        timelineEnd.setDate(timelineEnd.getDate() + 7);

        const totalDays = Math.ceil((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24));
        DOMElements.timelineDates.innerHTML = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 0; i <= totalDays; i++) {
            const currentDate = new Date(timelineStart);
            currentDate.setDate(timelineStart.getDate() + i);

            const cell = document.createElement('div');
            cell.className = "flex-none flex flex-col items-center p-1 min-w-[40px] border-l border-gray-200";

            const dayName = document.createElement('span');
            dayName.className = "text-xs text-gray-500";
            dayName.textContent = dayNames[currentDate.getDay()];
            
            const dateNumber = document.createElement('span');
            dateNumber.className = "font-semibold text-sm";
            dateNumber.textContent = currentDate.getDate();

            cell.appendChild(dayName);
            cell.appendChild(dateNumber);
            DOMElements.timelineDates.appendChild(cell);
        }

        const today = new Date();
        const todayDiff = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
        if (todayDiff >= 0 && todayDiff <= totalDays) {
            const todayMarker = document.createElement('div');
            todayMarker.className = "today-marker absolute h-full";
            todayMarker.style.left = `${256 + (todayDiff * 40)}px`;
            DOMElements.timelineDates.appendChild(todayMarker);
        }
    };
    
    const getTaskStatus = (task) => {
        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const actualStartDate = task.actualStartDate ? new Date(task.actualStartDate) : null;
        
        if (task.actualEndDate) return 'status-finished';
        
        if (actualStartDate) {
            const plannedDuration = new Date(task.endDate).getTime() - dueDate.getTime();
            const timeElapsed = now.getTime() - actualStartDate.getTime();
            if (timeElapsed < plannedDuration * (task.progress / 100)) return 'status-started-ahead';
            if (timeElapsed > plannedDuration * (task.progress / 100)) return 'status-started-behind';
            return 'status-started-on-program';
        } else {
            if (now > dueDate) return 'status-not-started-past-due';
            return 'status-not-started-not-due';
        }
    };
    
    // --- Modal Functions ---
    const closeAllModals = () => {
        DOMElements.addTaskModal.classList.add('hidden');
        DOMElements.addHierarchyModal.classList.add('hidden');
        DOMElements.addItemSelectionModal.classList.add('hidden');
        DOMElements.confirmModal.classList.add('hidden');
        DOMElements.settingsModal.classList.add('hidden');
        DOMElements.manageSitesModal.classList.add('hidden');
    };

    const showAddItemMenu = (parentId, parentType) => {
        state.modalTarget.parentId = parentId;
        state.modalTarget.parentType = parentType;
        closeAllModals();
        DOMElements.addItemSelectionModal.classList.remove('hidden');
    };

    const showAddHierarchyModal = (type) => {
        let title = `Enter a new ${type} name:`;
        if (type === 'site') title = `Enter a new site name:`;
        DOMElements.addHierarchyTitle.textContent = title;
        DOMElements.hierarchyNameInput.value = '';
        state.modalTarget.typeToAdd = type;
        DOMElements.addItemSelectionModal.classList.add('hidden');
        DOMElements.addHierarchyModal.classList.remove('hidden');
        DOMElements.hierarchyNameInput.focus();
    };

    const showAddTaskModal = () => {
        const { parentId, parentType } = state.modalTarget;
        DOMElements.addTaskForm.reset();
        
        DOMElements.taskDependencySelect.innerHTML = '<option value="">-- No Dependency --</option>';
        state.tasks.forEach(task => {
            if (task.siteId === state.selectedSiteId) {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.taskName;
                DOMElements.taskDependencySelect.appendChild(option);
            }
        });
        
        DOMElements.addItemSelectionModal.classList.add('hidden');
        DOMElements.addTaskModal.classList.remove('hidden');
    };

    const renderSitesToRemove = () => {
        DOMElements.siteListToRemove.innerHTML = '';
        state.sites.forEach(site => {
            const li = document.createElement('li');
            li.className = "flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors";
            li.innerHTML = `
                <span>${site.name}</span>
                <button data-site-id="${site.id}" class="remove-site-btn text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            `;
            DOMElements.siteListToRemove.appendChild(li);
        });
        
        document.querySelectorAll('.remove-site-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                state.siteToDeleteId = e.currentTarget.dataset.siteId;
                DOMElements.confirmModal.classList.remove('hidden');
            });
        });
    };
    
    // --- Event Handlers ---
    
    // Site selector change
    DOMElements.siteSelectHeader.addEventListener('change', (e) => {
        state.selectedSiteId = e.target.value;
        saveAndRender();
    });

    // Handle add new task form submission
    DOMElements.addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const { parentId, parentType } = state.modalTarget;
        
        const newTask = {
            id: Date.now().toString(),
            siteId: state.selectedSiteId,
            taskName: DOMElements.taskNameInput.value,
            dueDate: DOMElements.taskDueDateInput.value,
            endDate: DOMElements.taskEndDateInput.value,
            progress: 0,
            dependentOnTaskId: DOMElements.taskDependencySelect.value || null,
            phaseId: parentType === 'phase' ? parentId : null,
            sectionId: parentType === 'section' ? parentId : null,
            subsectionId: parentType === 'subsection' ? parentId : null,
        };
        state.tasks.push(newTask);
        
        showToast('Task added successfully!');
        closeAllModals();
        saveAndRender();
    });

    // Handle adding new hierarchy item (site, phase, etc.)
    DOMElements.okHierarchyBtn.addEventListener('click', () => {
        const name = DOMElements.hierarchyNameInput.value.trim();
        if (!name) return;
        
        const { typeToAdd, parentId } = state.modalTarget;
        const newItem = { id: Date.now().toString(), name };
        
        if (typeToAdd === 'site') {
            state.sites.push(newItem);
            state.selectedSiteId = newItem.id;
        } else if (typeToAdd === 'phase') {
            state.phases.push({ ...newItem, siteId: state.selectedSiteId });
        } else if (typeToAdd === 'section') {
            state.sections.push({ ...newItem, siteId: state.selectedSiteId, phaseId: parentId });
        } else if (typeToAdd === 'subsection') {
            state.subsections.push({ ...newItem, siteId: state.selectedSiteId, sectionId: parentId });
        }
        
        showToast(`${typeToAdd.charAt(0).toUpperCase() + typeToAdd.slice(1)} '${name}' added!`);
        closeAllModals();
        saveAndRender();
    });

    // Close buttons for modals
    DOMElements.cancelAddTaskBtn.addEventListener('click', closeAllModals);
    DOMElements.cancelHierarchyBtn.addEventListener('click', closeAllModals);
    DOMElements.cancelItemSelectionBtn.addEventListener('click', closeAllModals);
    DOMElements.closeSettingsBtn.addEventListener('click', closeAllModals);
    DOMElements.closeManageSitesBtn.addEventListener('click', closeAllModals);

    // Settings Modal handlers
    DOMElements.settingsBtn.addEventListener('click', () => {
        DOMElements.settingsModal.classList.remove('hidden');
    });

    DOMElements.manageSitesOption.addEventListener('click', () => {
        DOMElements.settingsModal.classList.add('hidden');
        renderSitesToRemove();
        DOMElements.manageSitesModal.classList.remove('hidden');
    });

    DOMElements.addNewSiteOption.addEventListener('click', () => {
        DOMElements.manageSitesModal.classList.add('hidden');
        state.modalTarget.typeToAdd = 'site';
        state.modalTarget.parentId = null;
        DOMElements.addHierarchyTitle.textContent = 'Enter a new site name:';
        DOMElements.hierarchyNameInput.value = '';
        DOMElements.addHierarchyModal.classList.remove('hidden');
        DOMElements.hierarchyNameInput.focus();
    });

    DOMElements.confirmOkBtn.addEventListener('click', () => {
        const siteId = state.siteToDeleteId;
        state.sites = state.sites.filter(s => s.id !== siteId);
        state.phases = state.phases.filter(p => p.siteId !== siteId);
        state.sections = state.sections.filter(s => s.siteId !== siteId);
        state.subsections = state.subsections.filter(ss => ss.siteId !== siteId);
        state.tasks = state.tasks.filter(t => t.siteId !== siteId);

        if (state.selectedSiteId === siteId) {
            state.selectedSiteId = state.sites.length > 0 ? state.sites[0].id : null;
        }

        showToast('Site and all associated data removed!', 'error');
        closeAllModals();
        saveAndRender();
    });

    DOMElements.confirmCancelBtn.addEventListener('click', closeAllModals);
    
    // Global functions for inline handlers
    window.showAddItemMenu = showAddItemMenu;
    window.showAddHierarchyModal = showAddHierarchyModal;
    window.showAddTaskModal = showAddTaskModal;
    
    window.handleSetActualDate = (taskId, type) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task[`actual${type}Date`] = new Date().toISOString();
            if (type === 'Start') {
                showToast('Task started!');
            } else if (type === 'End') {
                showToast('Task finished!');
            }
            saveAndRender();
        }
    };

    // --- Init ---
    const init = () => {
        loadState();
        if (state.sites.length > 0 && !state.selectedSiteId) {
            state.selectedSiteId = state.sites[0].id;
        }
        render();
    };
    
    init(); // Start the app
});
