/**
 * Configuración Inicial
 */
const SUPABASE_URL = 'https://fvugphfurbdtpoldnfhs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GJmq_usXU18pNLBvesw3DQ_JHLwh0Xp'; // Asegúrate de que sea la Anon Public Key
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Variables de Estado
let transactions = [];
let activeFilter = 'familia';
let editingId = null;
let currentUser = null;

// Configuración de Presupuestos y Categorías (Mantenemos tu lógica actual)
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

const configuration = {
    categories: [
        { id: 'fijo', name: 'Fijo' }, { id: 'variable', name: 'Variable' },
        { id: 'hormiga', name: 'Hormiga' }, { id: 'ingreso', name: 'Ingreso' }
    ],
    paymentMethods: [
        { id: 'efectivo', name: 'Efectivo' }, { id: 'debito', name: 'Débito' },
        { id: 'tc_visa', name: 'TC Visa' }, { id: 'tc_falabella', name: 'TC Falabella' }
    ],
    owners: [
        { id: 'familia', name: 'Familia' }, { id: 'laura', name: 'Laura' }, { id: 'david', name: 'David' }
    ]
};

/**
 * LÓGICA DE AUTENTICACIÓN (NUEVA)
 */

async function login() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) console.error('Error Login:', error.message);
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// Escuchador de Cambios de Sesión
supabaseClient.auth.onAuthStateChange((event, session) => {
    const authOverlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');

    if (session) {
        currentUser = session.user;
        authOverlay.style.display = 'none';
        mainApp.style.display = 'flex';
        initApp(); // Cargar la app solo si hay usuario
    } else {
        authOverlay.style.display = 'flex';
        mainApp.style.display = 'none';
    }
});

/**
 * INICIALIZACIÓN Y CARGA DE DATOS
 */

function initApp() {
    try {
        initializeElements();
        populateFormSelects();
        updateHeaderFilters();
        attachEventListeners();
        loadData();
        console.log('App v1.0.6 Lista para el usuario:', currentUser.email);
    } catch (err) {
        console.error('Error inicialización:', err);
    }
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
        renderInitialUI();
    }
}

// ... (Mantenemos tus funciones de renderInitialUI, updateSummary, formatCurrency, etc. sin cambios) ...

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(amount);
}

function updateSummary() {
    const filtered = activeFilter === 'familia' 
        ? transactions 
        : transactions.filter(t => t.owner === activeFilter || t.owner === 'familia');

    const income = filtered.filter(t => t.category === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter(t => t.category !== 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const hormiga = filtered.filter(t => t.category === 'hormiga').reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expenses').textContent = formatCurrency(expenses);
    document.getElementById('available-balance').textContent = formatCurrency(income - expenses);
    document.getElementById('hormiga-total').textContent = formatCurrency(hormiga);
}

// ... (El resto de tus funciones de renderizado se mantienen igual a tu v1.0.4) ...

function renderInitialUI() {
    updateSummary();
    renderTransactions();
    renderBudgets();
    // Renderizado de iconos si usas Lucide
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Eventos del Formulario y CRUD
 */
function attachEventListeners() {
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            fecha: document.getElementById('date').value,
            descripcion: document.getElementById('description').value,
            monto: parseFloat(document.getElementById('amount').value),
            tipo_manual: document.getElementById('category').value,
            metodo_pago: document.getElementById('payment-method').value,
            owner_manual: document.getElementById('owner').value,
            user_id: currentUser.id // Guardamos quién creó el registro
        };

        if (editingId) {
            await supabaseClient.from('transacciones').update(formData).eq('id', editingId);
        } else {
            await supabaseClient.from('transacciones').insert([formData]);
        }
        
        editingId = null;
        form.reset();
        document.getElementById('quick-add-modal').style.display = 'none';
        loadData();
    });

    // Filtros de Perfil
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            updateSummary();
            renderBudgets();
            renderTransactions();
        });
    });

    // Botón de Abrir Modal
    document.getElementById('quick-add-btn').addEventListener('click', () => {
        document.getElementById('quick-add-modal').style.display = 'block';
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    });
}

// Iniciar cargador de iconos inicial si existe
if (window.lucide) window.lucide.createIcons();
