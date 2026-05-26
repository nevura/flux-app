// ==========================================
// 1. CONFIGURACIÓN ESTÁTICA Y ROUTER
// ==========================================
const USER_EMAIL = "bernardo.perezro06@gmail.com";
const URL_EXEC = "https://script.google.com/macros/s/AKfycbwa5lY4XpOLblsVQoITyDZMQHEsx5Ka71Z7D5Z4ai4BXkNUjYDME2brlpB2m4zjH00m/exec";

const STATIC_ICONS = [
    { id_icon: 'IC-001', icon_base: 'fa-solid fa-utensils' }, { id_icon: 'IC-002', icon_base: 'fa-solid fa-bag-shopping' },
    { id_icon: 'IC-003', icon_base: 'fa-solid fa-ticket' }, { id_icon: 'IC-004', icon_base: 'fa-solid fa-square-parking' },
    { id_icon: 'IC-005', icon_base: 'fa-solid fa-gas-pump' }, { id_icon: 'IC-006', icon_base: 'fa-solid fa-briefcase' },
    { id_icon: 'IC-007', icon_base: 'fa-solid fa-arrow-trend-up' }, { id_icon: 'IC-008', icon_base: 'fa-solid fa-building' },
    { id_icon: 'IC-009', icon_base: 'fa-solid fa-shuffle' }, { id_icon: 'IC-010', icon_base: 'fa-solid fa-arrows-rotate' },
    { id_icon: 'IC-011', icon_base: 'fa-solid fa-heart-pulse' }, { id_icon: 'IC-012', icon_base: 'fa-solid fa-bolt' },
    { id_icon: 'IC-013', icon_base: 'fa-solid fa-money-bill-transfer' }, { id_icon: 'IC-014', icon_base: 'fa-solid fa-hand-holding-dollar' },
    { id_icon: 'IC-015', icon_base: 'fa-solid fa-house' }, { id_icon: 'IC-016', icon_base: 'fa-solid fa-paw' },
    { id_icon: 'IC-017', icon_base: 'fa-solid fa-graduation-cap' }, { id_icon: 'IC-018', icon_base: 'fa-solid fa-plane' },
    { id_icon: 'IC-019', icon_base: 'fa-solid fa-gift' }, { id_icon: 'IC-020', icon_base: 'fa-solid fa-scissors' },
    { id_icon: 'IC-021', icon_base: 'fa-solid fa-dumbbell' }, { id_icon: 'IC-022', icon_base: 'fa-solid fa-bus' },
    { id_icon: 'IC-023', icon_base: 'fa-solid fa-heart' }, { id_icon: 'IC-024', icon_base: 'fa-solid fa-piggy-bank' },
    { id_icon: 'IC-025', icon_base: 'fa-solid fa-droplet' }, { id_icon: 'IC-026', icon_base: 'fa-solid fa-wrench' },
    { id_icon: 'IC-027', icon_base: 'fa-solid fa-music' }, { id_icon: 'IC-028', icon_base: 'fa-brands fa-xbox' },
    { id_icon: 'IC-029', icon_base: 'fa-solid fa-tv' }, { id_icon: 'IC-030', icon_base: 'fa-solid fa-chess-knight' },
    { id_icon: 'IC-031', icon_base: 'fa-brands fa-playstation' }, { id_icon: 'IC-032', icon_base: 'fa-solid fa-mug-hot' },
    { id_icon: 'IC-033', icon_base: 'fa-solid fa-shirt' }, { id_icon: 'IC-034', icon_base: 'fa-solid fa-paw' },
    { id_icon: 'IC-035', icon_base: 'fa-solid fa-pills' }, { id_icon: 'IC-036', icon_base: 'fa-solid fa-stethoscope' },
    { id_icon: 'IC-038', icon_base: 'fa-solid fa-motorcycle' }, { id_icon: 'IC-039', icon_base: 'fa-solid fa-plane-departure' },
    { id_icon: 'IC-040', icon_base: 'fa-solid fa-building' }, { id_icon: 'IC-041', icon_base: 'fa-solid fa-wifi' },
    { id_icon: 'IC-042', icon_base: 'fa-solid fa-laptop' }, { id_icon: 'IC-043', icon_base: 'fa-solid fa-mobile-screen' },
    { id_icon: 'IC-044', icon_base: 'fa-solid fa-couch' }, { id_icon: 'IC-045', icon_base: 'fa-solid fa-bed' },
    { id_icon: 'IC-046', icon_base: 'fa-solid fa-baby-carriage' }, { id_icon: 'IC-047', icon_base: 'fa-solid fa-broom' },
    { id_icon: 'IC-048', icon_base: 'fa-solid fa-brush' }, { id_icon: 'IC-049', icon_base: 'fa-solid fa-hammer' },
    { id_icon: 'IC-050', icon_base: 'fa-solid fa-wine-glass' }, { id_icon: 'IC-051', icon_base: 'fa-solid fa-book' },
    { id_icon: 'IC-052', icon_base: 'fa-solid fa-beer-mug-empty' }, { id_icon: 'IC-053', icon_base: 'fa-solid fa-cart-shopping' },
    { id_icon: 'IC-054', icon_base: 'fa-solid fa-gem' }, { id_icon: 'IC-055', icon_base: 'fa-solid fa-candy-cane' }, { id_icon: 'IC-056', icon_base: 'fa-solid fa-car' },
    { id_icon: 'IC-AUDIT', icon_base: 'fa-solid fa-magnifying-glass-dollar' }
];

const STATIC_COLORS = [
    { id_color: 'COL-14', hex: '#7f1d1d', tailwind: 'text-red-900', bg: 'bg-red-900/20' }, { id_color: 'COL-23', hex: '#ef4444', tailwind: 'text-red-500', bg: 'bg-red-500/20' },
    { id_color: 'COL-04', hex: '#f43f5e', tailwind: 'text-rose-500', bg: 'bg-rose-500/20' }, { id_color: 'COL-10', hex: '#ec4899', tailwind: 'text-pink-500', bg: 'bg-pink-500/20' },
    { id_color: 'COL-17', hex: '#d946ef', tailwind: 'text-fuchsia-500', bg: 'bg-fuchsia-500/20' }, { id_color: 'COL-05', hex: '#a855f7', tailwind: 'text-purple-500', bg: 'bg-purple-500/20' },
    { id_color: 'COL-18', hex: '#8b5cf6', tailwind: 'text-violet-500', bg: 'bg-violet-500/20' }, { id_color: 'COL-09', hex: '#6366f1', tailwind: 'text-indigo-500', bg: 'bg-indigo-500/20' },
    { id_color: 'COL-11', hex: '#1e3a8a', tailwind: 'text-blue-900', bg: 'bg-blue-900/20' }, { id_color: 'COL-01', hex: '#3b82f6', tailwind: 'text-blue-500', bg: 'bg-blue-500/20' },
    { id_color: 'COL-19', hex: '#0ea5e9', tailwind: 'text-sky-500', bg: 'bg-sky-500/20' }, { id_color: 'COL-06', hex: '#06b6d4', tailwind: 'text-cyan-500', bg: 'bg-cyan-500/20' },
    { id_color: 'COL-15', hex: '#14b8a6', tailwind: 'text-teal-500', bg: 'bg-teal-500/20' }, { id_color: 'COL-02', hex: '#10b981', tailwind: 'text-emerald-500', bg: 'bg-emerald-500/20' },
    { id_color: 'COL-12', hex: '#14532d', tailwind: 'text-green-900', bg: 'bg-green-900/20' }, { id_color: 'COL-16', hex: '#84cc16', tailwind: 'text-lime-500', bg: 'bg-lime-500/20' },
    { id_color: 'COL-20', hex: '#facc15', tailwind: 'text-yellow-400', bg: 'bg-yellow-400/20' }, { id_color: 'COL-03', hex: '#f59e0b', tailwind: 'text-amber-500', bg: 'bg-amber-500/20' },
    { id_color: 'COL-08', hex: '#f97316', tailwind: 'text-orange-500', bg: 'bg-orange-500/20' }, { id_color: 'COL-24', hex: '#9a3412', tailwind: 'text-orange-800', bg: 'bg-orange-800/20' },
    { id_color: 'COL-22', hex: '#78716c', tailwind: 'text-stone-500', bg: 'bg-stone-500/20' }, { id_color: 'COL-13', hex: '#9ca3af', tailwind: 'text-gray-400', bg: 'bg-gray-400/20' },
    { id_color: 'COL-21', hex: '#71717a', tailwind: 'text-zinc-500', bg: 'bg-zinc-500/20' }, { id_color: 'COL-07', hex: '#64748b', tailwind: 'text-slate-500', bg: 'bg-slate-500/20' },
    { id_color: 'COL-25', hex: '#000000', tailwind: 'text-white', bg: 'bg-black' }, { id_color: 'COL-26', hex: '#ffffff', tailwind: 'text-black', bg: 'bg-white' },
    { id_color: 'COL-27', hex: '#84cc16', tailwind: 'text-lime-500', bg: 'bg-lime-500/20' },
    { id_color: 'COL-28', hex: '#1e1b4b', tailwind: 'text-indigo-950', bg: 'bg-indigo-950/30' },
    { id_color: 'COL-29', hex: '#78350f', tailwind: 'text-amber-900', bg: 'bg-amber-900/20' },
    { id_color: 'COL-30', hex: '#be185d', tailwind: 'text-pink-700', bg: 'bg-pink-700/20' }
];

