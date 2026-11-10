/* ==================== ESTADO DO FEIRANTE ==================== */
let isStallOpen = true;
let unreadNotificationsCount = 0;
let nextOrderTimeout = null;

let stallTodayEarnings = 0.00;
let stallTodayOrdersCount = 0;

let stallProfileData = {
    name: 'Tenda do Zé das Frutas',
    fair: 'Feira Agroecológica do Canteiro',
    phone: '(54) 99999-1111'
};

/* LISTA DE PRODUTOS DA TENDA (PREÇOS BASEADOS NO KG) */
let stallProducts = [
    { id: 1, name: 'Maçã Gala Orgânica', price: 9.50, available: true },
    { id: 2, name: 'Banana Prata', price: 7.90, available: true },
    { id: 3, name: 'Morango Orgânico', price: 18.00, available: true },
    { id: 4, name: 'Laranja Pera', price: 5.50, available: false }
];

/* POOL DE PEDIDOS SIMULADOS PARA O LOOP DA TENDA */
const stallOrdersPool = [
    {
        id: '#9801',
        clientName: 'Ana Silva',
        motoboyName: 'Carlos Silva',
        status: 'Em Separação',
        items: [
            { id: 'item_1', name: 'Maçã Gala Orgânica (1 kg)', qty: '1 kg', price: 9.50, checked: false },
            { id: 'item_2', name: 'Banana Prata (1.5 kg)', qty: '1.5 kg', price: 11.85, checked: false }
        ]
    },
    {
        id: '#9802',
        clientName: 'Roberto Souza',
        motoboyName: 'Lucas Ferreira',
        status: 'Em Separação',
        items: [
            { id: 'item_3', name: 'Morango Orgânico (2 kg)', qty: '2 kg', price: 36.00, checked: false }
        ]
    },
    {
        id: '#9803',
        clientName: 'Mariana Costa',
        motoboyName: 'Gabriel Santos',
        status: 'Em Separação',
        items: [
            { id: 'item_4', name: 'Banana Prata (2 kg)', qty: '2 kg', price: 15.80, checked: false },
            { id: 'item_5', name: 'Maçã Gala Orgânica (1.5 kg)', qty: '1.5 kg', price: 14.25, checked: false }
        ]
    }
];

/* PEDIDOS RECEBIDOS ATUALMENTE */
let pendingOrders = [];

/* HISTÓRICO DE VENDAS CONCLUÍDAS */
let completedOrders = [
    {
        id: '#9780',
        date: 'Ontem às 10:15',
        clientName: 'Marcos Souza',
        total: 21.50,
        itemsCount: 2
    }
];

let stallNotifications = [];

/* ==================== INICIALIZAÇÃO DA NAVEGAÇÃO ==================== */
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetScreenId = item.getAttribute('data-target');
            if (!targetScreenId) return;

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            screens.forEach(screen => {
                screen.id === targetScreenId ? screen.classList.add('active') : screen.classList.remove('active');
            });
        });
    });

    renderPendingOrdersUI();
    renderProductsUI();
    renderCompletedOrdersUI();
    updateSummaryUI();
    updateNotificationBadge();

    // INICIA O LOOP PARA CHEGAR O PRIMEIRA PEDIDO
    scheduleNextOrderSimulation(3000);
});

/* ==================== LOOP DE PEDIDOS SIMULADOS ==================== */
function scheduleNextOrderSimulation(delayMs = 6000) {
    if (!isStallOpen || pendingOrders.length > 0) return;

    if (nextOrderTimeout) clearTimeout(nextOrderTimeout);

    nextOrderTimeout = setTimeout(() => {
        if (isStallOpen && pendingOrders.length === 0) {
            triggerNewStallOrder();
        }
    }, delayMs);
}

