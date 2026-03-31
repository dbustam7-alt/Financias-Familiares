// Personal Finance Control - Core Logic
const SUPABASE_URL = 'https://fvugphfurbdtpoldnfhs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GJmq_usXU18pNLBvesw3DQ_JHLwh0Xp';
const supabase = window.supabase ?
    window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

console.log('Supabase initialized:', !!supabase);

/**
 * Data Management (Sync with Supabase)
 */
let transactions = [];

let activeFilter = 'familia';
let editingId = null;

const cardBudgets = [
    { id: 'visa', name: 'TC Visa', limit: 2000000 },
    { id: 'falabella', name: 'TC Falabella', limit: 1500000 }
];

const budgets = {
    familia: [
        { id: 1, category: 'fijo', limit: 2500000, name: 'Gastos Fijos Hogar' },
        { id: 2, category: 'variable', limit: 1000000, name: 'Gastos Variables Hogar' },
        { id: 3, category: 'hormiga', limit: 200000, name: 'Gastos Hormiga Hogar' }
    ],
    laura: [
        { id: 4, category: 'fijo', limit: 800000, name: 'Gastos Fijos Laura' },
        { id: 5, category: 'variable', limit: 500000, name: 'Gastos Variables Laura' },
        { id: 6, category: 'hormiga', limit: 100000, name: 'Gastos Hormiga Laura' }
    ],
    david: [
        { id: 7, category: 'fijo', limit: 1200000, name: 'Gastos Fijos David' },
        { id: 8, category: 'variable', limit: 600000, name: 'Gastos Variables David' },
        { id: 9, category: 'hormiga', limit: 150000, name: 'Gastos Hormiga David' }
    ]
};

let configuration = {
    categories: [
        { id: 'fijo', name: 'Fijo' },
        { id: 'variable', name: 'Variable' },
        { id: 'hormiga', name: 'Hormiga' },
        { id: 'ingreso', name: 'Ingreso' }
    ],
    paymentMethods: [
        { id: 'efectivo', name: 'Efectivo' },
        { id: 'debito', name: 'Débito' },
        { id: 'tc_visa', name: 'TC Visa' },
        { id: 'tc_falabella', name: 'TC Falabella' }
    ],
    owners: [
        { id: 'familia', name: 'Familia' },
        { id: 'laura', name: 'Laura' },
        { id: 'david', name: 'David' }
    ]
};

/**
 * UI Selectors
 */
const elements = {
    totalIncome: document.getElementById('total-income'),
    totalExpenses: document.getElementById('total-expenses'),
    availableBalance: document.getElementById('available-balance'),
    hormigaTotal: document.getElementById('hormiga-total'),
    hormigaStatus: document.getElementById('hormiga-status'),
    budgetList: document.getElementById('budget-visualization'),
    transactionList: document.getElementById('recent-transactions'),
    ingresosList: document.getElementById('ingresos-full-list'),
    gastosList: document.getElementById('gastos-full-list'),
    cardsList: document.getElementById('cards-visualization'),
    sidebarLinks: document.querySelectorAll('#sidebar-nav a'),
    views: document.querySelectorAll('.view'),
    profileSelector: document.getElementById('profile-selector'),
    profileButtons: document.querySelectorAll('.filter-btn'),
    modal: document.getElementById('quick-add-modal'),
    addBtn: document.getElementById('quick-add-btn'),
    closeBtn: document.querySelector('.close-modal'),
    dateInput: document.getElementById('date'),
    modalTitle: document.getElementById('modal-title'),
    editingIdInput: document.getElementById('editing-id'),
    form: document.getElementById('transaction-form'),
    // Settings elements
    settingsBudgets: document.getElementById('settings-budgets-list'),
    settingsCategories: document.getElementById('settings-categories-list'),
    settingsPayments: document.getElementById('settings-pago-list'),
    settingsOwners: document.getElementById('settings-owner-list'),
    addBudgetForm: document.getElementById('add-budget-form'),
    addCatForm: document.getElementById('add-category-form'),
    addPayForm: document.getElementById('add-payment-form'),
    addOwnerForm: document.getElementById('add-owner-form'),
    bottomLinks: document.querySelectorAll('.bottom-nav a'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete'),
    confirmCancelBtn: document.getElementById('confirm-cancel')
};

/**
 * Supabase Data Integration
 */
async function loadData() {
    if (!supabase) return;
    const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error loading data:', error);
        return;
    }

    // Map DB fields back to App fields if necessary
    // Schema: id, descripcion, monto, fecha, metodo_pago, categoria_id, usuario_id (owner)
    transactions = data.map(t => ({
        id: t.id,
        date: t.fecha,
        description: t.descripcion,
        amount: parseFloat(t.monto),
        category: t.tipo_manual || 'variable', // Handle mapping if needed
        payment: t.metodo_pago,
        owner: t.owner_manual || 'familia' // Handle mapping
    }));

    updateSummary();
    renderTransactions();
    renderBudgets();
    renderFullLists();
}

