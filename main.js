// ===== FIREBASE =====
import { db } from './firebase.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== DATOS DEL MENÚ =====
const menuData = {
    platos: [
        { emoji: "🍗", name: "Pollo Asado", desc: "Al horno, jugoso y dorado", price: 250 },
        { emoji: "🍗", name: "Pollo Frito", desc: "Crocante por fuera, tierno por dentro", price: 250 },
        { emoji: "🥩", name: "Cerdo Asado", desc: "Carne de cerdo a la cubana", price: 250 },
        { emoji: "🥩", name: "Churrasco de Cerdo", desc: "A la parrilla, bien sazonado", price: 250 },
        { emoji: "🍗", name: "Suprema a la Plancha", desc: "Pechuga de pollo encebollada a la plancha", price: 250 },
        { emoji: "🦐", name: "Camarones", desc: "Al ajillo o en salsa", price: 320 },
        { emoji: "🐟", name: "Filete de Pescado", desc: "Grillado o a la plancha", price: 300 },
        { emoji: "🍖", name: "Mortadella Frita", desc: "Rodajas de mortadella bien doradas", price: 230 },
        { emoji: "🍗", name: "Picadillo de Pollo", desc: "Casero y muy sabroso", price: 230 },
        { emoji: "🌭", name: "Salchicha en Salsa", desc: "Con salsa cubana especial", price: 230 },
        { emoji: "🥖", name: "Pan con Minutas", desc: "Pan con filete de pescado empanizado", price: 150 },
        { emoji: "🌿", name: "Yuca con Chicharrones", desc: "La combinación perfecta", price: 300 },
        { emoji: "🥘", name: "Paella", desc: "La reina de los arroces", price: 300 },
    ],

    postres: [
        { emoji: "🥤", name: "Malta", desc: "Bebida cubana por excelencia", price: 110 },
        { emoji: "🍮", name: "Flan Entero", desc: "Receta casera de Yohandra", price: 400 },
        { emoji: "🍮", name: "Porción de Flan", desc: "Caramelizado y cremoso", price: 100 },
    ],
    crudos: [
        { emoji: "🥩", name: "Bondiola", desc: "Por kg", price: 185 },
        { emoji: "🐔", name: "Pollo Entero", desc: "Por kg", price: 130 },
        { emoji: "🍗", name: "Pechuga", desc: "Por kg", price: 320 },
        { emoji: "🥩", name: "Paleta Deshuesada", desc: "Por kg", price: 190 },
        { emoji: "🥩", name: "Solomillo", desc: "Por kg", price: 190 },
        { emoji: "🐟", name: "Filete de Pescado", desc: "Por kg", price: 320 },
        { emoji: "🍖", name: "Mortadella", desc: "Por kg", price: 580 },
        { emoji: "🌭", name: "Salchichas", desc: "Por kg", price: 580 },
        { emoji: "🫀", name: "Hígado", desc: "Por kg", price: 100 },
        { emoji: "🍗", name: "Alas de Pollo", desc: "Por kg", price: 85 },
        { emoji: "🍖", name: "Picadillo", desc: "Por kg", price: 110 },
        { emoji: "🦐", name: "Camarones", desc: "Por kg", price: 680 },
        { emoji: "🧄", name: "Ajo Pelado", desc: "Por kg", price: 300 },
        { emoji: "🌿", name: "Paquete de Yuca", desc: "Precio por paquete", price: 320 },
    ],
};

// ===== CARRITO =====
let cart = [];
let deliveryMode = "Delivery";
let paymentMode = "Efectivo";