const STATIC_PAYMENT_METHODS = [
    { id_metodo_pago: 'MP-EFECTIVO', nombre: 'Efectivo', icon: 'fa-solid fa-money-bill-1-wave', id_color: 'COL-02' },
    { id_metodo_pago: 'MP-TDD', nombre: 'Tarjeta Débito', icon: 'fa-solid fa-credit-card', id_color: 'COL-01' },
    { id_metodo_pago: 'MP-TDC', nombre: 'Tarjeta Crédito', icon: 'fa-regular fa-credit-card', id_color: 'COL-05' }
];

const DEFAULT_CATEGORIES = [
    { id_categoria: 'CAT-DEF-FOOD', nombre: 'Alimentos y bebidas', id_icon: 'IC-001', id_color: 'COL-08' },
    { id_categoria: 'CAT-DEF-SHOP', nombre: 'Compras', id_icon: 'IC-002', id_color: 'COL-19' },
    { id_categoria: 'CAT-DEF-ENT', nombre: 'Entretenimiento', id_icon: 'IC-003', id_color: 'COL-10' },
    { id_categoria: 'CAT-DEF-EST', nombre: 'Estacionamiento', id_icon: 'IC-004', id_color: 'COL-05' },
    { id_categoria: 'CAT-DEF-GAS', nombre: 'Gasolina', id_icon: 'IC-005', id_color: 'COL-14' },
    { id_categoria: 'CAT-DEF-HON', nombre: 'Honorarios', id_icon: 'IC-006', id_color: 'COL-22' },
    { id_categoria: 'CAT-DEF-INV', nombre: 'Inversiones', id_icon: 'IC-007', id_color: 'COL-09' },
    { id_categoria: 'CAT-DEF-HOME', nombre: 'Hogar', id_icon: 'IC-015', id_color: 'COL-24' },
    { id_categoria: 'CAT-DEF-OTHER', nombre: 'Otro', id_icon: 'IC-009', id_color: 'COL-21' },
    { id_categoria: 'CAT-DEF-REC', nombre: 'Recurrente', id_icon: 'IC-010', id_color: 'COL-03' },
    { id_categoria: 'CAT-DEF-SAL', nombre: 'Salud', id_icon: 'IC-011', id_color: 'COL-06' },
    { id_categoria: 'CAT-DEF-SERV', nombre: 'Servicios', id_icon: 'IC-026', id_color: 'COL-20' },
    { id_categoria: 'CAT-DEF-AMOR', nombre: 'Amor', id_icon: 'IC-023', id_color: 'COL-23' },
    { id_categoria: 'CAT-DEF-VENT', nombre: 'Ventas y Negocios', id_icon: 'IC-014', id_color: 'COL-12' },
    { id_categoria: 'CAT-AUDIT', nombre: 'Ajuste', id_icon: 'IC-AUDIT', id_color: 'COL-30' }
];