/**
 * Core Functions
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(amount);
}

function updateSummary() {
    const filtered = activeFilter === 'familia'
        ? transactions
        : transactions.filter(t => t.owner === activeFilter || t.owner === 'familia');

    const income = filtered
        .filter(t => t.category === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filtered
        .filter(t => t.category !== 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);

    const hormiga = filtered
        .filter(t => t.category === 'hormiga')
        .reduce((sum, t) => sum + t.amount, 0);

    elements.totalIncome.textContent = formatCurrency(income);
    elements.totalExpenses.textContent = formatCurrency(expenses);
    elements.availableBalance.textContent = formatCurrency(income - expenses);
    elements.hormigaTotal.textContent = formatCurrency(hormiga);

    // Update Hormiga Status
    const profileBudgets = budgets[activeFilter];
    const hormigaBudget = profileBudgets.find(b => b.category === 'hormiga').limit;
    if (hormiga > hormigaBudget) {
        elements.hormigaStatus.textContent = "Alerta: Límite excedido";
        elements.hormigaStatus.style.background = "#fee2e2";
        elements.hormigaStatus.style.color = "#991b1b";
    } else {
        elements.hormigaStatus.textContent = "Bajo control";
        elements.hormigaStatus.style.background = "#dcfce7";
        elements.hormigaStatus.style.color = "#16a34a";
    }
}

function renderBudgets() {
    elements.budgetList.innerHTML = '';
    const filtered = activeFilter === 'familia'
        ? transactions
        : transactions.filter(t => t.owner === activeFilter || t.owner === 'familia');

    const profileBudgets = budgets[activeFilter];

    profileBudgets.forEach(b => {
        const actual = filtered
            .filter(t => t.category === b.category)
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = Math.min((actual / b.limit) * 100, 100);

        const div = document.createElement('div');
        div.className = 'budget-item-container';
        div.innerHTML = `
            <div class="budget-item">
                <span>${b.name}</span>
                <span>${formatCurrency(actual)} / ${formatCurrency(b.limit)}</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
        `;
        elements.budgetList.appendChild(div);
    });
}

function renderTarjetas() {
    elements.cardsList.innerHTML = '';
    const filtered = activeFilter === 'familia'
        ? transactions
        : transactions.filter(t => t.owner === activeFilter || t.owner === 'familia');

    cardBudgets.forEach(card => {
        const spent = filtered
            .filter(t => t.payment === `tc_${card.id}`)
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = Math.min((spent / card.limit) * 100, 100);

        const div = document.createElement('div');
        div.className = 'card-item';
        div.innerHTML = `
            <h3>${card.name}</h3>
            <p class="subtitle">Cupo utilizado este mes</p>
            <div class="card-data" style="margin-top: 10px;">
                <h2>${formatCurrency(spent)}</h2>
                <span class="label">Límite: ${formatCurrency(card.limit)}</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${percentage}%; background: ${percentage > 80 ? 'var(--danger)' : 'var(--primary)'}"></div>
            </div>
        `;
        elements.cardsList.appendChild(div);
    });
}

function renderFullLists() {
    const filtered = activeFilter === 'familia'
        ? transactions
        : transactions.filter(t => t.owner === activeFilter || t.owner === 'familia');

    // Fill Ingresos
    elements.ingresosList.innerHTML = '';
    filtered.filter(t => t.category === 'ingreso').forEach(t => {
        elements.ingresosList.appendChild(createTransactionItem(t, true));
    });

    // Fill Gastos
    elements.gastosList.innerHTML = '';
    filtered.filter(t => t.category !== 'ingreso').forEach(t => {
        elements.gastosList.appendChild(createTransactionItem(t, true));
    });

    if (window.lucide) lucide.createIcons();
}

let transactionToDelete = null;

function deleteTransaction(id) {
    transactionToDelete = id;
    elements.confirmModal.style.display = 'block';
    if (window.lucide) lucide.createIcons();
}

// Confirm Modal Actions
elements.confirmDeleteBtn.addEventListener('click', async () => {
    if (transactionToDelete) {
        if (supabase) {
            const { error } = await supabase
                .from('transacciones')
                .delete()
                .eq('id', transactionToDelete);

            if (error) {
                console.error('Error deleting:', error);
                alert('No se pudo eliminar de la nube. Intenta de nuevo.');
                return;
            }
        }

        transactions = transactions.filter(t => t.id !== transactionToDelete);
        updateSummary();
        renderTransactions();
        renderBudgets();
        renderFullLists();
        elements.confirmModal.style.display = 'none';
        elements.modal.style.display = 'none';
        transactionToDelete = null;
    }
});

elements.confirmCancelBtn.addEventListener('click', () => {
    elements.confirmModal.style.display = 'none';
    transactionToDelete = null;
});

function openEditModal(id) {
    const t = transactions.find(trans => trans.id === id);
    if (!t) return;

    editingId = id;
    elements.modalTitle.textContent = 'Editar Registro';
    elements.editingIdInput.value = id;

    // Fill form
    elements.dateInput.value = t.date;
    document.getElementById('amount').value = t.amount;
    document.getElementById('description').value = t.description;
    document.getElementById('category').value = t.category;
    document.getElementById('payment-method').value = t.payment;
    document.getElementById('owner').value = t.owner;

    // Toggle button UI to match category
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === (t.category === 'ingreso' ? 'income' : 'expense')) {
            btn.classList.add('active');
        }
    });

    elements.modal.style.display = 'block';
}

function renderSettings() {
    // Render Budgets
    elements.settingsBudgets.innerHTML = '';
    Object.keys(budgets).forEach(owner => {
        budgets[owner].forEach(b => {
            const div = document.createElement('div');
            div.className = 'settings-item';
            div.innerHTML = `
                <span><strong>${owner.toUpperCase()}</strong>: ${b.name} (${formatCurrency(b.limit)})</span>
                <button class="btn-delete" onclick="deleteBudget('${owner}', ${b.id})"><i data-lucide="trash-2"></i></button>
            `;
            elements.settingsBudgets.appendChild(div);
        });
    });

    // Render Categories
    elements.settingsCategories.innerHTML = '';
    configuration.categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'settings-item';
        div.innerHTML = `
            <span>${cat.name}</span>
            <button class="btn-delete" onclick="deleteCategory('${cat.id}')"><i data-lucide="trash-2"></i></button>
        `;
        elements.settingsCategories.appendChild(div);
    });

    // Render Payments
    elements.settingsPayments.innerHTML = '';
    configuration.paymentMethods.forEach(p => {
        const div = document.createElement('div');
        div.className = 'settings-item';
        div.innerHTML = `
            <span>${p.name}</span>
            <button class="btn-delete" onclick="deletePayment('${p.id}')"><i data-lucide="trash-2"></i></button>
        `;
        elements.settingsPayments.appendChild(div);
    });

    // Render Owners
    elements.settingsOwners.innerHTML = '';
    configuration.owners.forEach(o => {
        const div = document.createElement('div');
        div.className = 'settings-item';
        div.innerHTML = `
            <span>${o.name}</span>
            <button class="btn-delete" onclick="deleteOwner('${o.id}')"><i data-lucide="trash-2"></i></button>
        `;
        elements.settingsOwners.appendChild(div);
    });

    lucide.createIcons();
}

window.deleteBudget = (owner, id) => {
    budgets[owner] = budgets[owner].filter(b => b.id !== id);
    renderSettings();
    renderBudgets();
    updateSummary();
};

window.deleteCategory = (id) => {
    configuration.categories = configuration.categories.filter(c => c.id !== id);
    renderSettings();
    populateFormSelects();
};

window.deletePayment = (id) => {
    configuration.paymentMethods = configuration.paymentMethods.filter(p => p.id !== id);
    renderSettings();
    populateFormSelects();
};

window.deleteOwner = (id) => {
    configuration.owners = configuration.owners.filter(o => o.id !== id);
    // Also remove from filter buttons and budgets
    delete budgets[id];
    delete budgets[`${id}_presupuesto`]; // If any
    updateHeaderFilters();
    renderSettings();
    populateFormSelects();
};

function updateHeaderFilters() {
    const container = document.getElementById('profile-selector');
    container.innerHTML = configuration.owners.map(o => `
        <button class="filter-btn ${activeFilter === o.id ? 'active' : ''}" data-filter="${o.id}">${o.name}</button>
    `).join('');

    // Re-attach listeners
    elements.profileButtons = document.querySelectorAll('.filter-btn');
    elements.profileButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.profileButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            updateSummary();
            renderBudgets();
            renderTransactions();
            renderTarjetas();
            renderFullLists();
        });
    });
}

function populateFormSelects() {
    const catSelect = document.getElementById('category');
    const paySelect = document.getElementById('payment-method');
    const ownerSelect = document.getElementById('owner');

    catSelect.innerHTML = configuration.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    paySelect.innerHTML = configuration.paymentMethods.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    ownerSelect.innerHTML = configuration.owners.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
}

function createTransactionItem(t, isWide = false) {
    const div = document.createElement('div');
    div.className = `transaction-item ${isWide ? 'wide-item' : ''}`;

    if (isWide) {
        div.innerHTML = `
            <span class="date">${t.date}</span>
            <span class="desc" style="font-weight: 500;">${t.description}</span>
            <span class="badge" style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${t.category}</span>
            <span class="payment" style="color: var(--text-muted); font-size: 0.85rem;">${t.payment}</span>
            <span class="owner"><span class="badge-owner" style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${t.owner}</span></span>
            <span class="amount ${t.category === 'ingreso' ? 'income' : t.category === 'hormiga' ? 'hormiga' : 'expense'}" style="text-align: right; font-weight: 600;">
                ${t.category === 'ingreso' ? '+' : '-'}${formatCurrency(t.amount)}
            </span>
            <div class="actions">
                <button class="btn-action edit" data-id="${t.id}" data-action="edit"><i data-lucide="edit-2"></i></button>
                <button class="btn-action delete" data-id="${t.id}" data-action="delete"><i data-lucide="trash-2"></i></button>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="transaction-info">
                <h4>${t.description} <span class="badge-owner" style="font-size: 0.7rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${t.owner}</span></h4>
                <p>${t.date} • ${t.payment}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="amount ${t.category === 'ingreso' ? 'income' : 'expense'}" style="font-weight: 600;">
                    ${t.category === 'ingreso' ? '+' : '-'}${formatCurrency(t.amount)}
                </span>
            </div>
        `;
    }
    return div;
}

function renderTransactions() {
    elements.transactionList.innerHTML = '';
    const filtered = activeFilter === 'familia'
        ? transactions
        : transactions.filter(t => t.owner === activeFilter || t.owner === 'familia');

    [...filtered].reverse().slice(0, 5).forEach(t => {
        elements.transactionList.appendChild(createTransactionItem(t, false));
    });

    if (window.lucide) lucide.createIcons();
}

/**
 * Event Listeners
 */
