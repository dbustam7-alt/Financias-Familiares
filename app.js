// Personal Finance Control - Core Logic
/**
 * Data Management (Mocking Local Storage for Demo)
 */
let transactions = [
    { id: 1, date: '2026-03-21', description: 'Nómina Marzo Laura', amount: 5000000, category: 'ingreso', payment: 'debito', owner: 'laura' },
    { id: 2, date: '2026-03-22', description: 'Arriendo', amount: 1500000, category: 'fijo', payment: 'debito', owner: 'familia' },
    { id: 3, date: '2026-03-22', description: 'Tinto Juan Valdez', amount: 5500, category: 'hormiga', payment: 'efectivo', owner: 'david' },
    { id: 4, date: '2026-03-22', description: 'Mercado Carulla', amount: 450000, category: 'variable', payment: 'tc_visa', owner: 'familia' },
    { id: 5, date: '2026-03-22', description: 'Uber al trabajo', amount: 12000, category: 'hormiga', payment: 'tc_falabella', owner: 'laura' }
];

let activeFilter = 'familia';

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
    bottomLinks: document.querySelectorAll('.bottom-nav a')
};

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
        const div = createTransactionItem(t);
        elements.ingresosList.appendChild(div);
    });

    // Fill Gastos
    elements.gastosList.innerHTML = '';
    filtered.filter(t => t.category !== 'ingreso').forEach(t => {
        const div = createTransactionItem(t);
        elements.gastosList.appendChild(div);
    });
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

function createTransactionItem(t) {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    div.innerHTML = `
        <div class="transaction-info">
            <h4>${t.description} <span class="badge-owner" style="font-size: 0.7rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${t.owner}</span></h4>
            <p>${t.date} • ${t.payment}</p>
        </div>
        <span class="amount ${t.category === 'ingreso' ? 'income' : 'expense'}">
            ${t.category === 'ingreso' ? '+' : '-'}${formatCurrency(t.amount)}
        </span>
    `;
    return div;
}

function renderTransactions() {
    elements.transactionList.innerHTML = '';
    const filtered = activeFilter === 'familia'
        ? transactions
        : transactions.filter(t => t.owner === activeFilter || t.owner === 'familia');

    [...filtered].reverse().slice(0, 5).forEach(t => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `
            <div class="transaction-info">
                <h4>${t.description}</h4>
                <p>${t.category.charAt(0).toUpperCase() + t.category.slice(1)} • ${t.payment}</p>
            </div>
            <span class="amount ${t.category === 'ingreso' ? 'income' : 'expense'}">
                ${t.category === 'ingreso' ? '+' : '-'}${formatCurrency(t.amount)}
            </span>
        `;
        elements.transactionList.appendChild(div);
    });
}

/**
 * Event Listeners
 */
elements.addBtn.addEventListener('click', () => {
    elements.modal.style.display = 'block';
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

elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTransaction = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        payment: document.getElementById('payment-method').value,
        owner: document.getElementById('owner').value
    };

    transactions.push(newTransaction);

    updateSummary();
    renderBudgets();
    renderTransactions();

    elements.modal.style.display = 'none';
    elements.form.reset();
});

// Initial Render
populateFormSelects();
updateSummary();
renderBudgets();
renderTransactions();