// --- HELPER: FECHA LOCAL MÉXICO ---
function getMexicoISOString(dateObj) {
    const baseDate = dateObj ? new Date(dateObj) : new Date();
    return Utilities.formatDate(baseDate, "GMT-6", "yyyy-MM-dd'T'HH:mm:ss");
}
// --- ROUTER API ---
function doGet(e) {
    if (e.parameter && e.parameter.mode === 'api') {
        // Cache: respuesta instantánea si existe
        const cache = CacheService.getScriptCache();
        const cached = cache.get('api_form_data');
        if (cached) {
            return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
        }

        const ss = SpreadsheetApp.getActiveSpreadsheet();

        // Categorías: fusión de defaults + hoja personalizada (ligero)
        const catMap = new Map();
        DEFAULT_CATEGORIES.forEach(c => catMap.set(c.id_categoria, c.nombre));
        const catSheet = ss.getSheetByName('categorias');
        if (catSheet && catSheet.getLastRow() > 1) {
            const catData = catSheet.getDataRange().getValues();
            const catHeaders = catData[0].map(h => String(h).trim());
            const colId = catHeaders.indexOf('id_categoria');
            const colName = catHeaders.indexOf('nombre');
            for (let i = 1; i < catData.length; i++) {
                if (catData[i][colId]) catMap.set(catData[i][colId], catData[i][colName]);
            }
        }
        const categoriasNombres = Array.from(catMap.values()).sort();

        // Cuentas: solo nombres
        const cuentasNombres = [];
        const accSheet = ss.getSheetByName('cuentas');
        if (accSheet && accSheet.getLastRow() > 1) {
            const accData = accSheet.getDataRange().getValues();
            const accHeaders = accData[0].map(h => String(h).trim());
            const colNombre = accHeaders.indexOf('nombre');
            for (let i = 1; i < accData.length; i++) {
                if (accData[i][colNombre]) cuentasNombres.push(accData[i][colNombre]);
            }
        }
        const cuentasOrigen = cuentasNombres.filter(n => !String(n).toLowerCase().includes('crédito') && !String(n).toLowerCase().includes('tdc'));

        const outputAPI = { categorias: categoriasNombres, cuentas: cuentasNombres, cuentas_origen: cuentasOrigen, tipos: ["Gasto", "Ingreso", "Transferencia"] };
        const jsonStr = JSON.stringify(outputAPI);

        // Cachear por 6 horas (21600 segundos)
        cache.put('api_form_data', jsonStr, 21600);

        return ContentService.createTextOutput(jsonStr).setMimeType(ContentService.MimeType.JSON);
    }
    return HtmlService.createTemplateFromFile('Dashboard').evaluate().setTitle('Flux App').setFaviconUrl('https://img.icons8.com/?size=100&id=7991&format=png&color=413bf6.png').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('movimientos');
    try {
        const data = JSON.parse(e.postData.contents);
        const uuid = Utilities.getUuid();
        const fechaMexico = data.created_time ? getMexicoISOString(data.created_time) : getMexicoISOString();
        const monto = Math.abs(parseFloat(String(data.cantidad).replace(/[^0-9.]/g, '')));
        let finalCat = "";
        let inputId = String(data.id_categoria || "").trim().toUpperCase();
        let inputName = String(data.categoria || "").trim().toLowerCase();

        if (inputId === 'CAT-APPLE' || inputName.includes('apple')) finalCat = 'CAT-APPLE';
        else finalCat = inputId.startsWith('CAT-') ? inputId : buscarIdCategoriaHibrida(ss, data.categoria || data.id_categoria);

        let isValidado = (data.validado !== undefined) ? parseInt(data.validado) : (finalCat === 'CAT-APPLE' ? 0 : 1);
        let idTransaccion = data.id_transaccion || "TR-GASTO";
        if (data.tipo === "Ingreso") idTransaccion = "TR-INGRESO";
        if (data.tipo === "Transferencia") idTransaccion = "TR-TRANSFER";

        if (idTransaccion === "TR-TRANSFER") {
            let idDestino = String(data.cuenta_destino).startsWith('CTA-') ? data.cuenta_destino : buscarIDEnHoja(ss, 'cuentas', data.cuenta_destino);
            let idOrigen = (data.id_cuenta || data.cuenta).startsWith('CTA-') ? (data.id_cuenta || data.cuenta) : buscarIDEnHoja(ss, 'cuentas', data.id_cuenta || data.cuenta);
            sheet.appendRow([uuid, (data.concepto || "Transferencia") + " (Salida)", "TR-TRANSFER", monto, "CAT-TRANSFER", idOrigen, fechaMexico, -monto, isValidado, "", ""]);
            sheet.appendRow([uuid, (data.concepto || "Transferencia") + " (Entrada)", "TR-TRANSFER", monto, "CAT-TRANSFER", idDestino, fechaMexico, monto, isValidado, "", ""]);
        } else {
            let ajuste = idTransaccion === 'TR-INGRESO' ? monto : -monto;
            let idCuentaFinal = (data.id_cuenta || data.cuenta).startsWith('CTA-') ? (data.id_cuenta || data.cuenta) : buscarIDEnHoja(ss, 'cuentas', data.id_cuenta || data.cuenta);
            sheet.appendRow([uuid, data.concepto || "Apple Pay", idTransaccion, monto, finalCat, idCuentaFinal, fechaMexico, ajuste, isValidado, "", "", 0, 0]);
        }
        return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", msg: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function addManualTransaction(form, customId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('movimientos');
    const uuid = customId || Utilities.getUuid();
    const fechaAFijar = form.created_time ? getMexicoISOString(form.created_time) : getMexicoISOString();
    const monto = Math.abs(parseFloat(form.cantidad));

    if (form.id_transaccion === 'TR-TRANSFER') {
        const concepto = form.concepto || "Transferencia Manual";
        // 14 columns: id_movimiento, concepto, id_transaccion, cantidad, id_categoria, id_cuenta, created_time, ajuste, validado, id_planificado, split_data, excluir_presupuesto, es_por_cobrar, es_por_pagar
        sheet.appendRow([uuid, concepto + " (Salida)", "TR-TRANSFER", monto, "CAT-TRANSFER", form.id_cuenta, fechaAFijar, -monto, 1, form.id_planificado || "", "", 0, 0, 0]);
        sheet.appendRow([uuid, concepto + " (Entrada)", "TR-TRANSFER", monto, "CAT-TRANSFER", form.cuenta_destino, fechaAFijar, monto, 1, form.id_planificado || "", "", 0, 0, 0]);
        return JSON.stringify({ status: "ok", id: uuid });
    } else {
        const ajuste = form.id_transaccion === 'TR-INGRESO' ? monto : -monto;
        const finalSplit = (typeof form.split_data === 'object' && form.split_data !== null) ? JSON.stringify(form.split_data) : (form.split_data || "");

        sheet.appendRow([
            uuid,
            form.concepto,
            form.id_transaccion,
            monto,
            form.id_categoria,
            form.id_cuenta,
            fechaAFijar,
            ajuste,
            1,
            form.id_planificado || "",
            finalSplit,
            form.excluir_presupuesto ? 1 : 0,
            form.es_por_cobrar ? 1 : 0,
            form.es_por_pagar ? 1 : 0
        ]);
        SpreadsheetApp.flush();
        return JSON.stringify({ status: "ok", id: uuid });
    }
}

// ==========================================
// 2. LÓGICA DE RECURRENTES Y NOTIFICACIONES
// ==========================================

function checkRecurringTransactions(ss, force = false) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    const todayStr = Utilities.formatDate(new Date(), "GMT-6", "yyyy-MM-dd");
    const props = PropertiesService.getScriptProperties();
    const lastCheck = props.getProperty('last_recurring_check');

    if (!force && lastCheck === todayStr) return;

    const lock = LockService.getScriptLock();
    try {
        try { lock.waitLock(10000); } catch (e) { return; }

        ensurePlanificadosHeaders(ss);
        ensureMovimientosHeaders();

        const sheetPlan = ss.getSheetByName('planificados');
        const sheetMov = ss.getSheetByName('movimientos');
        if (!sheetPlan || !sheetMov) return;

        const dataPlan = sheetPlan.getDataRange().getValues();
        const headers = dataPlan[0];
        const col = (name) => headers.indexOf(name);
        if (col('estado') === -1) return;

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const movRows = [];
        let planUpdated = false;

        for (let i = 1; i < dataPlan.length; i++) {
            try {
                const row = dataPlan[i];
                if (String(row[col('estado')]).toUpperCase() !== 'ACTIVO') continue;

                let nextDate = row[col('proximo_cobro')] ? new Date(row[col('proximo_cobro')]) : null;
                if (!nextDate || isNaN(nextDate.getTime())) continue;
                nextDate.setHours(0, 0, 0, 0);

                // A. LÓGICA DE COBRO
                if (nextDate <= today) {
                    let tempNextDate = new Date(nextDate.getTime());
                    while (tempNextDate <= today) {
                        const uuid = Utilities.getUuid();
                        const rawCantidad = row[col('cantidad')];
                        const monto = Math.abs(parseFloat(String(rawCantidad).replace(/[^0-9.]/g, '')) || 0);
                        const tipo = row[col('id_transaccion')];
                        const planSplitRaw = row[col('split_data')];
                        let finalSplitForMov = "";
                        let es_por_cobrar = 0;
                        let es_por_pagar = 0;

                        // Lógica de Split
                        if (planSplitRaw && String(planSplitRaw).startsWith('{')) {
                            try {
                                const planSplit = JSON.parse(planSplitRaw);
                                const mesMexico = Utilities.formatDate(tempNextDate, "GMT-6", "M");
                                const currentMonth = parseInt(mesMexico) - 1;
                                const participants = planSplit.data || planSplit.assignments || [];
                                const assigned = participants.filter(as => !as.months || as.months.includes(currentMonth));

                                if (assigned.length > 0) {
                                    const splitMode = planSplit.splitMode || "DIV";

                                    // Aseguramos que PER-YO esté presente en modos de deuda para representar nuestra parte del trato
                                    if ((splitMode === 'IOWE' || splitMode === 'THEY') && !assigned.some(a => a.id === 'PER-YO')) {
                                        assigned.push({ id: 'PER-YO', nombre: 'Yo', value: 0, paidAmount: 0 });
                                    }

                                    const isTurnMode = (splitMode === 'DIV' && assigned.length === 1);

                                    const movData = assigned.map(as => {
                                        const isYo = as.id === 'PER-YO';
                                        let rawVal = parseFloat(as.value || as.amount || 0);

                                        // Si el valor viene en 0 de la planificación (como en el ejemplo del usuario),
                                        // intentamos derivarlo del monto total si es el responsable de ese campo.
                                        if (rawVal === 0) {
                                            if (splitMode === 'IOWE' && isYo) rawVal = monto;
                                            if (splitMode === 'THEY' && !isYo) rawVal = monto / (assigned.length - 1);
                                        }

                                        // Determinamos quién es el pagador real en este modo
                                        let isTheOnePaying;
                                        if (isTurnMode) {
                                            isTheOnePaying = true;
                                        } else if (splitMode === 'IOWE') {
                                            isTheOnePaying = !isYo;
                                        } else {
                                            isTheOnePaying = isYo;
                                        }

                                        // El pagador real puso el dinero (paidAmount), pero en deudas, su "value" (cuantía de factura) es 0 
                                        // porque técnicamente el gasto/ingreso "le pertenece" a la otra parte.
                                        let finalValue = rawVal;
                                        if (splitMode === 'IOWE' && !isYo) finalValue = 0;
                                        if (splitMode === 'THEY' && isYo) finalValue = 0;

                                        return {
                                            id: as.id,
                                            nombre: as.nombre,
                                            value: finalValue,
                                            paidAmount: isTheOnePaying ? rawVal : 0,
                                            paidStatus: isTheOnePaying
                                        };
                                    });
                                    finalSplitForMov = JSON.stringify({ mode: planSplit.mode || "AMT", splitMode: planSplit.splitMode || "DIV", data: movData });

                                    const pendingOthers = movData.some(p => p.id !== 'PER-YO' && (splitMode === 'IOWE' ? p.paidStatus : !p.paidStatus) && p.value > 0.01);
                                    const pendingMe = movData.some(p => p.id === 'PER-YO' && !p.paidStatus && p.value > 0.01);
                                    if (tipo === 'TR-GASTO') {
                                        if (pendingOthers) es_por_cobrar = 1;
                                        if (pendingMe) es_por_pagar = 1;
                                    } else if (tipo === 'TR-INGRESO') {
                                        if (pendingOthers) es_por_pagar = 1;
                                        if (pendingMe) es_por_cobrar = 1;
                                    }
                                }
                            } catch (e) { console.error("Error parsing split_data in row " + i, e); }
                        }

                        if (tipo === 'TR-TRANSFER') {
                            const idDestino = row[col('id_destino')] || row[col('cuenta_destino')];
                            const concepto = row[col('nombre')] || "Transferencia Programada";
                            const isoFecha = getMexicoISOString(tempNextDate);
                            // Salida
                            movRows.push([uuid, concepto + " (Salida)", "TR-TRANSFER", monto, "CAT-TRANSFER", row[col('id_cuenta')], isoFecha, -monto, 1, row[col('id_planificado')], finalSplitForMov, 0, es_por_cobrar, es_por_pagar]);
                            // Entrada (uuid compartido para vincularlas)
                            movRows.push([uuid, concepto + " (Entrada)", "TR-TRANSFER", monto, "CAT-TRANSFER", idDestino, isoFecha, monto, 1, row[col('id_planificado')], "", 0, 0, 0]);
                        } else {
                            movRows.push([
                                uuid,
                                row[col('nombre')],
                                tipo,
                                monto,
                                row[col('id_categoria')],
                                row[col('id_cuenta')],
                                getMexicoISOString(tempNextDate),
                                tipo === 'TR-INGRESO' ? monto : -monto,
                                0,
                                row[col('id_planificado')],
                                finalSplitForMov,
                                0,
                                es_por_cobrar,
                                es_por_pagar
                            ]);
                        }
                        tempNextDate = calculateNextDate(tempNextDate, row[col('frecuencia_num')], row[col('frecuencia_unidad')], row[col('dia_pago')]);
                    }
                    dataPlan[i][col('proximo_cobro')] = tempNextDate;
                    dataPlan[i][col('ultimo_cobro')] = new Date();
                    if (col('fecha_ultima_notif') > -1) dataPlan[i][col('fecha_ultima_notif')] = "";
                    planUpdated = true;
                }

                // B. LÓGICA DE NOTIFICACIÓN PREVIA
                else {
                    const diasAviso = parseInt(row[col('dias_notificacion')]) || 1;
                    if (diasAviso > 0) {
                        const fechaAviso = new Date(nextDate);
                        fechaAviso.setDate(nextDate.getDate() - diasAviso);
                        fechaAviso.setHours(0, 0, 0, 0);

                        if (today.toDateString() === fechaAviso.toDateString()) {
                            const lastNotif = row[col('fecha_ultima_notif')] ? new Date(row[col('fecha_ultima_notif')]) : null;

                            if (!lastNotif || lastNotif.toDateString() !== today.toDateString()) {
                                const rawCantidad = row[col('cantidad')];
                                const montoNum = parseFloat(String(rawCantidad).replace(/[^0-9.]/g, '')) || 0;
                                sendNotificationEmail(row[col('nombre')], montoNum, nextDate);
                                if (col('fecha_ultima_notif') > -1) {
                                    dataPlan[i][col('fecha_ultima_notif')] = new Date();
                                    planUpdated = true;
                                }
                            }
                        }
                    }
                }
            } catch (rowErr) {
                console.error("Error processing recurring row " + i, rowErr);
            }
        }

        if (movRows.length > 0) {
            sheetMov.getRange(sheetMov.getLastRow() + 1, 1, movRows.length, movRows[0].length).setValues(movRows);
        }
        if (planUpdated) {
            sheetPlan.getRange(1, 1, dataPlan.length, dataPlan[0].length).setValues(dataPlan);
        }

        props.setProperty('last_recurring_check', todayStr);
    } catch (err) {
        console.error("Critical error in checkRecurringTransactions", err);
    } finally {
        lock.releaseLock();
    }
}