elements.addBtn.addEventListener('click', () => {
    editingId = null;
    elements.modalTitle.textContent = 'Nuevo Registro';
    elements.editingIdInput.value = '';
    elements.form.reset();
    elements.modal.style.display = 'block';
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    elements.dateInput.value = today;
});

elements.closeBtn.addEventListener('click', () => {
    elements.modal.style.display = 'none';
});

window.onclick = (event) => {
    if (event.target == elements.modal) elements.modal.style.display = 'none';
};

// Unified Navigation Logic
const navLinks = [...elements.sidebarLinks, ...elements.bottomLinks];

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.dataset.view;

        // Update link UI (both sidebar and bottom nav)
        navLinks.forEach(l => {
            if (l.dataset.view === targetView) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });

        // Switch views
        elements.views.forEach(view => {
            view.classList.remove('active');
            if (view.id === `view-${targetView}`) {
                view.classList.add('active');
            }
        });

        // Specific view renders
        if (targetView === 'tarjetas') renderTarjetas();
        if (targetView === 'ingresos' || targetView === 'gastos') renderFullLists();
        if (targetView === 'configuraciones') renderSettings();
    });
});

// Settings Handlers
elements.addBudgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const owner = document.getElementById('new-budget-owner').value;
    const catId = document.getElementById('new-budget-cat').value;
    const limit = parseFloat(document.getElementById('new-budget-limit').value);
    const catName = configuration.categories.find(c => c.id === catId).name;

    budgets[owner].push({
        id: Date.now(),
        category: catId,
        limit: limit,
        name: `Gastos ${catName} ${owner.charAt(0).toUpperCase() + owner.slice(1)}`
    });

    renderSettings();
    renderBudgets();
    updateSummary();
    elements.addBudgetForm.reset();
});

