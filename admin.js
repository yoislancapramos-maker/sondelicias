import { db } from './firebase.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== CONTRASEÑA =====
const PASSWORD = "sondelicias2026";

// ===== DATOS INICIALES =====
const datosIniciales = {
  platos: [
    { emoji: "🍗", name: "Pollo Asado", desc: "Al horno, jugoso y dorado", price: 250, activo: true },
    { emoji: "🍗", name: "Pollo Frito", desc: "Crocante por fuera, tierno por dentro", price: 250, activo: true },
    { emoji: "🥩", name: "Cerdo Asado", desc: "Carne de cerdo a la cubana", price: 250, activo: true },
    { emoji: "🥩", name: "Churrasco de Cerdo", desc: "A la parrilla, bien sazonado", price: 250, activo: true },
    { emoji: "🍗", name: "Suprema a la Plancha", desc: "Pechuga de pollo encebollada", price: 250, activo: true },
    { emoji: "🦐", name: "Camarones", desc: "Al ajillo o en salsa", price: 320, activo: true },
    { emoji: "🐟", name: "Filete de Pescado", desc: "Grillado o a la plancha", price: 300, activo: true },
    { emoji: "🍖", name: "Mortadella Frita", desc: "Rodajas de mortadella doradas", price: 230, activo: true },
    { emoji: "🍗", name: "Picadillo de Pollo", desc: "Casero y muy sabroso", price: 230, activo: true },
    { emoji: "🌭", name: "Salchicha en Salsa", desc: "Con salsa cubana especial", price: 230, activo: true },
    { emoji: "🥖", name: "Pan con Minutas", desc: "Pan con filete de pescado empanizado", price: 150, activo: true },
    { emoji: "🌿", name: "Yuca con Chicharrones", desc: "La combinación perfecta", price: 300, activo: true },
    { emoji: "🥘", name: "Paella", desc: "La reina de los arroces", price: 300, activo: true },
  ],
  postres: [
    { emoji: "🥤", name: "Malta", desc: "Bebida cubana por excelencia", price: 110, activo: true },
    { emoji: "🍮", name: "Flan Entero", desc: "Receta casera de Yohandra", price: 400, activo: true },
    { emoji: "🍮", name: "Porción de Flan", desc: "Caramelizado y cremoso", price: 100, activo: true },
  ],
  crudos: [
    { emoji: "🥩", name: "Bondiola", desc: "Por kg", price: 185, activo: true },
    { emoji: "🐔", name: "Pollo Entero", desc: "Por kg", price: 130, activo: true },
    { emoji: "🍗", name: "Pechuga", desc: "Por kg", price: 320, activo: true },
    { emoji: "🥩", name: "Paleta Deshuesada", desc: "Por kg", price: 190, activo: true },
    { emoji: "🥩", name: "Solomillo", desc: "Por kg", price: 190, activo: true },
    { emoji: "🐟", name: "Filete de Pescado", desc: "Por kg", price: 320, activo: true },
    { emoji: "🌭", name: "Mortadella", desc: "Por kg", price: 580, activo: true },
    { emoji: "🌭", name: "Salchichas", desc: "Por kg", price: 580, activo: true },
    { emoji: "🫀", name: "Hígado", desc: "Por kg", price: 100, activo: true },
    { emoji: "🍗", name: "Alas de Pollo", desc: "Por kg", price: 85, activo: true },
    { emoji: "🍖", name: "Picadillo", desc: "Por kg", price: 110, activo: true },
    { emoji: "🦐", name: "Camarones", desc: "Por kg", price: 680, activo: true },
    { emoji: "🧄", name: "Ajo Pelado", desc: "Por kg", price: 300, activo: true },
    { emoji: "🌿", name: "Paquete de Yuca", desc: "Precio por paquete", price: 320, activo: true },
  ]
};

// ===== LOGIN =====
let categoriaActual = "platos";
let editandoId = null;
let editandoCat = null;

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("passwordInput").addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

function login() {
  const pass = document.getElementById("passwordInput").value;
  if (pass === PASSWORD) {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    initAdmin();
  } else {
    document.getElementById("loginError").textContent = "Contraseña incorrecta";
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("passwordInput").value = "";
  document.getElementById("loginError").textContent = "";
});

// ===== TABS =====
document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    categoriaActual = tab.dataset.tab;
    document.getElementById("panel-" + categoriaActual).classList.add("active");
  });
});

// ===== INIT ADMIN =====
async function initAdmin() {
  await cargarOInicializarDatos();
  escucharCambios("platos", "gridPlatos");
  escucharCambios("postres", "gridPostres");
  escucharCambios("crudos", "gridCrudos");
  escucharPedidos();
}

// ===== CARGAR O INICIALIZAR DATOS EN FIREBASE =====
async function cargarOInicializarDatos() {
  for (const cat of ["platos", "postres", "crudos"]) {
    const snap = await getDocs(collection(db, cat));
    if (snap.empty) {
      for (const item of datosIniciales[cat]) {
        await addDoc(collection(db, cat), item);
      }
    }
  }
}

