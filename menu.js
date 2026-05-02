import { db } from './firebase.js';
import { collection, onSnapshot, doc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== CARRITO =====
let cart = [];
let deliveryMode = "Delivery";
let paymentMode = "Efectivo";
let currentComboItem = null;

// ===== FECHA =====
function mostrarFecha() {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const hoy = new Date();
  document.getElementById("menuFecha").textContent =
    `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
}

// ===== CARGAR MENÚ DESDE FIREBASE =====
function cargarMenu() {
  ["platos", "postres", "crudos"].forEach(cat => {
    // Mostrar skeleton
    const grid = document.getElementById("grid-" + cat);
    if (!grid) return;
    grid.innerHTML = `
      <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
      <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
      <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
    `;

    onSnapshot(collection(db, cat), snap => {
      grid.innerHTML = "";

      snap.forEach(docSnap => {
        const item = { id: docSnap.id, ...docSnap.data() };
        if (!item.activo) return;

        const div = document.createElement("div");
        div.className = "menu-item";
        div.innerHTML = `
      ${item.imagen
            ? `<img src="${item.imagen}" alt="${item.name}" class="menu-item-img" onerror="this.style.display='none'">`
            : `<div class="menu-item-img-placeholder">${item.emoji}</div>`
          }
          <div class="menu-item-body">
            <div>
              <div class="menu-item-name">${item.name}</div>
              <div class="menu-item-desc">${item.desc}</div>
            </div>
            <div class="menu-item-right">
              <span class="menu-price">${item.price > 0 ? "$" + item.price : "Incl."}</span>
              ${item.price > 0
            ? `<button class="add-btn" data-name="${item.name}" data-price="${item.price}" data-emoji="${item.emoji}">+ Agregar</button>`
            : `<span class="incl-tag">🎁 Incluido</span>`
          }
            </div>
          </div>
        `;
        grid.appendChild(div);
      });

      // Eventos botones
      grid.querySelectorAll(".add-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const item = {
            name: btn.dataset.name,
            price: parseInt(btn.dataset.price),
            emoji: btn.dataset.emoji
          };
          const platosSimples = ["Pan con Minutas", "Yuca con Chicharrones", "Paella"];
          const esPlatoSimple = platosSimples.includes(item.name);
          const esDePlatos = cat === "platos";

          if (esDePlatos && !esPlatoSimple) {
            openCombo(item);
          } else {
            addToCart(item);
            btn.textContent = "✓ Listo";
            btn.style.background = "#f5c800";
            btn.style.color = "#140600";
            setTimeout(() => {
              btn.textContent = "+ Agregar";
              btn.style.background = "";
              btn.style.color = "";
            }, 1200);
          }
        });
      });
    });
  });
}

// ===== CARGAR DESTACADO =====
function cargarDestacado() {
  onSnapshot(collection(db, "platos"), snap => {
    const destacados = [];
    snap.forEach(docSnap => {
      const item = docSnap.data();
      if (item.destacado && item.activo) destacados.push(item);
    });

    const wrap = document.getElementById("destacadoWrap");
    const card = document.getElementById("destacadoCard");

    if (destacados.length > 0) {
      wrap.style.display = "block";
      card.innerHTML = destacados.map(item => `
        <div class="destacado-item">
          <span class="destacado-badge">⭐ Recomendado</span>
          ${item.icono
          ? `<img src="img/${item.icono}" alt="${item.name}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0">`
          : `<span class="destacado-emoji">${item.emoji}</span>`
        }
          <div class="destacado-info">
            <div class="destacado-name">${item.name}</div>
            <div class="destacado-desc">${item.desc}</div>
          </div>
          <span class="destacado-price">$${item.price}</span>
        </div>
      `).join("");
    } else {
      wrap.style.display = "none";
    }
  });
}

// ===== CARRITO =====
function addToCart(item) {
  const existing = cart.find(c => c.name === item.name && c.desc === item.desc);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartBar();
}

function updateCartBar() {
  const bar = document.getElementById("cart-bar");
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = "$" + total;
  if (count > 0) bar.classList.add("visible");
  else bar.classList.remove("visible");
}

function openCart() {
  document.getElementById("cartModal").classList.add("open");
  document.body.style.overflow = "hidden";
  renderCartItems();
}

function renderCartItems() {
  const list = document.getElementById("cart-items-list");
  const checkout = document.getElementById("cart-checkout");

  if (cart.length === 0) {
    list.innerHTML = "<div class='cart-empty'>🍽️ Tu carrito está vacío.<br>¡Elegí algo del menú!</div>";
    checkout.style.display = "none";
    return;
  }

  list.innerHTML = `
    <div class="cart-clear-row">
      <button class="cart-add-more-btn" id="add-more-btn">+ Agregar más</button>
      <button class="cart-clear-btn" id="clear-cart-btn">🗑️ Vaciar</button>
    </div>
  ` + cart.map((item, i) => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${item.emoji} ${item.name}</div>
        ${item.desc ? `<div class="cart-item-desc">${item.desc}</div>` : ""}
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-idx="${i}" data-delta="-1">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" data-idx="${i}" data-delta="1">+</button>
        <span class="cart-item-price">$${item.price * item.qty}</span>
        <button class="remove-btn" data-idx="${i}">✕</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      const delta = parseInt(btn.dataset.delta);
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      updateCartBar();
      renderCartItems();
    });
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      cart.splice(parseInt(btn.dataset.idx), 1);
      updateCartBar();
      renderCartItems();
    });
  });

  const clearBtn = document.getElementById("clear-cart-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      cart = [];
      updateCartBar();
      renderCartItems();
    });
  }

  const addMoreBtn = document.getElementById("add-more-btn");
  if (addMoreBtn) {
    addMoreBtn.addEventListener("click", () => {
      closeCart();
    });
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById("modal-total").textContent = "$" + total;
  checkout.style.display = "block";
}

function closeCart() {
  document.getElementById("cartModal").classList.remove("open");
  document.body.style.overflow = "";
}

// ===== ENVIAR PEDIDO =====
async function sendOrder() {
  if (cart.length === 0) return;
  const notes = document.getElementById("order-notes").value;
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  let msg = "🇨🇺 *Pedido — Son D'licias*\n\n";
  cart.forEach(item => {
    msg += `• ${item.emoji} ${item.name} x${item.qty} = $${item.price * item.qty}\n`;
    if (item.desc && item.desc !== "") {
      msg += `  ↳ ${item.desc}\n`;
    }
  });
  msg += `\n💰 *Total: $${total}*`;
  msg += `\n📦 *Entrega: ${deliveryMode}*`;
  msg += `\n💳 *Pago: ${paymentMode}*`;
  if (notes) msg += `\n📝 *Notas: ${notes}*`;

  // Guardar pedido en Firebase
  try {
    await addDoc(collection(db, "pedidos"), {
      items: cart.map(i => `${i.emoji} ${i.name} x${i.qty} — $${i.price * i.qty}${i.desc ? ` (${i.desc})` : ""}`).join("\n"),
      total,
      entrega: deliveryMode,
      pago: paymentMode,
      notas: notes || "",
      hora: new Date().toLocaleString("es-UY"),
      estado: "pendiente"
    });
  } catch (e) {
    console.error("Error guardando pedido:", e);
  }

  const url = "https://wa.me/598092085838?text=" + encodeURIComponent(msg);
  window.open(url, "_blank");
}

// ===== COMBO =====
function openCombo(item) {
  currentComboItem = item;
  document.getElementById("combo-title").textContent = item.emoji + " " + item.name;

  const defaults = {
    "combo-arroz": "Arroz Blanco",
    "combo-guarni": "Papas Fritas",
    "combo-ensalada": "Con ensalada"
  };

  Object.keys(defaults).forEach(groupId => {
    const group = document.getElementById(groupId);
    group.querySelectorAll(".combo-opt").forEach(opt => {
      opt.classList.remove("selected");
      if (opt.dataset.value === defaults[groupId]) opt.classList.add("selected");
    });
  });

  document.getElementById("comboModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCombo() {
  document.getElementById("comboModal").classList.remove("open");
  document.body.style.overflow = "";
  currentComboItem = null;
}

function addComboToCart() {
  if (!currentComboItem) return;
  const arroz = document.querySelector("#combo-arroz .combo-opt.selected")?.dataset.value || "Sin arroz";
  const guarni = document.querySelector("#combo-guarni .combo-opt.selected")?.dataset.value || "Sin guarnición";
  const ensalada = document.querySelector("#combo-ensalada .combo-opt.selected")?.dataset.value || "Sin ensalada";
  const comboDesc = [arroz, guarni, ensalada].filter(v => !v.startsWith("Sin")).join(" · ");

  addToCart({
    emoji: currentComboItem.emoji,
    name: currentComboItem.name,
    desc: comboDesc,
    price: currentComboItem.price,
  });

  closeCombo();
}

// ===== TABS =====
function initTabs() {
  document.querySelectorAll(".menu-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".menu-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".menu-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

// ===== OPCIONES DELIVERY/PAGO =====
function initOptions() {
  document.querySelectorAll(".delivery-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      document.querySelectorAll(".delivery-opt").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      deliveryMode = opt.dataset.mode;
    });
  });

  document.querySelectorAll(".payment-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      document.querySelectorAll(".payment-opt").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      paymentMode = opt.dataset.mode;
    });
  });
}

// ===== COMBO OPTS =====
function initComboOpts() {
  ["combo-arroz", "combo-guarni", "combo-ensalada"].forEach(groupId => {
    const group = document.getElementById(groupId);
    group.querySelectorAll(".combo-opt").forEach(opt => {
      opt.addEventListener("click", () => {
        group.querySelectorAll(".combo-opt").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
      });
    });
  });
}

// ===== EVENTOS =====
function initEvents() {
  document.getElementById("view-cart-btn").addEventListener("click", openCart);
  document.getElementById("modal-close-btn").addEventListener("click", closeCart);
  document.getElementById("cartModal").addEventListener("click", e => {
    if (e.target === document.getElementById("cartModal")) closeCart();
  });
  document.getElementById("send-order-btn").addEventListener("click", sendOrder);
  document.getElementById("combo-close-btn").addEventListener("click", closeCombo);
  document.getElementById("comboModal").addEventListener("click", e => {
    if (e.target === document.getElementById("comboModal")) closeCombo();
  });
  document.getElementById("combo-add-btn").addEventListener("click", addComboToCart);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  mostrarFecha();
  cargarMenu();
  cargarDestacado();
  initTabs();
  initOptions();
  initComboOpts();
  initEvents();
});