function triggerNewStallOrder() {
    const randomIndex = Math.floor(Math.random() * stallOrdersPool.length);
    const newOrderData = JSON.parse(JSON.stringify(stallOrdersPool[randomIndex]));

    // GERA UM ID ÚNICO
    newOrderData.id = `#98${Math.floor(10 + Math.random() * 90)}`;
    pendingOrders.push(newOrderData);

    const notifyMsg = `Novo pedido ${newOrderData.id} de ${newOrderData.clientName}!`;
    showToast(notifyMsg);

    stallNotifications.unshift({
        id: Date.now(),
        title: 'Novo Pedido Recebido!',
        time: 'Agora',
        desc: notifyMsg,
        icon: 'fa-shopping-basket',
        color: '#2e7d32'
    });

    unreadNotificationsCount += 1;
    updateNotificationBadge();
    renderPendingOrdersUI();
}

/* ==================== STATUS ABERTO/FECHADO & RESUMO ==================== */
function toggleStallStatus(toggleElement) {
    isStallOpen = toggleElement.checked;
    const card = document.getElementById('stall-status-card');
    const dot = document.getElementById('stall-status-dot');
    const title = document.getElementById('stall-status-title');
    const desc = document.getElementById('stall-status-desc');

    if (isStallOpen) {
        card.classList.add('online');
        dot.classList.add('active');
        title.textContent = 'Tenda Aberta';
        desc.textContent = 'Recebendo novos pedidos dos clientes na feira.';
        showToast("Tenda ABERTA para pedidos!");
        scheduleNextOrderSimulation(3000);
    } else {
        card.classList.remove('online');
        dot.classList.remove('active');
        title.textContent = 'Tenda Fechada';
        desc.textContent = 'Novos pedidos pausados temporariamente.';
        if (nextOrderTimeout) clearTimeout(nextOrderTimeout);
        showToast("Tenda FECHADA.");
    }
}

function updateSummaryUI() {
    const earningsEl = document.getElementById('stall-today-earnings');
    const ordersEl = document.getElementById('stall-today-orders');

    if (earningsEl) earningsEl.textContent = `R$ ${stallTodayEarnings.toFixed(2).replace('.', ',')}`;
    if (ordersEl) ordersEl.textContent = stallTodayOrdersCount;
}