// ===== ESCUCHAR CAMBIOS EN TIEMPO REAL =====
function escucharCambios(cat, gridId) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = `
    <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
    <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
    <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
  `;

  onSnapshot(collection(db, cat), snap => {
    grid.innerHTML = "";
    snap.forEach(docSnap => {
      const item = { id: docSnap.id, ...docSnap.data() };
      grid.appendChild(crearCard(item, cat));
    });
  });
}

// ===== CREAR CARD =====
function crearCard(item, cat) {
  const div = document.createElement("div");
  div.className = "admin-card";
  div.innerHTML = `
    <div class="admin-card-top">
${item.icono
      ? `<img src="img/${item.icono}" alt="${item.name}" class="admin-card-img">`
      : `<span class="admin-card-emoji">${item.emoji}</span>`
    }
      <div class="admin-card-info">
        <div class="admin-card-name">${item.name}</div>
        <div class="admin-card-desc">${item.desc}</div>
      </div>
      <span class="admin-card-price">${item.price > 0 ? "$" + item.price : "Incl."}</span>
    </div>
    <div class="admin-card-actions">
      <button class="toggle-btn ${item.activo ? "activo" : "inactivo"}" data-id="${item.id}" data-cat="${cat}" data-activo="${item.activo}">
        ${item.activo ? "✅ Activo" : "❌ Inactivo"}
      </button>
      ${cat === "platos" ? `<button class="destacar-btn ${item.destacado ? 'destacado-activo' : ''}" title="${item.destacado ? 'Quitar destacado' : 'Marcar como plato del día'}">⭐</button>` : ""}
      <button class="edit-btn" data-id="${item.id}" data-cat="${cat}">✏️ Editar</button>
      <button class="delete-btn" data-id="${item.id}" data-cat="${cat}">🗑️</button>
    </div>
  `;

  // Toggle activo
  div.querySelector(".toggle-btn").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const activo = btn.dataset.activo === "true";
    await updateDoc(doc(db, cat, item.id), { activo: !activo });
  });

  // Destacar
  const destacarBtn = div.querySelector(".destacar-btn");
  if (destacarBtn) {
    destacarBtn.addEventListener("click", async () => {
      // Toggle destacado — permite varios al mismo tiempo
      await updateDoc(doc(db, cat, item.id), { destacado: !item.destacado });
    });
  }

  // Editar
  div.querySelector(".edit-btn").addEventListener("click", () => {
    abrirModal(cat, item);
  });

  // Eliminar
  div.querySelector(".delete-btn").addEventListener("click", async () => {
    if (confirm("¿Eliminar " + item.name + "?")) {
      await deleteDoc(doc(db, cat, item.id));
    }
  });

  return div;
}

// ===== MODAL AGREGAR/EDITAR =====
function abrirModal(cat, item = null) {
  editandoCat = cat;
  editandoId = item ? item.id : null;
  document.getElementById("modalItemTitle").textContent = item ? "Editar plato" : "Agregar plato";
  document.getElementById("itemEmoji").value = item ? item.emoji : "";
  document.getElementById("itemNombre").value = item ? item.name : "";
  document.getElementById("itemDesc").value = item ? item.desc : "";
  document.getElementById("itemPrecio").value = item ? item.price : "";
  document.getElementById("itemImagen").value = item ? (item.imagen || "") : "";
  document.getElementById("itemIcono").value = item ? (item.icono || "") : "";
  document.getElementById("modalItem").classList.add("open");
}

function cerrarModal() {
  document.getElementById("modalItem").classList.remove("open");
  editandoId = null;
  editandoCat = null;
}

document.getElementById("modalItemClose").addEventListener("click", cerrarModal);
document.getElementById("btnCancelarItem").addEventListener("click", cerrarModal);

document.getElementById("btnGuardarItem").addEventListener("click", async () => {
  const emoji = document.getElementById("itemEmoji").value.trim();
  const name = document.getElementById("itemNombre").value.trim();
  const desc = document.getElementById("itemDesc").value.trim();
  const price = parseInt(document.getElementById("itemPrecio").value) || 0;

  if (!name) return;

  const imagen = document.getElementById("itemImagen").value.trim();
  const icono = document.getElementById("itemIcono").value.trim();
  const datos = { emoji, name, desc, price, activo: true, imagen: imagen || "", icono: icono || "" };

  if (editandoId) {
    await updateDoc(doc(db, editandoCat, editandoId), datos);
  } else {
    await addDoc(collection(db, editandoCat), datos);
  }

  cerrarModal();
});

// Botones agregar
document.getElementById("btnAgregarPlato").addEventListener("click", () => abrirModal("platos"));
document.getElementById("btnAgregarPostre").addEventListener("click", () => abrirModal("postres"));
document.getElementById("btnAgregarCrudo").addEventListener("click", () => abrirModal("crudos"));

