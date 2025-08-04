// --- Wait for the DOM to be fully loaded ---
window.onload = () => {
    // --- DOM Elements ---
    const siteSelectHeader = document.getElementById('site-select-header');
    const mainHeader = document.getElementById('main-header');
    const settingsBtn = document.getElementById('settings-btn');
    const sitesBtn = document.getElementById('sites-btn');
    const taskListView = document.getElementById('timeline-content');
    const timelineDatesContainer = document.getElementById('timeline-dates');
    const noTasksMessage = document.getElementById('no-tasks-message');
    const addTaskModal = document.getElementById('add-task-modal');
    const addHierarchyModal = document.getElementById('add-hierarchy-modal');
    const addTaskForm = document.getElementById('add-task-form');
    const taskNameInput = document.getElementById('task-name');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskEndDateInput = document.getElementById('task-end-date');
    const taskDependencySelect = document.getElementById('task-dependency-select');
    const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
    const addHierarchyTitle = document.getElementById('add-hierarchy-title');
    const hierarchyNameInput = document.getElementById('hierarchy-name-input');
    const cancelHierarchyBtn = document.getElementById('cancel-hierarchy-btn');
    const okHierarchyBtn = document.getElementById('ok-hierarchy-btn');
    const addItemSelectionModal = document.getElementById('add-item-selection-modal');
    const selectPhaseBtn = document.getElementById('select-phase-btn');
    const selectSectionBtn = document.getElementById('select-section-btn');
    const selectSubsectionBtn = document.getElementById('select-subsection-btn');
    const selectTaskBtn = document.getElementById('select-task-btn');
    const cancelItemSelectionBtn = document.getElementById('cancel-item-selection-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const manageSitesOption = document.getElementById('manage-sites-option');
    const addNewSiteOption = document.getElementById('add-new-site-option');
    const manageSitesModal = document.getElementById('manage-sites-modal');
    const siteListToRemove = document.getElementById('site-list-to-remove');
    const closeManageSitesBtn = document.getElementById('close-manage-sites-btn');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    // --- Data Variables ---
    let sites = [];
    let tasks = [];
    let phases = [];
    let sections = [];
    let subsections = [];
    let selectedSiteId = '';
    let hierarchyTypeToAdd = '';
    let parentHierarchyId = '';
    let parentHierarchyType = '';
    let siteToDeleteId = '';
    
    // --- Helper Functions ---
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };
    const dateToYMD = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const generateColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    };

    const getTaskStatus = (task) => {
        const now = new Date();
        const dueDate = new Date(task.dueDate);
        const actualStartDate = task.actualStartDate ? new Date(task.actualStartDate) : null;

        if (actualStartDate) {
            if (task.actualEndDate) {
                return 'status-finished';
            }
            const expectedDuration = now.getTime() - dueDate.getTime();
            const actualDuration = now.getTime() - actualStartDate.getTime();
            if (actualDuration < expectedDuration) {
                return 'status-started-ahead';
            } else if (actualDuration > expectedDuration) {
                return 'status-started-behind';
            } else {
                return 'status-started-on-program';
            }
        } else {
            if (now > dueDate) {
                return 'status-not-started-past-due';
            } else {
                return 'status-not-started-not-due';
            }
        }
    };

    const saveToLocalStorage = () => {
        localStorage.setItem('sites', JSON.stringify(sites));
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('phases', JSON.stringify(phases));
        localStorage.setItem('sections', JSON.stringify(sections));
        localStorage.setItem('subsections', JSON.stringify(subsections));
    };

    const loadFromLocalStorage = () => {
        sites = JSON.parse(localStorage.getItem('sites')) || [];
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        phases = JSON.parse(localStorage.getItem('phases')) || [];
        sections = JSON.parse(localStorage.getItem('sections')) || [];
        subsections = JSON.parse(localStorage.getItem('subsections')) || [];
    };

    const renderSites = () => {
        siteSelectHeader.innerHTML = '';
        if (sites.length === 0) {
            siteSelectHeader.innerHTML = '<option value="">No sites available</option>';
            selectedSiteId = '';
            mainHeader.textContent = 'Construction Progress Tracker';
        } else {
            sites.forEach(site => {
                const option = document.createElement('option');
                option.value = site.id;
                option.textContent = site.name;
                siteSelectHeader.appendChild(option);
            });
            if (!selectedSiteId || !sites.find(site => site.id === selectedSiteId)) {
                selectedSiteId = sites[0].id;
            }
            siteSelectHeader.value = selectedSiteId;
            const selectedSite = sites.find(s => s.id === selectedSiteId);
            mainHeader.textContent = selectedSite ? selectedSite.name : 'Construction Progress Tracker';
        }
        renderTasks();
    };

    const renderTasks = () => {
        taskListView.innerHTML = '';
        timelineDatesContainer.innerHTML = '';
        const filteredTasks = tasks.filter(task => task.siteId === selectedSiteId);
        
        if (filteredTasks.length === 0 && selectedSiteId) {
            noTasksMessage.classList.remove('hidden');
        } else {
            noTasksMessage.classList.add('hidden');

            const allDates = filteredTasks.flatMap(task => [new Date(task.dueDate), new Date(task.endDate)]);
            if (allDates.length === 0) return;
            
            const minDate = new Date(Math.min(...allDates));
            const maxDate = new Date(Math.max(...allDates));
            const timelineStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
            const timelineEnd = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
            
            // Add padding to the timeline
            timelineStart.setDate(timelineStart.getDate() - 7);
            timelineEnd.setDate(timelineEnd.getDate() + 7);

            const totalDays = Math.ceil((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24));

            // Render timeline header
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
                timelineDatesContainer.appendChild(cell);
            }

            // Add today marker
            const today = new Date();
            const todayDiff = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
            if (todayDiff >= 0 && todayDiff <= totalDays) {
                const todayMarker = document.createElement('div');
                todayMarker.className = "today-marker absolute h-full";
                todayMarker.style.left = `${256 + (todayDiff * 40)}px`;
                timelineDatesContainer.appendChild(todayMarker);
            }

            const groupedTasks = filteredTasks.reduce((acc, task) => {
                const phase = task.phase || 'Unphased';
                const section = task.section || 'Unsectioned';
                const subSection = task.subSection || 'Unsubsectioned';
            
                if (!acc[phase]) acc[phase] = { sections: {} };
                if (!acc[phase].sections[section]) acc[phase].sections[section] = { subsections: {} };
                if (!acc[phase].sections[section].subsections[subSection]) acc[phase].sections[section].subsections[subSection] = [];
            
                acc[phase].sections[section].subsections[subSection].push(task);
                return acc;
            }, {});

            const selectedSite = sites.find(s => s.id === selectedSiteId);
            if (selectedSite) {
                const siteDiv = createCollapsibleDiv(selectedSite.name, 'site', 0, selectedSiteId);
                const siteContent = siteDiv.querySelector('.collapsible-content');
                taskListView.appendChild(siteDiv);

                Object.keys(groupedTasks).forEach(phaseName => {
                    const phaseDiv = createCollapsibleDiv(phaseName, 'phase', 1, phaseName);
                    const phaseContent = phaseDiv.querySelector('.collapsible-content');
                    siteContent.appendChild(phaseDiv);

                    Object.keys(groupedTasks[phaseName].sections).forEach(sectionName => {
                        const sectionDiv = createCollapsibleDiv(sectionName, 'section', 2, sectionName);
                        const sectionContent = sectionDiv.querySelector('.collapsible-content');
                        phaseContent.appendChild(sectionDiv);

                        Object.keys(groupedTasks[phaseName].sections[sectionName].subsections).forEach(subSectionName => {
                            const subSectionDiv = createCollapsibleDiv(subSectionName, 'sub-section', 3, subSectionName);
                            const subSectionContent = subSectionDiv.querySelector('.collapsible-content');
                            sectionContent.appendChild(subSectionDiv);

                            groupedTasks[phaseName].sections[sectionName].subsections[subSectionName].forEach(task => {
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
                                
                                const rowDiv = document.createElement('div');
                                rowDiv.className = "flex items-center border-t border-gray-200 py-2 hover:bg-gray-50 transition-colors duration-200";
                                rowDiv.innerHTML = `
                                    <div class="flex-none w-64 pr-4 pl-12 text-sm">${task.taskName}</div>
                                    <div class="relative flex-grow h-10 border-l border-gray-200">
                                        <div 
                                            class="task-bar task-bar-due ${statusClass}"
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
                                            ${actualStartDate && actualEndDate ? `<div class="task-bar task-bar-actual ${statusClass}" style="left: ${actualStartDay * 40}px; width: ${actualDurationInDays * 40}px;" title="Actual: ${formatDate(actualStartDate)} to ${formatDate(actualEndDate)}"></div>` : ''}
                                        </div>
                                    `;
                                subSectionContent.appendChild(rowDiv);
                                });
                            });
                        });
                    });
                }
            }
        };

        const createCollapsibleDiv = (name, type, level, id) => {
            const div = document.createElement('div');
            const color = generateColor(id);
            const padding = (level * 2) + 1;
            
            const header = document.createElement('div');
            header.className = `collapsible-header flex-none w-64 pr-4 pl-6 py-2 border-r border-gray-200 hover:bg-gray-100 transition-colors duration-200`;
            
            header.innerHTML = `
                <div class="hierarchy-item-container flex items-center justify-between">
                    <div class="flex items-center" style="padding-left: ${padding}rem;">
                        <svg class="w-4 h-4 mr-1 transform rotate-0 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                        <span class="font-bold text-sm text-gray-700" style="color: ${color};">${name}</span>
                    </div>
                    <div class="add-icon-group flex gap-1">
                        ${level < 3 ? `
                            <button onclick="showAddItemMenu('${id}', '${type}')" class="text-gray-500 hover:text-green-600 transition-colors" title="Add new ${type === 'site' ? 'phase' : (type === 'phase' ? 'section' : 'sub-section')}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                            </button>
                        ` : ''}
                        <button onclick="showAddItemMenu('${id}', '${type}')" class="text-gray-500 hover:text-blue-600 transition-colors" title="Add new task">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </button>
                    </div>
                </div>
            `;
            
            const content = document.createElement('div');
            content.className = `collapsible-content`;

            header.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) {
                    return;
                }
                const icon = header.querySelector('svg');
                content.classList.toggle('expanded');
                icon.classList.toggle('rotate-180');
            });

            const timelineRow = document.createElement('div');
            timelineRow.className = `flex flex-col border-b border-gray-200`;
            timelineRow.appendChild(header);
            timelineRow.appendChild(content);

            return timelineRow;
        };

        const showAddItemMenu = (parentId, parentType) => {
            window.parentHierarchyId = parentId;
            window.parentHierarchyType = parentType;
            addItemSelectionModal.classList.remove('hidden');
        };

        const showAddHierarchyModal = (type) => {
            let title = `Enter a new ${type} name:`;
            if (type === 'site') title = `Enter a new site name:`;
            addHierarchyTitle.textContent = title;
            hierarchyNameInput.value = '';
            window.hierarchyTypeToAdd = type;
            addItemSelectionModal.classList.add('hidden');
            addHierarchyModal.classList.remove('hidden');
            hierarchyNameInput.focus();
        };

        const showAddTaskModal = () => {
            const parentId = window.parentHierarchyId;
            const parentType = window.parentHierarchyType;
            addTaskForm.reset();
            
            let phase = '';
            let section = '';
            let subSection = '';
            if (parentType === 'phase') {
                phase = parentId;
            } else if (parentType === 'section') {
                section = parentId;
                const parentTask = tasks.find(t => t.section === parentId);
                if (parentTask) phase = parentTask.phase;
            } else if (parentType === 'sub-section') {
                subSection = parentId;
                const parentTask = tasks.find(t => t.subSection === parentId);
                if (parentTask) {
                    section = parentTask.section;
                    phase = parentTask.phase;
                }
            } else if (parentType === 'site') {
                // No pre-filling needed for top-level tasks
            }
            window.taskToCreateHierarchy = { phase, section, subSection };

            taskDependencySelect.innerHTML = '<option value="">-- No Dependency --</option>';
            tasks.forEach(task => {
                if (task.siteId === selectedSiteId) {
                    const option = document.createElement('option');
                    option.value = task.id;
                    option.textContent = task.taskName;
                    taskDependencySelect.appendChild(option);
                }
            });

            addItemSelectionModal.classList.add('hidden');
            addTaskModal.classList.remove('hidden');
        };


        // --- Event Handlers ---
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
        });

        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });

        manageSitesOption.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            renderSitesToRemove();
            manageSitesModal.classList.remove('hidden');
        });
        
        addNewSiteOption.addEventListener('click', () => {
            manageSitesModal.classList.add('hidden');
            addHierarchyTitle.textContent = "Enter a new site name:";
            hierarchyNameInput.value = '';
            hierarchyTypeToAdd = 'site';
            addHierarchyModal.classList.remove('hidden');
            hierarchyNameInput.focus();
        });

        closeManageSitesBtn.addEventListener('click', () => {
            manageSitesModal.classList.add('hidden');
            renderSites();
        });

        const renderSitesToRemove = () => {
            siteListToRemove.innerHTML = '';
            sites.forEach(site => {
                const li = document.createElement('li');
                li.className = "flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors";
                li.innerHTML = `
                    <span>${site.name}</span>
                    <button data-site-id="${site.id}" class="remove-site-btn text-red-500 hover:text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                `;
                siteListToRemove.appendChild(li);
            });
            document.querySelectorAll('.remove-site-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    siteToDeleteId = e.currentTarget.dataset.siteId;
                    confirmModal.classList.remove('hidden');
                });
            });
        };

        confirmOkBtn.addEventListener('click', () => {
            sites = sites.filter(s => s.id !== siteToDeleteId);
            tasks = tasks.filter(t => t.siteId !== siteToDeleteId);
            saveToLocalStorage();
            renderSitesToRemove();
            confirmModal.classList.add('hidden');
        });

        confirmCancelBtn.addEventListener('click', () => {
            confirmModal.classList.add('hidden');
        });


        cancelHierarchyBtn.addEventListener('click', () => {
            addHierarchyModal.classList.add('hidden');
        });

        okHierarchyBtn.addEventListener('click', () => {
            const name = hierarchyNameInput.value.trim();
            if (name) {
                if (hierarchyTypeToAdd === 'site') {
                    const newSiteId = Date.now().toString();
                    sites.push({ id: newSiteId, name });
                    selectedSiteId = newSiteId;
                } else if (hierarchyTypeToAdd === 'phase') {
                    if (!phases.includes(name)) phases.push(name);
                    tasks.push({
                        id: Date.now().toString(),
                        siteId: selectedSiteId,
                        taskName: name,
                        phase: name,
                        section: null,
                        subSection: null,
                        dueDate: null,
                        endDate: null,
                        actualStartDate: null,
                        actualEndDate: null,
                        dependentOnTaskId: null
                    });
                } else if (hierarchyTypeToAdd === 'section') {
                    if (!sections.includes(name)) sections.push(name);
                     tasks.push({
                        id: Date.now().toString(),
                        siteId: selectedSiteId,
                        taskName: name,
                        phase: window.parentHierarchyId,
                        section: name,
                        subSection: null,
                        dueDate: null,
                        endDate: null,
                        actualStartDate: null,
                        actualEndDate: null,
                        dependentOnTaskId: null
                    });
                } else if (hierarchyTypeToAdd === 'subsection') {
                    if (!subsections.includes(name)) subsections.push(name);
                    tasks.push({
                        id: Date.now().toString(),
                        siteId: selectedSiteId,
                        taskName: name,
                        phase: tasks.find(t => t.section === window.parentHierarchyId).phase,
                        section: window.parentHierarchyId,
                        subSection: name,
                        dueDate: null,
                        endDate: null,
                        actualStartDate: null,
                        actualEndDate: null,
                        dependentOnTaskId: null
                    });
                }
                saveToLocalStorage();
                renderSites();
                addHierarchyModal.classList.add('hidden');
            }
        });

        siteSelectHeader.addEventListener('change', (e) => {
            selectedSiteId = e.target.value;
            renderTasks();
        });
        
        sitesBtn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-icon-btn').forEach(btn => btn.classList.remove('active'));
            sitesBtn.classList.add('active');
            renderTasks();
        });

        window.handleAddNewHierarchyItem = (parentId, parentType) => {
            showAddItemMenu(parentId, parentType);
        };

        window.handleAddTaskFromHierarchy = (parentId, parentType) => {
            showAddItemMenu(parentId, parentType);
        };
        
        // --- Add Item Selection Modal Handlers ---
        selectPhaseBtn.addEventListener('click', () => { showAddHierarchyModal('phase'); });
        selectSectionBtn.addEventListener('click', () => { showAddHierarchyModal('section'); });
        selectSubsectionBtn.addEventListener('click', () => { showAddHierarchyModal('subsection'); });
        selectTaskBtn.addEventListener('click', () => { showAddTaskModal(); });
        cancelItemSelectionBtn.addEventListener('click', () => { addItemSelectionModal.classList.add('hidden'); });

        cancelAddTaskBtn.addEventListener('click', () => {
            addTaskModal.classList.add('hidden');
        });

        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const dependentTask = tasks.find(t => t.id === taskDependencySelect.value);
            let newDueDate = taskDueDateInput.value;
            if (dependentTask) {
                const dependentEndDate = new Date(dependentTask.endDate);
                const oneDay = 24 * 60 * 60 * 1000;
                dependentEndDate.setTime(dependentEndDate.getTime() + oneDay);
                newDueDate = dateToYMD(dependentEndDate);
            }
            
            let phase = '';
            let section = '';
            let subSection = '';

            if (window.parentHierarchyType === 'phase') {
                phase = window.parentHierarchyId;
            } else if (window.parentHierarchyType === 'section') {
                section = window.parentHierarchyId;
                const parentTask = tasks.find(t => t.section === window.parentHierarchyId);
                if (parentTask) phase = parentTask.phase;
            } else if (window.parentHierarchyType === 'sub-section') {
                subSection = window.parentHierarchyId;
                const parentTask = tasks.find(t => t.subSection === window.parentHierarchyId);
                if (parentTask) {
                    section = parentTask.section;
                    phase = parentTask.phase;
                }
            } else if (window.parentHierarchyType === 'site') {
                // No pre-filling needed for top-level tasks
            }
            
            const newTask = {
                id: Date.now().toString(),
                siteId: selectedSiteId,
                taskName: taskNameInput.value,
                phase: window.taskToCreateHierarchy.phase,
                section: window.taskToCreateHierarchy.section,
                subSection: window.taskToCreateHierarchy.subSection,
                dueDate: newDueDate,
                endDate: taskEndDateInput.value,
                actualStartDate: null,
                actualEndDate: null,
                dependentOnTaskId: taskDependencySelect.value
            };
            tasks.push(newTask);
            
            saveToLocalStorage();
            renderTasks();
            addTaskModal.classList.add('hidden');
        });
        
        window.handleSetActualDate = (taskId, type) => {
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex][`actual${type}Date`] = new Date().toISOString();
                saveToLocalStorage();
                renderTasks();
            }
        };

        // --- Initial Load ---
        window.onload = () => {
            loadFromLocalStorage();
            renderSites();
        };
    };