function checkTDCNotifications() {
    try {
        ensureCuentasHeaders();
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheetCuentas = ss.getSheetByName('cuentas');
        if (!sheetCuentas) return;

        const data = sheetCuentas.getDataRange().getValues();
        const headers = data[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i < data.length; i++) {
            try {
                const row = data[i];
                const diaPago = parseInt(row[headers.indexOf('dia_pago')]);

                if (row[headers.indexOf('id_metodo_pago')] === 'MP-TDC' && !isNaN(diaPago)) {
                    // Calculamos la fecha real del próximo pago
                    let fechaPago = new Date(today.getFullYear(), today.getMonth(), diaPago);
                    if (fechaPago < today) {
                        fechaPago.setMonth(fechaPago.getMonth() + 1);
                    }

                    // Calculamos diferencia en días reales
                    const diffTime = fechaPago.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Notificar exactamente 1 día antes
                    if (diffDays === 1) {
                        const colNotif = headers.indexOf('fecha_ultima_notif_tdc');
                        const lastNotif = (colNotif > -1 && row[colNotif]) ? new Date(row[colNotif]) : null;

                        if (!lastNotif || lastNotif.toDateString() !== today.toDateString()) {
                            sendTDCReminderEmail(row[headers.indexOf('nombre')], diaPago);
                            if (colNotif > -1) sheetCuentas.getRange(i + 1, colNotif + 1).setValue(today);
                        }
                    }
                }
            } catch (rowErr) {
                console.error("Error in checkTDCNotifications row " + i, rowErr);
            }
        }
    } catch (err) {
        console.error("Critical error in checkTDCNotifications", err);
    }
}

// --- DEV TOOLS ---
function dev_forceResetRecurring() {
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty('last_recurring_check');
    return "Flag 'last_recurring_check' eliminado e intentando forzar ejecución...";
}

// --- EMAILS ---

// --- SISTEMA DE CORREOS PROFESIONAL ---

function sendNotificationEmail(nombre, cantidad, fecha) {
    const email = typeof USER_EMAIL !== 'undefined' ? USER_EMAIL : Session.getActiveUser().getEmail();
    const montoFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cantidad);

    // Usamos UTC para que el correo no cambie la fecha según el servidor
    const fechaObj = new Date(fecha);
    const dia = fechaObj.getUTCDate();
    const mes = fechaObj.toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' });
    const diaSemana = fechaObj.toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' });
    const fechaFmt = `${diaSemana}, ${dia} de ${mes}`;

    const asunto = `🔔 Recordatorio de Pago: ${nombre}`;

    const htmlTemplate = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background-color: #2563eb; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 1px;">Flux App</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #bfdbfe; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Recordatorio de Pago</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #94a3b8; text-align: center;">Hola,</p>
        <p style="margin: 0 0 30px 0; font-size: 18px; color: #e2e8f0; text-align: center; line-height: 1.5;">Tienes un pago programado. El sistema lo registrará automáticamente.</p>
        <div style="background-color: #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
          <p style="margin: 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Concepto</p>
          <h2 style="margin: 5px 0 20px 0; font-size: 28px; color: #ffffff;">${nombre}</h2>
          <div style="border-top: 1px solid #334155; margin: 15px 0;"></div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="text-align: left; padding: 8px 0; color: #cbd5e1;">Monto</td><td style="text-align: right; padding: 8px 0; font-weight: bold; color: #ffffff; font-size: 18px;">${montoFmt}</td></tr>
            <tr><td style="text-align: left; padding: 8px 0; color: #cbd5e1;">Fecha de Cobro</td><td style="text-align: right; padding: 8px 0; font-weight: bold; color: #60a5fa; text-transform: capitalize;">${fechaFmt}</td></tr>
          </table>
        </div>
      </div>
      <div style="background-color: #020617; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="margin: 0; font-size: 11px; color: #475569;">Powered by Nevura</p>
      </div>
    </div>`;

    MailApp.sendEmail({ to: email, subject: asunto, htmlBody: htmlTemplate });
}

function sendTDCReminderEmail(nombreCuenta, dia) {
    const asunto = `💳 Fecha Límite de Pago: ${nombreCuenta}`;

    const htmlTemplate = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background-color: #2563eb; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 1px;">Flux App</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #fecdd3; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Recordatorio de Tarjeta</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #94a3b8; text-align: center;">Atención,</p>
        <p style="margin: 0 0 30px 0; font-size: 18px; color: #e2e8f0; text-align: center; line-height: 1.5;">Tu tarjeta de crédito está próxima a su fecha límite de pago.</p>
        <div style="background-color: #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
          <p style="margin: 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Cuenta</p>
          <h2 style="margin: 5px 0 20px 0; font-size: 28px; color: #ffffff;">${nombreCuenta}</h2>
          <div style="border-top: 1px solid #334155; margin: 15px 0;"></div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="text-align: left; padding: 8px 0; color: #cbd5e1;">Día de Pago</td><td style="text-align: right; padding: 8px 0; font-weight: bold; color: #2563eb; font-size: 22px;">Día ${dia}</td></tr>
          </table>
        </div>
        <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">Revisa tu aplicación bancaria para liquidar el pago correspondiente.</p>
      </div>
      <div style="background-color: #020617; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="margin: 0; font-size: 11px; color: #475569;">Powered by Nevura</p>
      </div>
    </div>`;

    MailApp.sendEmail({ to: USER_EMAIL, subject: asunto, htmlBody: htmlTemplate });
}

