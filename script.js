// --- Wait for the DOM to be fully loaded ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    // (A more organized way to get all elements)
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
        // ... (add other elements here)
    };

    // --- State Variables (The single source of truth) ---
    let state = {
        sites: [],
        phases: [],
        sections: [],
        subsections: [],
        tasks: [],
        selectedSiteId: null,
        // For modals
        modalTarget: {
            parentId: null,
            parentType: null,
            typeToAdd: null,
        }
    };

    // --- Helper Functions ---
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
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
            DOMElements.siteSelectHeader.innerHTML = '<option>Create a site to begin</option>';
            DOMElements.mainHeader.textContent = 'Construction Tracker';
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
        const { phases, sections, subsections, tasks, selectedSiteId } = state;

        if (!selectedSiteId) {
            DOMElements.emptyStateMessage.classList.remove('hidden');
            DOMElements.emptyStateMessage.innerHTML = `<p>Please select or create a site to view its timeline.</p>`;
            return;
        }

        const sitePhases = phases.filter(p => p.siteId === selectedSiteId);

        if (sitePhases.length === 0 && tasks.filter(t => t.siteId === selectedSiteId).length === 0) {
            DOMElements.emptyStateMessage.classList.remove('hidden');
            DOMElements.emptyStateMessage.innerHTML = `<p>This site has no phases or tasks. Add a phase to get started.</p>`;
             // Add button to add first item here...
            return;
        }
        
        DOMElements.emptyStateMessage.classList.add('hidden');

        // Render hierarchy: Phases -> Sections -> Subsections -> Tasks
        sitePhases.forEach(phase => {
            const phaseDiv = createCollapsibleDiv(phase, 'phase', 1);
            DOMElements.timelineContent.appendChild(phaseDiv);
            const phaseContent = phaseDiv.querySelector('.collapsible-content');

            const phaseSections = sections.filter(s => s.phaseId === phase.id);
            phaseSections.forEach(section => {
                const sectionDiv = createCollapsibleDiv(section, 'section', 2);
                phaseContent.appendChild(sectionDiv);
                const sectionContent = sectionDiv.querySelector('.collapsible-content');

                const sectionSubsections = subsections.filter(ss => ss.sectionId === section.id);
                sectionSubsections.forEach(subsection => {
                    const subsectionDiv = createCollapsibleDiv(subsection, 'subsection', 3);
                    sectionContent.appendChild(subsectionDiv);
                    const subsectionContent = subsectionDiv.querySelector('.collapsible-content');

                    const subsectionTasks = tasks.filter(t => t.subsectionId === subsection.id);
                    subsectionTasks.forEach(task => {
                        const taskRow = createTaskRow(task); // Separate function for task rows
                        subsectionContent.appendChild(taskRow);
                    });
                });
            });
        });
        // Important: render date headers based on visible tasks
        renderDateHeaders();
    };

    const createCollapsibleDiv = (item, type, level) => {
        // This is the function that creates the hierarchy rows.
        // It's similar to your original but is built to accept the new data objects.
        // It should create the header, the collapsible content div, and the add buttons.
        // ... (This function's implementation will be very similar to your `createCollapsibleDiv`)
        // Remember to attach event listeners for the add buttons within this function.
        // e.g., button.onclick = () => openHierarchyModal(item.id, type);
        const div = document.createElement('div');
        // A simplified placeholder for brevity
        div.innerHTML = `<div class="p-2" style="padding-left: ${level * 2}rem;"><b>${item.name} (${type})</b> <button class="add-btn text-blue-500 ml-4" data-id="${item.id}" data-type="${type}">[+]</button></div><div class="collapsible-content pl-8"></div>`;
        return div;
    };

    const createTaskRow = (task) => {
        // This function creates the HTML for a single task row and its Gantt bars.
        // ... (Implementation would be similar to the task row creation in your original `renderTasks`)
        const div = document.createElement('div');
        div.className = "p-2 border-t border-gray-100";
        div.innerHTML = `<span>${task.taskName} (Due: ${formatDate(task.dueDate)})</span>`;
        return div;
    };
    
    const renderDateHeaders = () => {
        // Logic to calculate min/max dates and render the timeline header
        // ... (This can be adapted from your original `renderTasks` function)
    };


    // --- Event Handlers ---
    
    // Handler for all [+] buttons
    DOMElements.timelineContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-btn')) {
            const parentId = e.target.dataset.id;
            const parentType = e.target.dataset.type;
            
            // Logic to open a menu to choose what to add:
            // e.g., if parentType is 'phase', show options for 'Add Section' or 'Add Task'
            console.log(`Add button clicked for parent ${parentId} of type ${parentType}`);
            // This would then call a modal function
        }
    });

    //FIXED: Logic for the hierarchy modal OK button
    const handleAddHierarchy = () => {
        const name = hierarchyNameInput.value.trim();
        if (!name) return;
        
        const { typeToAdd, parentId } = state.modalTarget;
        const newItem = { id: Date.now().toString(), name };

        if (typeToAdd === 'site') state.sites.push(newItem);
        if (typeToAdd === 'phase') state.phases.push({ ...newItem, siteId: state.selectedSiteId });
        if (typeToAdd === 'section') state.sections.push({ ...newItem, phaseId: parentId });
        if (typeToAdd === 'subsection') state.subsections.push({ ...newItem, sectionId: parentId });
        
        showToast(`${typeToAdd.charAt(0).toUpperCase() + typeToAdd.slice(1)} '${name}' added!`);
        closeAllModals();
        saveAndRender();
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