/* ==================== GESTÃO DE PEDIDOS RECEBIDOS COM CHECKBOX ==================== */
function renderPendingOrdersUI() {
    const container = document.getElementById('pending-orders-container');
    if (!container) return;

    if (pendingOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-list" style="padding: 40px 0;">
                <i class="fas fa-spinner fa-spin" style="color: #2e7d32;"></i>
                <p>Aguardando novos pedidos...</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pendingOrders.map((order, orderIndex) => {
        const orderTotal = order.items.reduce((sum, i) => sum + i.price, 0);

        const allItemsChecked = order.items.every(item => item.checked);

        const disabledAttr = allItemsChecked 
            ? '' 
            : 'disabled style="opacity: 0.5; cursor: not-allowed; background-color: #757575;"';

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <span class="order-id">${order.id}</span>
                        <div class="order-date">Cliente: <strong>${order.clientName}</strong></div>
                    </div>
                    <span class="order-status-badge badge-prep"><i class="fas fa-spinner fa-spin"></i> ${order.status}</span>
                </div>

                <div class="order-items-preview" style="background: #f9f9f9; padding: 10px 12px; border-radius: 10px; margin: 10px 0;">
                    <strong style="font-size: 12px; color: #2e7d32; display: block; margin-bottom: 8px;">
                        <i class="fas fa-tasks"></i> Separar Itens do Pedido:
                    </strong>
                    
                    ${order.items.map((item, itemIndex) => `
                        <label style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; margin-bottom: 6px; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" ${item.checked ? 'checked' : ''} 
                                       onchange="toggleStallItemCheck(${orderIndex}, ${itemIndex}, this.checked)"
                                       style="accent-color: #2e7d32; width: 16px; height: 16px; cursor: pointer;">
                                <span style="${item.checked ? 'text-decoration: line-through; color: #888;' : ''}">${item.name}</span>
                            </div>
                            <strong style="font-size: 12px; color: #2e7d32;">R$ ${item.price.toFixed(2).replace('.', ',')}</strong>
                        </label>
                    `).join('')}
                </div>

                <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
                    <i class="fas fa-motorcycle" style="color: #2e7d32;"></i> Entregador: <strong>${order.motoboyName}</strong>
                </p>

                <div class="order-card-footer" style="flex-direction: column; gap: 10px; align-items: stretch;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px; color: #666;">Valor da Tenda:</span>
                        <span class="order-total-price">R$ ${orderTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button class="btn-checkout" ${disabledAttr} onclick="markOrderAsReady(${orderIndex})">
                        <i class="fas fa-check"></i> Notificar Motoboy que o Pedido está Pronto
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleStallItemCheck(orderIndex, itemIndex, isChecked) {
    if (!pendingOrders[orderIndex]) return;
    pendingOrders[orderIndex].items[itemIndex].checked = isChecked;
    renderPendingOrdersUI();
}

function markOrderAsReady(index) {
    const finishedOrder = pendingOrders[index];
    if (!finishedOrder) return;

    const total = finishedOrder.items.reduce((sum, i) => sum + i.price, 0);
    
    stallTodayEarnings += total;
    stallTodayOrdersCount += 1;
    updateSummaryUI();

    completedOrders.unshift({
        id: finishedOrder.id,
        date: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clientName: finishedOrder.clientName,
        total: total,
        itemsCount: finishedOrder.items.length
    });

    pendingOrders.splice(index, 1);

    showToast(`Pedido ${finishedOrder.id} separado! Notificação enviada ao motoboy.`);
    renderPendingOrdersUI();
    renderCompletedOrdersUI();

    // DISPARA O PRÓXIMO PEDIDO APÓS SEPARAR O ATUAL
    if (isStallOpen) {
        scheduleNextOrderSimulation(6000);
    }
}

/* ==================== GESTÃO DE PRODUTOS & EDIÇÃO ==================== */
function renderProductsUI() {
    const container = document.getElementById('products-list-container');
    if (!container) return;

    if (stallProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-list" style="padding: 40px 0;">
                <i class="fas fa-boxes"></i>
                <p>Nenhum produto cadastrado.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = stallProducts.map(prod => `
        <div class="order-card" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px;">
            <div>
                <strong style="font-size: 14px; color: #222; display: block;">${prod.name}</strong>
                <span style="font-size: 14px; font-weight: 700; color: #2e7d32;">R$ ${prod.price.toFixed(2).replace('.', ',')} <small style="font-size: 11px; font-weight: 400; color: #666;">/ kg</small></span>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="openEditProductModal(${prod.id})" style="background: #f0f0f0; border: none; width: 32px; height: 32px; border-radius: 50%; color: #2e7d32; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px;">
                    <i class="fas fa-edit"></i>
                </button>

                <label class="switch-toggle" style="transform: scale(0.85);">
                    <input type="checkbox" ${prod.available ? 'checked' : ''} onchange="toggleProductAvailability(${prod.id}, this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
    `).join('');
}

function toggleProductAvailability(id, available) {
    const prod = stallProducts.find(p => p.id === id);
    if (prod) {
        prod.available = available;
        showToast(`${prod.name} marcado como ${available ? 'Disponível' : 'Esgotado'}.`);
        renderProductsUI();
    }
}

function openAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('hidden');
}

function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.add('hidden');
}

function submitNewProduct(event) {
    event.preventDefault();
    const name = document.getElementById('prod-name-input').value;
    const price = parseFloat(document.getElementById('prod-price-input').value);

    if (name && price) {
        stallProducts.unshift({
            id: Date.now(),
            name: name,
            price: price,
            available: true
        });

        document.getElementById('add-product-form').reset();
        closeAddProductModal();
        showToast("Produto cadastrado com sucesso!");
        renderProductsUI();
    }
}

function openEditProductModal(id) {
    const prod = stallProducts.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('edit-prod-name-input').value = prod.name;
    document.getElementById('edit-prod-price-input').value = prod.price;

    document.getElementById('edit-product-modal').classList.remove('hidden');
}

function closeEditProductModal() {
    document.getElementById('edit-product-modal').classList.add('hidden');
}

function submitEditProduct(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('edit-prod-id').value);
    const name = document.getElementById('edit-prod-name-input').value;
    const price = parseFloat(document.getElementById('edit-prod-price-input').value);

    const prod = stallProducts.find(p => p.id === id);
    if (prod && name && price) {
        prod.name = name;
        prod.price = price;

        closeEditProductModal();
        showToast("Produto alterado com sucesso!");
        renderProductsUI();
    }
}

/* ==================== HISTÓRICO DE VENDAS ==================== */
function renderCompletedOrdersUI() {
    const container = document.getElementById('completed-orders-container');
    if (!container) return;

    if (completedOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-list" style="padding: 40px 0;">
                <i class="fas fa-history"></i>
                <p>Nenhuma venda registrada.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = completedOrders.map(item => `
        <div class="order-card">
            <div class="order-card-header">
                <div>
                    <span class="order-id">${item.id}</span>
                    <div class="order-date">${item.date} • ${item.clientName}</div>
                </div>
                <span class="order-status-badge badge-done"><i class="fas fa-check-circle"></i> Separado</span>
            </div>

            <div class="order-card-footer">
                <span style="font-size: 12px; color: #666;">${item.itemsCount} item(ns)</span>
                <span class="order-total-price">R$ ${item.total.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
    `).join('');
}

/* ==================== FUNÇÕES DE PERFIL E NOTIFICAÇÕES ==================== */
function openProfileScreen() {
    document.getElementById('stall-name-input').value = stallProfileData.name;
    document.getElementById('stall-fair-input').value = stallProfileData.fair;
    document.getElementById('stall-phone-input').value = stallProfileData.phone;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('profile-screen').classList.add('active');
}

function closeProfileScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('orders-screen').classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.bottom-nav [data-target="orders-screen"]').classList.add('active');
}

function saveStallProfile(event) {
    event.preventDefault();
    stallProfileData.name = document.getElementById('stall-name-input').value;
    stallProfileData.fair = document.getElementById('stall-fair-input').value;
    stallProfileData.phone = document.getElementById('stall-phone-input').value;

    document.getElementById('header-user-name').textContent = stallProfileData.name;
    document.getElementById('profile-display-name').textContent = stallProfileData.name;
    document.getElementById('profile-display-email').textContent = stallProfileData.fair;

    showToast("Perfil da tenda atualizado!");
}

function toggleNotificationsModal() {
    const modal = document.getElementById('notifications-modal');
    if (modal.classList.contains('hidden')) {
        renderNotificationsUI();
        modal.classList.remove('hidden');
        unreadNotificationsCount = 0;
        updateNotificationBadge();
    } else {
        modal.classList.add('hidden');
    }
}

function closeNotificationsModalOnOutside(e) {
    if (e.target.id === 'notifications-modal') {
        document.getElementById('notifications-modal').classList.add('hidden');
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadNotificationsCount <= 0) {
            badge.classList.add('hidden');
        } else {
            badge.textContent = unreadNotificationsCount;
            badge.classList.remove('hidden');
        }
    }
}

function renderNotificationsUI() {
    const container = document.getElementById('notifications-list');
    if (stallNotifications.length === 0) {
        container.innerHTML = `
            <div class="empty-list" style="padding: 30px 0;">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhuma notificação no momento.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = stallNotifications.map(n => `
        <div class="notification-item">
            <div class="notification-icon" style="background-color: ${n.color}15; color: ${n.color};">
                <i class="fas ${n.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header-row">
                    <strong>${n.title}</strong>
                    <span class="notification-time">${n.time}</span>
                </div>
                <p>${n.desc}</p>
            </div>
        </div>
    `).join('');
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');

    if (toast && toastMsg) {
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}