function checkAdjustmentReminders() {
    try {
        const today = new Date();
        // Lógica para detectar el último domingo del mes
        if (today.getDay() === 0) { // 0 = Domingo
            const nextSunday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (nextSunday.getMonth() !== today.getMonth()) {
                // Es el último domingo del mes
                const prop = PropertiesService.getScriptProperties();
                const lastSent = prop.getProperty('last_adjustment_rem_sent');
                const todayStr = Utilities.formatDate(today, "GMT-6", "yyyy-MM-dd");

                if (lastSent !== todayStr) {
                    sendBalanceAdjustmentReminderEmail();
                    prop.setProperty('last_adjustment_rem_sent', todayStr);
                }
            }
        }
    } catch (err) {
        console.error("Error in checkAdjustmentReminders", err);
    }
}

function sendBalanceAdjustmentReminderEmail() {
    const asunto = `⚖️ Recordatorio: Ajuste de Saldos Mensual`;
    const email = typeof USER_EMAIL !== 'undefined' ? USER_EMAIL : Session.getActiveUser().getEmail();

    const htmlTemplate = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 24px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: #ffffff; letter-spacing: -0.5px; font-weight: 800;">Flux App</h1>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #bfdbfe; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">Control de Precisión</p>
      </div>
      <div style="padding: 40px 32px; text-align: center;">
        <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #ffffff; font-weight: 700;">¡Es hora de sincronizar!</h2>
        <p style="margin: 0 0 32px 0; font-size: 16px; color: #94a3b8; line-height: 1.6;">
          Estamos llegando al final del mes. Es el momento ideal para realizar tus <b>Ajustes de Saldo</b> y asegurar que Flux refleje exactamente lo que tienes en tus cuentas reales.
        </p>
        
        <div style="background-color: #1e293b; border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid #334155;">
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #3b82f6; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Pasos recomendados</p>
          <div style="text-align: left; display: inline-block;">
            <p style="margin: 8px 0; font-size: 14px; color: #cbd5e1;"><span style="color: #3b82f6; margin-right: 8px;">✓</span> Abre el módulo de <b>Ajuste</b></p>
            <p style="margin: 8px 0; font-size: 14px; color: #cbd5e1;"><span style="color: #3b82f6; margin-right: 8px;">✓</span> Revisa tus bancos y efectivo real</p>
            <p style="margin: 8px 0; font-size: 14px; color: #cbd5e1;"><span style="color: #3b82f6; margin-right: 8px;">✓</span> Actualiza los saldos en Flux</p>
            <p style="margin: 8px 0; font-size: 14px; color: #cbd5e1;"><span style="color: #3b82f6; margin-right: 8px;">✓</span> <b>Efectivo:</b> cuénta hasta el último centavo</p>
            <p style="margin: 8px 0; font-size: 14px; color: #cbd5e1;"><span style="color: #3b82f6; margin-right: 8px;">✓</span> <b>Débito:</b> revisa el saldo en tu app bancaria</p>
            <p style="margin: 8px 0; font-size: 14px; color: #cbd5e1;"><span style="color: #3b82f6; margin-right: 8px;">✓</span> <b>Crédito:</b> anota la <em>DEUDA</em> total de la tarjeta</p>
          </div>
        </div>

        <a href="${URL_EXEC}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 16px; transition: all 0.3s; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">Abrir Flux App</a>
      </div>
      <div style="background-color: #020617; padding: 24px; text-align: center; border-top: 1px solid #1e293b;">
        <p style="margin: 0; font-size: 11px; color: #475569; letter-spacing: 1px; text-transform: uppercase;">Powered by Nevura • Flux Intelligence</p>
      </div>
    </div>`;

    MailApp.sendEmail({ to: email, subject: asunto, htmlBody: htmlTemplate });
}

function testAdjustmentEmail() {
    sendBalanceAdjustmentReminderEmail();
}

// --- HELPERS (BÚSQUEDAS Y CRUD) ---

function calculateNextDate(startDate, num, unit, anchorDay) {
    let d = new Date(startDate);
    unit = String(unit).toLowerCase();
    let n = parseInt(num) || 1;
    if (unit.includes('dia')) d.setDate(d.getDate() + n);
    else if (unit.includes('semana')) d.setDate(d.getDate() + (n * 7));
    else if (unit.includes('año')) d.setFullYear(d.getFullYear() + n);
    else { d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(anchorDay || startDate.getDate(), last)); }
    return d;
}

function buscarIdCategoriaHibrida(ss, nombreBuscado) {
    if (!nombreBuscado) return "CAT-DEF-OTHER";
    const cleanName = String(nombreBuscado).trim().toLowerCase();
    const foundDefault = DEFAULT_CATEGORIES.find(c => c.nombre.toLowerCase() === cleanName);
    return foundDefault ? foundDefault.id_categoria : (buscarIDEnHoja(ss, 'categorias', nombreBuscado) || "CAT-DEF-OTHER");
}

function buscarIDEnHoja(ss, sheetName, nombreBuscado) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return "";
    const data = sheet.getDataRange().getValues();
    const cleanName = String(nombreBuscado).trim().toLowerCase();
    for (let i = 1; i < data.length; i++) { if (String(data[i][1]).trim().toLowerCase() === cleanName) return data[i][0]; }
    return "";
}

function getDashboardData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensurePlanificadosHeaders(ss);
    checkRecurringTransactions(ss);
    return JSON.stringify(getDataObject(ss));
}

function getDataObject(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    const output = { icons: STATIC_ICONS, colores: STATIC_COLORS, metodo_pago: STATIC_PAYMENT_METHODS, categorias: [], cuentas: [], planificados: [], personas: [] };
    const tables = ["movimientos", "categorias", "cuentas", "presupuestos", "planificados", "personas"];

    // Cargar Categorías (fusión inteligente)
    const catMap = new Map();
    DEFAULT_CATEGORIES.forEach(c => catMap.set(c.id_categoria, c));

    const sheets = ss.getSheets();
    const sheetDataMap = {};
    sheets.forEach(s => {
        const name = s.getName();
        if (tables.includes(name)) {
            const data = s.getDataRange().getValues();
            if (data.length > 1) {
                const headers = data.shift();
                sheetDataMap[name] = { headers: headers.map(h => String(h).trim()), rows: data };
            } else {
                sheetDataMap[name] = { headers: [], rows: [] };
            }
        }
    });

    if (sheetDataMap['categorias']) {
        const { headers, rows } = sheetDataMap['categorias'];
        rows.forEach(row => {
            let obj = {};
            headers.forEach((h, idx) => obj[h] = row[idx]);
            if (obj.id_categoria) catMap.set(obj.id_categoria, obj);
        });
    }
    output.categorias = Array.from(catMap.values());

    // Cargar resto de tablas
    tables.filter(t => t !== 'categorias').forEach(tableName => {
        if (sheetDataMap[tableName]) {
            const { headers, rows } = sheetDataMap[tableName];
            output[tableName] = rows.map(row => {
                let obj = {};
                headers.forEach((h, idx) => {
                    let val = row[idx];
                    if (val instanceof Date) val = getMexicoISOString(val);
                    if (h === 'split_data' && typeof val === 'string' && val.startsWith('{')) {
                        try { obj[h] = JSON.parse(val); } catch (e) { obj[h] = val; }
                    } else {
                        obj[h] = val;
                    }
                });
                return obj;
            });
        } else {
            output[tableName] = [];
        }
    });

    return output;
}

function recordSplitPayment(parentId, personId, amount, accountId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('movimientos');
    const data = sheet.getDataRange().getValues();
    let parentRow = -1; let splitObj = null;
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(parentId)) {
            parentRow = i + 1;
            try { splitObj = typeof data[i][10] === 'string' ? JSON.parse(data[i][10]) : data[i][10]; } catch (e) { splitObj = { data: [] }; }
            break;
        }
    }
    if (parentRow !== -1 && splitObj && splitObj.data) {
        const parentRowData = data[parentRow - 1];
        const tipoParent = parentRowData[2];
        const isDebt = (parentRowData[13] == 1);

        // Determinar el tipo de abono
        let abonoType = isDebt ? tipoParent : "TR-INGRESO";
        // Si es un ingreso y me lo pagan, es una liquidación del mismo tipo
        if (!isDebt && tipoParent === "TR-INGRESO") abonoType = "TR-INGRESO";

        const splitMode = splitObj.splitMode || "DIV";
        let personName = "";
        splitObj.data = splitObj.data.map(p => {
            if (p.id === personId) {
                personName = p.nombre;
                const newPaid = (parseFloat(p.paidAmount) || 0) + parseFloat(amount);
                return { ...p, paidAmount: newPaid, paidStatus: true };
            }
            // En modo IOWE (Yo debo), al pagarle a alguien (Acreedor), marcamos el pago en PER-YO (Deudor)
            if (splitMode === 'IOWE' && personId !== 'PER-YO' && p.id === 'PER-YO') {
                const newVal = (parseFloat(p.paidAmount) || 0) + parseFloat(amount);
                return { ...p, paidAmount: newVal, paidStatus: newVal >= (p.value - 0.01) };
            }
            return p;
        });

        safeSetJSON(sheet, parentRow, 11, splitObj);

        // Limpiar badges si todo está pagado (estrictamente todos)
        const allPaid = splitObj.data.every(p => p.paidStatus);
        if (allPaid) {
            sheet.getRange(parentRow, 13).setValue(0);
            sheet.getRange(parentRow, 14).setValue(0);
        }

        createAbonoRow(sheet, parentRowData, personId, personName, amount, accountId, abonoType);

        SpreadsheetApp.flush();
        return JSON.stringify({ status: "ok" });
    }
    return JSON.stringify({ status: "error", msg: "Transaction or Split not found" });
}

function safeSetJSON(sheet, row, col, obj) {
    if (!obj) return;
    const str = JSON.stringify(obj);
    try {
        JSON.parse(str); // Validation
        sheet.getRange(row, col).setValue(str);
    } catch (e) {
        console.error("Critical: Attempted to save invalid JSON", str);
    }
}

function createAbonoRow(sheet, parentData, personId, personName, amount, accountId, abonoTypeArg = null) {
    const parentId = String(parentData[0]);
    const parentType = parentData[2];
    const conceptoOriginal = parentData[1];
    const catOriginal = parentData[4];

    // Si no se especifica, por defecto es TR-INGRESO
    const finalAbonoType = abonoTypeArg || "TR-INGRESO";

    // LÓGICA CRÍTICA: Solo el flujo real de dinero genera un ajuste en el saldo.
    let ajustePago = 0;
    if (finalAbonoType !== parentType) {
        ajustePago = (finalAbonoType === "TR-INGRESO") ? Math.abs(amount) : -Math.abs(amount);
    }

    // SI EL AJUSTE ES 0, NO SE REGISTRA FILA (Liquidación silenciosa)
    if (Math.abs(ajustePago) < 0.001) return;

    const descSuffix = `Abono de ${personName}`;
    sheet.appendRow([
        Utilities.getUuid(),
        `${conceptoOriginal} - ${descSuffix}`,
        finalAbonoType,
        Math.abs(amount),
        catOriginal,
        accountId || "CTA-0001",
        getMexicoISOString(),
        ajustePago,
        1,
        "",
        JSON.stringify({ isAbono: true, relatedTo: parentId, fromPerson: personId }),
        0, 0, 0
    ]);
    SpreadsheetApp.flush();
}

/**
 * recordPersonPayment: Registers a payment from/to a person, applying it FIFO
 * across their pending movements. Automatically netting overlapping debts first.
 * 
 * @param {string}  personId   - The ID of the person paying/being paid
 * @param {number}  amount     - The explicit NET amount being paid/collected
 * @param {string}  accountId  - The account to credit/debit
 * @param {boolean} isActionPaying - true = user is paying OUT of their bank; false = collecting INTO bank
 */
function recordPersonPayment(personId, amount, accountId, isActionPaying) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('movimientos');
    const data = sheet.getDataRange().getValues();

    let pendingMeDeben = []; // isDebt == false (They owe me)
    let pendingYoDebo = []; // isDebt == true (I owe them)

    for (let i = 1; i < data.length; i++) {
        let splitObj = null;
        try { splitObj = typeof data[i][10] === 'string' ? JSON.parse(data[i][10]) : data[i][10]; } catch (e) { }
        if (!splitObj || !splitObj.data) continue;

        const splitMode = splitObj.splitMode || "DIV";
        const isIOWE = (splitMode === 'IOWE');

        // El personEntry es quien tiene la deuda pendiente (quien no ha pagado)
        // En modo IOWE (Yo debo), el deudor es PER-YO.
        // En otros modos, el deudor es personId.
        let personEntry;
        if (isIOWE) {
            // Buscamos si la persona pasada es el acreedor de esta deuda de PER-YO
            const isCreditor = splitObj.data.some(p => p.id === personId && (p.paidStatus || p.value === 0));
            personEntry = isCreditor ? splitObj.data.find(p => p.id === 'PER-YO' && !p.paidStatus) : null;
        } else {
            personEntry = splitObj.data.find(p => p.id === personId && !p.paidStatus);
        }

        if (!personEntry) continue;

        const pending_amount = (personEntry.value - (personEntry.paidAmount || 0));
        if (pending_amount <= 0.01) continue;

        let movIsDebt = (data[i][13] == 1); // Col 14 (N) is es_por_pagar

        if (data[i][13] != 1 && data[i][12] != 1) {
            // Logic for cases without explicit badges
            const tipo = data[i][2]; // Col 3 (C)
            if (tipo === 'TR-GASTO') {
                movIsDebt = (splitMode === 'IOWE');
            } else if (tipo === 'TR-INGRESO') {
                movIsDebt = (splitMode === 'IOWE'); // IOWE implies I owe them some of the income
            }
        }

        const movObj = {
            rowIndex: i + 1,
            rowData: data[i],
            splitObj: splitObj,
            personEntry: personEntry,
            pending_amount: pending_amount,
            fecha: String(data[i][6])
        };

        if (movIsDebt) pendingYoDebo.push(movObj);
        else pendingMeDeben.push(movObj);
    }

    // Sort both by oldest first
    pendingMeDeben.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    pendingYoDebo.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // 1. Auto-Cancel Phase (cross-settlement without touching bank)
    const totalMeDeben = pendingMeDeben.reduce((acc, m) => acc + m.pending_amount, 0);
    const totalYoDebo = pendingYoDebo.reduce((acc, m) => acc + m.pending_amount, 0);
    const overlap = Math.min(totalMeDeben, totalYoDebo);

    const applyVirtualPayment = (list, totalVirtualAmount) => {
        let rem = totalVirtualAmount;
        for (const mov of list) {
            if (rem <= 0.01) break;
            const toApply = Math.min(rem, mov.pending_amount);

            // Actualizar el estado de pago internamente (sin crear fila de compensación)
            const currentPaid = parseFloat(mov.personEntry.paidAmount) || 0;
            const newPaid = currentPaid + toApply;

            // ACTUALIZACIÓN DIRECTA: Modificamos el objeto referenciado para evitar pérdida de datos
            mov.personEntry.paidAmount = newPaid;
            mov.personEntry.paidStatus = newPaid >= (mov.personEntry.value - 0.01);

            safeSetJSON(sheet, mov.rowIndex, 11, mov.splitObj);

            // Limpiar badges si todo está pagado (estrictamente todos)
            const allPaid = mov.splitObj.data.every(p => p.paidStatus);
            if (allPaid) {
                sheet.getRange(mov.rowIndex, 13).setValue(0);
                sheet.getRange(mov.rowIndex, 14).setValue(0);
            }

            mov.pending_amount -= toApply;
            rem -= toApply;
        }
    };

    if (overlap > 0.01) {
        applyVirtualPayment(pendingMeDeben, overlap);
        applyVirtualPayment(pendingYoDebo, overlap);
    }

    pendingMeDeben = pendingMeDeben.filter(m => m.pending_amount > 0.01);
    pendingYoDebo = pendingYoDebo.filter(m => m.pending_amount > 0.01);

    // 2. Fase de Pago Real (Banco)
    let remaining = parseFloat(amount);
    let activeList = isActionPaying ? pendingYoDebo : pendingMeDeben;

    for (let mov of activeList) {
        if (remaining <= 0.01) break;
        const toApply = Math.min(remaining, mov.pending_amount);

        const parentType = mov.rowData[2];
        const isDebt = (mov.rowData[13] == 1);
        let abonoType = isDebt ? parentType : "TR-INGRESO";

        // Registrar abono real (solo si genera ajuste de saldo)
        createAbonoRow(sheet, mov.rowData, personId, mov.personEntry.nombre, toApply, accountId, abonoType);

        // Actualizar el estado de pago
        const currentPaid = parseFloat(mov.personEntry.paidAmount) || 0;
        const newPaid = currentPaid + toApply;

        mov.personEntry.paidAmount = newPaid;
        mov.personEntry.paidStatus = newPaid >= (mov.personEntry.value - 0.01);

        safeSetJSON(sheet, mov.rowIndex, 11, mov.splitObj);

        // Limpiar badges
        const allPaid = mov.splitObj.data.every(p => p.paidStatus || p.id === 'PER-YO');
        if (allPaid) {
            sheet.getRange(mov.rowIndex, 13).setValue(0);
            sheet.getRange(mov.rowIndex, 14).setValue(0);
        }

        remaining -= toApply;
    }
    SpreadsheetApp.flush();
    return JSON.stringify({ status: "ok", applied: amount - remaining, leftover: remaining });
}

function omitSplitBalance(parentId, personId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('movimientos');
    const data = sheet.getDataRange().getValues();
    let parentRow = -1;
    let splitObj = null;

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(parentId)) {
            parentRow = i + 1;
            try {
                splitObj = typeof data[i][10] === 'string' ? JSON.parse(data[i][10]) : data[i][10];
            } catch (e) { splitObj = { data: [] }; }
            break;
        }
    }

    if (parentRow !== -1 && splitObj && splitObj.data) {
        const splitMode = splitObj.splitMode || "DIV";
        splitObj.data = splitObj.data.map(p => {
            // Si es la persona seleccionada, u omitimos la deuda de PER-YO si esa persona es el acreedor
            if (p.id === personId || (splitMode === 'IOWE' && personId !== 'PER-YO' && p.id === 'PER-YO')) {
                return { ...p, paidAmount: p.value, paidStatus: true };
            }
            return p;
        });
        safeSetJSON(sheet, parentRow, 11, splitObj);

        // Check if fully paid to remove badge
        const allPaid = splitObj.data.every(p => p.paidStatus);
        if (allPaid) {
            sheet.getRange(parentRow, 13).setValue(0); // Col 13 (M)
            sheet.getRange(parentRow, 14).setValue(0); // Col 14 (N)
        }
        SpreadsheetApp.flush();
        return JSON.stringify({ status: "ok" });
    }
    return JSON.stringify({ status: "error", msg: "Transacción no encontrada" });
}

function omitPersonBalance(personId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('movimientos');
    const range = sheet.getDataRange();
    const data = range.getValues();
    let updatedCount = 0;

    for (let i = 1; i < data.length; i++) {
        let splitObj = null;
        let cellContent = data[i][10];
        if (!cellContent || cellContent === "") continue;

        try {
            splitObj = typeof cellContent === 'string' ? JSON.parse(cellContent) : cellContent;
        } catch (e) { continue; }

        if (splitObj && splitObj.data) {
            let changed = false;
            const involvesPerson = splitObj.data.some(p => p.id === personId);
            const splitMode = splitObj.splitMode || "DIV";

            splitObj.data = splitObj.data.map(p => {
                // Caso A: La persona misma debe dinero (Mantenemos lógica actual)
                if (p.id === personId && !p.paidStatus) {
                    changed = true;
                    return { ...p, paidAmount: p.value, paidStatus: true };
                }
                // Caso B: YO debo (PER-YO) y estoy olvidando la deuda con quien me prestó (personId)
                // Solo aplica en modo IOWE si personId está en el split (como pagador)
                if (p.id === 'PER-YO' && splitMode === 'IOWE' && involvesPerson && personId !== 'PER-YO' && !p.paidStatus) {
                    changed = true;
                    return { ...p, paidAmount: p.value, paidStatus: true };
                }
                return p;
            });

            if (changed) {
                safeSetJSON(sheet, i + 1, 11, splitObj);

                // Check if fully paid to remove badge
                const allPaid = splitObj.data.every(p => p.paidStatus || p.id === 'PER-YO');
                if (allPaid) {
                    sheet.getRange(i + 1, 13).setValue(0); // Col 13 (M)
                    sheet.getRange(i + 1, 14).setValue(0); // Col 14 (N)
                }
                updatedCount++;
            }
        }
    }
    SpreadsheetApp.flush();
    return JSON.stringify({ status: "ok" });
}

function updateTransaction(form) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('movimientos');
    const data = sheet.getDataRange().getValues();
    const idMovimiento = String(form.id_movimiento);

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === idMovimiento) {
            rowIndex = i + 1;
            break;
        }
    }

    if (form.id_transaccion === 'TR-TRANSFER' || rowIndex === -1) {
        deleteTransaction(idMovimiento);
        return addManualTransaction(form, idMovimiento);
    }

    const monto = Math.abs(parseFloat(form.cantidad));
    const ajuste = form.id_transaccion === 'TR-INGRESO' ? monto : -monto;
    const fechaAFijar = form.created_time ? getMexicoISOString(form.created_time) : getMexicoISOString();

    const newValues = [
        idMovimiento,
        form.concepto,
        form.id_transaccion,
        monto,
        form.id_categoria,
        form.id_cuenta,
        fechaAFijar,
        ajuste,
        1,
        form.id_planificado || "",
        (typeof form.split_data === 'object' && form.split_data !== null) ? JSON.stringify(form.split_data) : (form.split_data || ""),
        form.excluir_presupuesto ? 1 : 0,
        form.es_por_cobrar ? 1 : 0,
        form.es_por_pagar ? 1 : 0
    ];

    sheet.getRange(rowIndex, 1, 1, newValues.length).setValues([newValues]);
    SpreadsheetApp.flush();
    return JSON.stringify({ status: "ok", id: idMovimiento });
}

function saveItem(table, idField, dataObj) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName(table);
        if (!sheet) throw new Error("Table " + table + " not found");

        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow === 0) throw new Error("Table " + table + " has no headers");

        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
        const idCol = headers.indexOf(idField);
        if (idCol === -1) throw new Error("Field " + idField + " not found in " + table);

        let rowIndex = -1;
        if (dataObj[idField] && lastRow > 1) {
            const idValues = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
            for (let i = 0; i < idValues.length; i++) {
                if (String(idValues[i][0]) === String(dataObj[idField])) {
                    rowIndex = i + 2;
                    break;
                }
            }
        }

        const newRow = headers.map(h => {
            let val = dataObj[h];
            if (typeof val === 'object' && val !== null) {
                try { return JSON.stringify(val); } catch (e) { return String(val); }
            }
            return (val === undefined || val === null) ? "" : val;
        });

        if (rowIndex === -1) {
            const newId = dataObj[idField] || (table.slice(0, 3).toUpperCase() + "-" + Utilities.getUuid().slice(0, 6).toUpperCase());
            const newIdRow = [...newRow];
            newIdRow[idCol] = newId;
            sheet.appendRow(newIdRow);
        } else {
            sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
        }

        if (table === 'planificados') {
            PropertiesService.getScriptProperties().deleteProperty('last_recurring_check');

            // Propagar cambio de categoría a todos los movimientos vinculados
            const planId = dataObj[idField];
            const newCat = dataObj['id_categoria'];
            if (planId && newCat) {
                const movSheet = ss.getSheetByName('movimientos');
                if (movSheet && movSheet.getLastRow() > 1) {
                    const movHeaders = movSheet.getRange(1, 1, 1, movSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
                    const colPlanId = movHeaders.indexOf('id_planificado');
                    const colCat = movHeaders.indexOf('id_categoria');
                    if (colPlanId > -1 && colCat > -1) {
                        const movData = movSheet.getRange(2, 1, movSheet.getLastRow() - 1, movHeaders.length).getValues();
                        for (let r = 0; r < movData.length; r++) {
                            if (String(movData[r][colPlanId]) === String(planId) && String(movData[r][colCat]) !== String(newCat)) {
                                movSheet.getRange(r + 2, colCat + 1).setValue(newCat);
                            }
                        }
                    }
                }
            }
        }

        // Invalidar caché de la API si se modifican categorías o cuentas
        if (['categorias', 'cuentas', 'planificados'].includes(table)) {
            try { CacheService.getScriptCache().remove('api_form_data'); } catch (e) { }
        }

        SpreadsheetApp.flush();
        return JSON.stringify({ status: "ok", id: dataObj[idField] || newRow[idCol] });
    } catch (err) {
        console.error("Error in saveItem (" + table + "): " + err.toString());
        return JSON.stringify({ status: "error", msg: err.toString() });
    }
}

function deleteItem(table, idField, idValue) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(table);
    const data = sheet.getDataRange().getValues();
    const idCol = data[0].indexOf(idField);
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idCol]) === String(idValue)) {
            sheet.deleteRow(i + 1);
            SpreadsheetApp.flush();
            return JSON.stringify({ status: "ok" });
        }
    }
    return JSON.stringify({ status: "error", msg: "Item not found" });
}

function deleteTransaction(idMovimiento) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('movimientos');
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === String(idMovimiento)) {
            sheet.deleteRow(i + 1);
        }
    }
    SpreadsheetApp.flush();
    return JSON.stringify({ status: "ok" });
}

function saveBudget(mes, anio, monto) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("presupuestos");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (parseInt(data[i][1]) == mes && parseInt(data[i][2]) == anio) {
            sheet.getRange(i + 1, 4).setValue(monto);
            SpreadsheetApp.flush();
            return "OK";
        }
    }
    sheet.appendRow(["PRES-" + Utilities.getUuid().slice(0, 8), mes, anio, monto]);
    SpreadsheetApp.flush();
    return "OK";
}

function ensurePlanificadosHeaders(ss) {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('planificados');
    if (!sheet) {
        sheet = ss.insertSheet('planificados');
        sheet.appendRow(["id_planificado", "nombre", "id_transaccion", "cantidad", "id_categoria", "id_cuenta", "frecuencia_num", "frecuencia_unidad", "dia_pago", "dias_notificacion", "estado", "ultimo_cobro", "id_ultimo_movimiento", "proximo_cobro", "fecha_ultima_notif", "split_data", "id_destino"]);
        return;
    }
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const required = ["id_planificado", "nombre", "id_transaccion", "cantidad", "id_categoria", "id_cuenta", "frecuencia_num", "frecuencia_unidad", "dia_pago", "dias_notificacion", "estado", "ultimo_cobro", "id_ultimo_movimiento", "proximo_cobro", "fecha_ultima_notif", "split_data", "id_destino"];
    required.forEach((colName, idx) => {
        if (!headers.includes(colName)) {
            sheet.getRange(1, Math.max(headers.length, idx) + 1).setValue(colName);
        }
    });
}

function ensureCuentasHeaders() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('cuentas');
    if (!sheet) return;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colNotif = "fecha_ultima_notif_tdc";
    if (!headers.includes(colNotif)) {
        sheet.getRange(1, headers.length + 1).setValue(colNotif);
    }
}

function ensureMovimientosHeaders() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('movimientos');
    if (!sheet) {
        sheet = ss.insertSheet('movimientos');
        sheet.appendRow(["id_movimiento", "concepto", "id_transaccion", "cantidad", "id_categoria", "id_cuenta", "created_time", "ajuste", "validado", "id_planificado", "split_data", "excluir_presupuesto", "es_por_cobrar"]);
    } else {
        const lastCol = sheet.getLastColumn();
        const headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

        if (!headers.includes("excluir_presupuesto")) {
            sheet.getRange(1, 12).setValue("excluir_presupuesto");
        }
        if (!headers.includes("es_por_cobrar")) {
            sheet.getRange(1, 13).setValue("es_por_cobrar");
        }
        if (!headers.includes("es_por_pagar")) {
            sheet.getRange(1, 14).setValue("es_por_pagar");
        }
    }
}

function applyBalanceAdjustments(adjustments) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('movimientos');
    const results = [];
    adjustments.forEach(adj => {
        const uuid = Utilities.getUuid();
        const monto = Math.abs(adj.cantidad);
        const tipo = adj.cantidad > 0 ? 'TR-INGRESO' : 'TR-GASTO';
        const ajuste = adj.cantidad;
        const fechaMexico = getMexicoISOString();
        // Concepto: Ajuste: [Cuenta]
        const concepto = `Ajuste en ${adj.cuentaNombre}`;

        sheet.appendRow([
            uuid,
            concepto,
            tipo,
            monto,
            'CAT-AUDIT',
            adj.id_cuenta,
            fechaMexico,
            ajuste,
            0,
            "",
            "",
            0,
            0,
            0
        ]);
        results.push({ id: uuid, status: 'ok' });
    });
    SpreadsheetApp.flush();
    return JSON.stringify({ status: "ok", processed: results.length });
}

/**
 * 🔍 DIAGNÓSTICO: Muestra qué haría checkRecurringTransactions SIN ejecutar nada.
 * Ejecuta desde Editor de Scripts → Ver → Registros para ver el resultado.
 */
function diagnosticoRecurrentes() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetPlan = ss.getSheetByName("planificados");
    if (!sheetPlan) return "❌ No existe la hoja planificados";

    const dataPlan = sheetPlan.getDataRange().getValues();
    const headers = dataPlan[0];
    const col = (name) => headers.indexOf(name);

    const props = PropertiesService.getScriptProperties();
    const lastCheck = props.getProperty("last_recurring_check");
    const todayStr = Utilities.formatDate(new Date(), "GMT-6", "yyyy-MM-dd");
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const report = [];
    report.push("═══════════════════════════════════════");
    report.push("  DIAGNÓSTICO DE RECURRENTES");
    report.push("═══════════════════════════════════════");
    report.push("📅 Hoy (México): " + todayStr);
    report.push("🔒 Último check: " + (lastCheck || "NUNCA"));
    report.push("⚡ ¿Se ejecutaría hoy?: " + (lastCheck === todayStr ? "NO (ya se ejecutó)" : "SÍ"));
    report.push("");
    report.push("── PLANIFICADOS ACTIVOS ──");

    let pendingCount = 0;
    let notifCount = 0;

    for (let i = 1; i < dataPlan.length; i++) {
        const row = dataPlan[i];
        const estado = String(row[col("estado")]).toUpperCase();
        const nombre = row[col("nombre")];
        const monto = row[col("cantidad")];
        const tipo = row[col("id_transaccion")];
        const freq = row[col("frecuencia_num")] + " " + row[col("frecuencia_unidad")];
        const proximoCobro = row[col("proximo_cobro")];
        const ultimoCobro = row[col("ultimo_cobro")];
        const diasNotif = row[col("dias_notificacion")] || 0;
        const splitRaw = row[col("split_data")];

        if (estado !== "ACTIVO") continue;

        let nextDate = proximoCobro ? new Date(proximoCobro) : null;
        if (!nextDate || isNaN(nextDate.getTime())) {
            report.push("  ⚠️ " + nombre + " — Fecha inválida: " + proximoCobro);
            continue;
        }
        nextDate.setHours(0, 0, 0, 0);

        const isPending = nextDate <= today;
        const diffDays = Math.round((nextDate - today) / (1000 * 60 * 60 * 24));

        let cobrosAtrasados = 0;
        if (isPending) {
            let tempDate = new Date(nextDate.getTime());
            while (tempDate <= today) {
                cobrosAtrasados++;
                tempDate = calculateNextDate(tempDate, row[col("frecuencia_num")], row[col("frecuencia_unidad")], row[col("dia_pago")]);
            }
        }

        const hasSplit = splitRaw && String(splitRaw).startsWith("{");
        const status = isPending
            ? "🔴 PENDIENTE (" + cobrosAtrasados + " cobros atrasados)"
            : "🟢 OK (faltan " + diffDays + " días)";

        report.push("");
        report.push("  📋 " + nombre);
        report.push("     Tipo: " + tipo + " | Monto: $" + monto + " | Freq: " + freq);
        report.push("     Próximo cobro: " + Utilities.formatDate(nextDate, "GMT-6", "yyyy-MM-dd"));
        report.push("     Último cobro: " + (ultimoCobro ? Utilities.formatDate(new Date(ultimoCobro), "GMT-6", "yyyy-MM-dd") : "Nunca"));
        report.push("     Split: " + (hasSplit ? "Sí" : "No") + " | Notif: " + diasNotif + " días antes");
        report.push("     Estado: " + status);

        if (isPending) pendingCount += cobrosAtrasados;

        if (!isPending && parseInt(diasNotif) > 0) {
            const fechaAviso = new Date(nextDate);
            fechaAviso.setDate(nextDate.getDate() - parseInt(diasNotif));
            fechaAviso.setHours(0, 0, 0, 0);
            if (today.toDateString() === fechaAviso.toDateString()) {
                report.push("     📧 SE ENVIARÍA NOTIFICACIÓN HOY");
                notifCount++;
            }
        }
    }

    report.push("");
    report.push("── RESUMEN ──");
    report.push("  Cobros pendientes a procesar: " + pendingCount);
    report.push("  Notificaciones a enviar: " + notifCount);
    report.push("═══════════════════════════════════════");

    const fullReport = report.join("\n");
    console.log(fullReport);
    return fullReport;
}

/**
 * 🚀 FORZAR: Ejecuta checkRecurringTransactions ignorando el flag de "ya se corrió hoy".
 * Esto REALMENTE procesa cobros pendientes y envía correos.
 */
function forzarRecurrentes() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    PropertiesService.getScriptProperties().deleteProperty("last_recurring_check");
    checkRecurringTransactions(ss, true);
    return "✅ Revisión forzada completada. Revisa la hoja movimientos.";
}