elements.addCatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('new-cat-id').value;
    const name = document.getElementById('new-cat-name').value;
    configuration.categories.push({ id, name });
    renderSettings();
    populateFormSelects();
    elements.addCatForm.reset();
});

elements.addPayForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('new-pay-id').value;
    const name = document.getElementById('new-pay-name').value;
    configuration.paymentMethods.push({ id, name });
    renderSettings();
    populateFormSelects();
    elements.addPayForm.reset();
});

elements.addOwnerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('new-owner-id').value;
    const name = document.getElementById('new-owner-name').value;
    configuration.owners.push({ id, name });
    if (!budgets[id]) budgets[id] = [];
    updateHeaderFilters();
    renderSettings();
    populateFormSelects();
    elements.addOwnerForm.reset();
});

// Profile Filter Switcher
elements.profileButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.profileButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;

        // Refresh currently active view
        updateSummary();
        renderBudgets();
        renderTransactions();
        renderTarjetas();
        renderFullLists();
    });
});

// Toggle Gasto/Ingreso buttons
const typeButtons = document.querySelectorAll('.type-btn');
typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const type = btn.dataset.type;
        const categorySelect = document.getElementById('category');

        if (type === 'income') {
            categorySelect.value = 'ingreso';
        } else {
            categorySelect.value = 'fijo'; // Default to fixed expense
        }
    });
});

elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        fecha: elements.dateInput.value,
        descripcion: document.getElementById('description').value,
        monto: parseFloat(document.getElementById('amount').value),
        tipo_manual: document.getElementById('category').value,
        metodo_pago: document.getElementById('payment-method').value,
        owner_manual: document.getElementById('owner').value
    };

    if (supabase) {
        if (editingId) {
            const { error } = await supabase
                .from('transacciones')
                .update(data)
                .eq('id', editingId);

            if (error) {
                console.error('Error updating:', error);
                alert('No se pudo guardar en la nube.');
                return;
            }
        } else {
            const { error } = await supabase
                .from('transacciones')
                .insert([data]);

            if (error) {
                console.error('Error inserting:', error);
                alert('No se pudo guardar en la nube. Verifica si creaste las tablas.');
                return;
            }
        }
        await loadData();
    } else {
        // Fallback local
        if (editingId) {
            const index = transactions.findIndex(t => t.id === editingId);
            if (index !== -1) transactions[index] = { ...transactions[index], ...data };
        } else {
            transactions.push({ id: Date.now(), ...data });
        }
        updateSummary();
        renderBudgets();
        renderTransactions();
        renderFullLists();
    }

    elements.modal.style.display = 'none';
    elements.form.reset();
    editingId = null;
});

// Event Delegation for Transactions
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-action');
    if (!btn) return;

    const id = btn.dataset.id; // Keep as string for UUID
    const action = btn.dataset.action;

    if (action === 'delete') deleteTransaction(id);
    if (action === 'edit') openEditModal(id);
});

// Initial Render
populateFormSelects();
loadData(); // This now handles initial render from Supabase