// ===== CONSTRUIR GRILLAS DEL MENÚ DESDE FIREBASE =====
function buildMenuGrids() {
    ["platos", "postres", "crudos"].forEach(cat => {
        onSnapshot(collection(db, cat), snap => {
            const grid = document.getElementById("grid-" + cat);
            if (!grid) return;
            grid.innerHTML = "";

            snap.forEach(docSnap => {
                const item = { id: docSnap.id, ...docSnap.data() };
                if (!item.activo) return;

                const div = document.createElement("div");
                div.className = "menu-item";
                div.innerHTML = `
          <div class="menu-item-left">
            <span class="menu-item-emoji">${item.emoji}</span>
            <div>
              <div class="menu-item-name">${item.name}</div>
              <div class="menu-item-desc">${item.desc}</div>
            </div>
          </div>
          <div class="menu-item-right">
            <span class="menu-price">${item.price > 0 ? "$" + item.price : "Incl."}</span>
            ${item.price > 0
                        ? `<button class="add-btn" data-name="${item.name}" data-price="${item.price}" data-emoji="${item.emoji}">+ Agregar</button>`
                        : `<span class="incl-tag">🎁 Incluido con tu plato</span>`
                    }
          </div>
        `;
                grid.appendChild(div);
            });

            // Eventos botones agregar
            grid.querySelectorAll(".add-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const item = {
                        name: btn.dataset.name,
                        price: parseInt(btn.dataset.price),
                        emoji: btn.dataset.emoji
                    };
                    const platosSimples = ["Pan con Minutas", "Yuca con Chicharrones", "Paella"];
                    const esPlatoPrincipal = menuData.platos.some(p => p.name === item.name);
                    const esPlatoSimple = platosSimples.includes(item.name);

                    if (esPlatoPrincipal && !esPlatoSimple) {
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

// ===== CARRITO: AGREGAR =====
function addToCart(item) {
    const existing = cart.find(c => c.name === item.name);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    updateCartBar();
}

// ===== CARRITO: ACTUALIZAR BARRA =====
function updateCartBar() {
    const bar = document.getElementById("cart-bar");
    const count = cart.reduce((s, c) => s + c.qty, 0);
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById("cart-count").textContent = count;
    document.getElementById("cart-total").textContent = "$" + total;
    if (count > 0) {
        bar.classList.add("visible");
    } else {
        bar.classList.remove("visible");
    }
}

// ===== CARRITO: ABRIR MODAL =====
function openCart() {
    document.getElementById("cartModal").classList.add("open");
    document.body.style.overflow = "hidden";
    renderCartItems();
}

// ===== CARRITO: RENDERIZAR ITEMS =====
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
      <button class="cart-clear-btn" id="clear-cart-btn">🗑️ Vaciar carrito</button>
    </div>
    ` + cart.map((item, i) => `
    <div class="cart-item">
      <div class="cart-item-name">${item.emoji} ${item.name}</div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-idx="${i}" data-delta="-1">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" data-idx="${i}" data-delta="1">+</button>
        <span class="cart-item-price">$${item.price * item.qty}</span>
        <button class="remove-btn" data-idx="${i}">✕</button>
      </div>
    </div>
  `).join("");

    // Eventos qty
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

    // Botón eliminar item
    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            cart.splice(idx, 1);
            updateCartBar();
            renderCartItems();
        });
    });

    // Vaciar carrito
    const clearBtn = document.getElementById("clear-cart-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            cart = [];
            updateCartBar();
            renderCartItems();
        });
    }

    // Agregar más — cierra carrito y va al menú
    const addMoreBtn = document.getElementById("add-more-btn");
    if (addMoreBtn) {
        addMoreBtn.addEventListener("click", () => {
            closeCart();
            document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
        });
    }

    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById("modal-total").textContent = "$" + total;
    checkout.style.display = "block";
}

// ===== CARRITO: CERRAR =====
function closeCart() {
    document.getElementById("cartModal").classList.remove("open");
    document.body.style.overflow = "";
}

// ===== ENVIAR PEDIDO POR WHATSAPP =====
function sendOrder() {
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

    const url = "https://wa.me/598092085838?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
}

// ===== TABS MENÚ =====
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".menu-panel").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
        });
    });
}

// ===== DELIVERY / PAGO OPCIONES =====
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

// ===== HAMBURGER MENÚ =====
function initHamburger() {
    document.getElementById("hamburger").addEventListener("click", () => {
        document.getElementById("navLinks").classList.toggle("open");
    });
}

// ===== SCROLL REVEAL =====
function initReveal() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add("visible");
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

// ===== COMBO =====
let currentComboItem = null;

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
            if (opt.dataset.value === defaults[groupId]) {
                opt.classList.add("selected");
            }
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

    const cartItem = {
        emoji: currentComboItem.emoji,
        name: currentComboItem.name,
        desc: comboDesc,
        price: currentComboItem.price,
        qty: 1
    };

    const existing = cart.find(c => c.name === cartItem.name && c.desc === cartItem.desc);
    if (existing) {
        existing.qty++;
    } else {
        cart.push(cartItem);
    }

    updateCartBar();
    closeCombo();
}

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

// ===== EVENTOS GENERALES =====
function initEvents() {
    // Abrir carrito
    document.getElementById("view-cart-btn").addEventListener("click", openCart);

    // Cerrar carrito con X
    document.getElementById("modal-close-btn").addEventListener("click", closeCart);

    // Cerrar carrito clickeando afuera
    document.getElementById("cartModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("cartModal")) closeCart();
    });

    // Enviar pedido
    document.getElementById("send-order-btn").addEventListener("click", sendOrder);

    // Cerrar combo con X
    document.getElementById("combo-close-btn").addEventListener("click", closeCombo);

    // Cerrar combo clickeando afuera
    document.getElementById("comboModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("comboModal")) closeCombo();
    });

    // Agregar combo al carrito
    document.getElementById("combo-add-btn").addEventListener("click", addComboToCart);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    buildMenuGrids();
    initTabs();
    initOptions();
    initHamburger();
    initEvents();
    initComboOpts();
    initReveal();
    initIngredientes();
    initContador();
    initFaq();
});

// ===== FAQ =====
function initFaq() {
    document.querySelectorAll(".faq-pregunta").forEach(btn => {
        btn.addEventListener("click", () => {
            const respuesta = btn.nextElementSibling;
            const estaAbierto = respuesta.classList.contains("open");

            // Cerrar todos
            document.querySelectorAll(".faq-respuesta").forEach(r => r.classList.remove("open"));
            document.querySelectorAll(".faq-pregunta").forEach(b => b.classList.remove("active"));

            // Abrir el clickeado si estaba cerrado
            if (!estaAbierto) {
                respuesta.classList.add("open");
                btn.classList.add("active");
            }
        });
    });
}

// ===== CONTADOR ANIMADO =====
function initContador() {
    const contadores = document.querySelectorAll(".contador-num");

    function animarContador(el) {
        const target = parseInt(el.dataset.target);
        const duracion = 2000;
        const inicio = performance.now();

        function animar(ahora) {
            const transcurrido = ahora - inicio;
            const progreso = Math.min(transcurrido / duracion, 1);
            const easeOut = 1 - Math.pow(1 - progreso, 3);
            el.textContent = Math.floor(easeOut * target);

            if (progreso < 1) {
                requestAnimationFrame(animar);
            } else {
                el.textContent = target + "+";
            }
        }

        requestAnimationFrame(animar);
    }

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animarContador(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3, rootMargin: "0px 0px -50px 0px" });

    contadores.forEach(el => obs.observe(el));
}

// ===== INGREDIENTES FLOTANTES =====
function initIngredientes() {
    const ingredientes = [
        "🍗", "🥩", "🐟", "🦐", "🌿", "🧄", "🥘",
        "🍋", "🫑", "🧅", "🥕", "🌶️", "🍅", "🫒",
        "🥗", "🍖", "🌭", "🥚", "🧂", "🫙"
    ];

    const contenedor = document.getElementById("ingredientesFlotantes");
    if (!contenedor) return;

    const cantidad = 18;

    for (let i = 0; i < cantidad; i++) {
        const el = document.createElement("div");
        el.className = "ingrediente";

        // Emoji aleatorio
        el.textContent = ingredientes[Math.floor(Math.random() * ingredientes.length)];

        // Posición horizontal aleatoria
        el.style.left = Math.random() * 100 + "vw";

        // Tamaño variado
        const size = 1.2 + Math.random() * 1.4;
        el.style.fontSize = size + "rem";

        // Duración y delay aleatorios
        const duracion = 18 + Math.random() * 22;
        const delay = Math.random() * 20;
        el.style.animationDuration = duracion + "s";
        el.style.animationDelay = delay + "s";

        contenedor.appendChild(el);
    }
}