// ===== PEDIDOS =====
function escucharPedidos() {
  const lista = document.getElementById("listaPedidos");
  lista.innerHTML = "<div class='pedidos-vacio'>⏳ Cargando pedidos...</div>";

  onSnapshot(collection(db, "pedidos"), snap => {
    // Badge de notificación
    const cantidad = snap.size;
    const tab = document.querySelector(".admin-tab[data-tab='pedidos']");
    if (tab) {
      tab.innerHTML = cantidad > 0
        ? `📦 Pedidos <span class="badge-pedidos">${cantidad}</span>`
        : `📦 Pedidos`;
    }
    if (snap.empty) {
      lista.innerHTML = "<div class='pedidos-vacio'>📭 No hay pedidos todavía</div>";
      return;
    }

    const pedidos = [];
    snap.forEach(docSnap => {
      pedidos.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Ordenar por hora más reciente
    pedidos.sort((a, b) => new Date(b.hora) - new Date(a.hora));

    lista.innerHTML = pedidos.map((p, i) => `
      <div class="pedido-card">
        <div class="pedido-header">
          <span class="pedido-num">🛒 Pedido #${pedidos.length - i}</span>
          <span class="pedido-hora">${p.hora || ""}</span>
        </div>
        <div class="pedido-items">${(p.items || "").replace(/\n/g, "<br>")}</div>
        ${p.notas ? `<div class="pedido-notas">📝 ${p.notas}</div>` : ""}
        <div class="pedido-footer">
          <span class="pedido-tag total">💰 $${p.total || 0}</span>
          <span class="pedido-tag entrega">📦 ${p.entrega || ""}</span>
          <span class="pedido-tag pago">💳 ${p.pago || ""}</span>
          <button class="pedido-eliminar" data-id="${p.id}">🗑️</button>
        </div>
      </div>
    `).join("");

    // Eliminar pedido individual
    document.querySelectorAll(".pedido-eliminar").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (confirm("¿Eliminar este pedido?")) {
          await deleteDoc(doc(db, "pedidos", btn.dataset.id));
        }
      });
    });
  });
}

document.getElementById("btnLimpiarPedidos").addEventListener("click", async () => {
  if (confirm("¿Limpiar todos los pedidos?")) {
    const snap = await getDocs(collection(db, "pedidos"));
    snap.forEach(async docSnap => {
      await deleteDoc(doc(db, "pedidos", docSnap.id));
    });
  }
});

// ===== MENSAJE DIARIO =====
document.getElementById("btnGenerarMensaje").addEventListener("click", async () => {
  const snap = await getDocs(collection(db, "platos"));
  const destacados = [];
  snap.forEach(docSnap => {
    const item = docSnap.data();
    if (item.destacado && item.activo) destacados.push(item);
  });

  const hoy = new Date();
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const fecha = `${dias[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;

  let msg = "";
  msg += `🇨🇺 *SON D'LICIAS* 🇨🇺\n`;
  msg += `_Las Delicias de Yohandra_\n\n`;
  msg += `📅 *Menú del día — ${fecha}*\n`;
  msg += `${"─".repeat(28)}\n\n`;

  if (destacados.length > 0) {
    msg += `🔥 *DESTACADOS DE HOY*\n\n`;
    destacados.forEach(item => {
      msg += `${item.emoji} *${item.name}*\n`;
      msg += `   ${item.desc}\n`;
      msg += `   💰 $${item.price}\n`;
      msg += `   🍚 Con arroz a elección · 🥗 Ensalada · 🍟 Papas o tostones\n\n`;
    });
    msg += `${"─".repeat(28)}\n\n`;
  }

  if (destacados.length === 0) {
    msg += `🍽️ *¡Hoy tenemos el menú completo disponible!*\n`;
    msg += `Entra al link y elige lo que más te gusta.\n\n`;
  } else {
    msg += `🍽️ *¡Y hay más opciones esperándote!*\n`;
    msg += `Entra al menú y elige tu favorito.\n\n`;
  }

  msg += `${"─".repeat(28)}\n\n`;
  msg += `📲 *Realiza tu pedido aquí:*\n`;
  msg += `📌 sondelicias.vercel.app/menu.html\n\n`;
  msg += `📞 *Pedidos:* 092 085 838\n`;
  msg += `🛵 Delivery · 🏠 Retiro en local\n`;
  msg += `_¡Más que un antojo!_ 🤤`;

  const preview = document.getElementById("mensajePreview");
  preview.innerHTML = `<pre class="mensaje-texto">${msg}</pre>`;

  const btnCopiar = document.getElementById("btnCopiarMensaje");
  btnCopiar.style.display = "block";
  btnCopiar.onclick = () => {
    navigator.clipboard.writeText(msg);
    btnCopiar.textContent = "✅ ¡Copiado!";
    setTimeout(() => {
      btnCopiar.textContent = "📋 Copiar mensaje";
    }, 2000);
  };
});