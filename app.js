/**
 * Configuración Inicial de Supabase
 */
const SUPABASE_URL = 'https://fvugphfurbdtpoldnfhs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GJmq_usXU18pNLBvesw3DQ_JHLwh0Xp'; 
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Variables de Estado
let transactions = [];
let activeFilter = 'familia';
let editingId = null;

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

/**
 * LÓGICA DE AUTENTICACIÓN
 */

window.login = async function() {
    console.log("Iniciando login...");
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) console.error('Error al entrar:', error.message);
};

window.logout = async function() {
    await supabaseClient.auth.signOut();
    window.location.reload();
};

// Monitor de Sesión
supabaseClient.auth.onAuthStateChange((event, session) => {
    const authOverlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');

    if (session) {
        authOverlay.style.display = 'none';
        mainApp.style.display = 'flex';
        initApp(); // Cargar datos solo si hay usuario
    } else {
        authOverlay.style.display = 'flex';
        mainApp.style.display = 'none';
    }
});

/**
 * INICIALIZACIÓN DE LA APLICACIÓN
 */

function initApp() {
    updateSummary();
    renderBudgets();
    loadData();
    attachEventListeners();
    if (window.lucide) lucide.createIcons();
}

async function loadData() {
    const { data, error } = await supabaseClient
        .from('transacciones')
        .select('*')
        .order('fecha', { ascending: false });

    if (!error && data) {
        transactions = data.map(t => ({
            id: t.id,
            date: t.fecha,
            description: t.descripcion,
            amount: parseFloat(t.monto),
            category: t.tipo_manual || 'variable',
            payment: t.metodo_pago,
            owner: t.owner_manual || 'familia'
        }));
        updateSummary();
        renderTransactions();
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(amount);
}

function updateSummary() {
    const filtered = activeFilter === 'familia' 
        ? transactions 
        : transactions.filter(t => t.owner === activeFilter);

    const income = filtered.filter(t => t.category === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter(t => t.category !== 'ingreso').reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expenses').textContent = formatCurrency(expenses);
    document.getElementById('available-balance').textContent = formatCurrency(income - expenses);
}

function renderBudgets() {
    const budgetList = document.getElementById('budget-visualization');
    if (!budgetList) return;
    budgetList.innerHTML = '';
    
    budgets[activeFilter].forEach(b => {
        const spent = transactions
            .filter(t => t.owner === activeFilter && t.category === b.category)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const percent = Math.min((spent / b.limit) * 100, 100);
        
        const div = document.createElement('div');
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.9rem;">
                <span>${b.name}</span>
                <span>${formatCurrency(spent)} / ${formatCurrency(b.limit)}</span>
            </div>
            <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; margin-bottom:15px;">
                <div style="width:${percent}%; height:100%; background:#2563eb; border-radius:4px;"></div>
            </div>
        `;
        budgetList.appendChild(div);
    });
}

function renderTransactions() {
    const list = document.getElementById('recent-transactions');
    if (!list) return;
    list.innerHTML = '';
    
    const filtered = activeFilter === 'familia' 
        ? transactions 
        : transactions.filter(t => t.owner === activeFilter);

    filtered.slice(0, 5).forEach(t => {
        const item = document.createElement('div');
        item.style.cssText = "display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f5f9;";
        item.innerHTML = `
            <div>
                <p style="margin:0; font-weight:500;">${t.description}</p>
                <small style="color:#64748b;">${t.date}</small>
            </div>
            <span style="font-weight:600; color:${t.category === 'ingreso' ? '#16a34a' : '#1e293b'}">
                ${t.category === 'ingreso' ? '+' : '-'}${formatCurrency(t.amount)}
            </span>
        `;
        list.appendChild(item);
    });
}

function attachEventListeners() {
    // Botones de filtro (David, Laura, Familia)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            updateSummary();
            renderBudgets();
            renderTransactions();
        };
    });

    // Abrir Modal
    const addBtn = document.getElementById('quick-add-btn');
    if (addBtn) {
        addBtn.onclick = () => document.getElementById('quick-add-modal').style.display = 'block';
    }

    // Cerrar Modal
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => document.getElementById('quick-add-modal').style.display = 'none';
    }
}
