#!/usr/bin/env python3
"""
Migration script: reads 6 CSV files and generates a PostgreSQL migration SQL file.
Target: Supabase flux-web schema
User ID: b36de59f-bcfc-4499-9208-647884be0240
"""

import csv
import json
import uuid
import os
import re
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
BASE_DIR = "/Users/bernardo/NEVURA/Flux App/WebApp"
USER_ID  = "b36de59f-bcfc-4499-9208-647884be0240"
OUT_FILE = os.path.join(BASE_DIR, "migration_data.sql")

CSV = {
    "cuentas":      os.path.join(BASE_DIR, "FLUXA APP - BERNARDO PÉREZ RODRÍGUEZ - cuentas.csv"),
    "categorias":   os.path.join(BASE_DIR, "FLUXA APP - BERNARDO PÉREZ RODRÍGUEZ - categorias.csv"),
    "personas":     os.path.join(BASE_DIR, "FLUXA APP - BERNARDO PÉREZ RODRÍGUEZ - personas.csv"),
    "presupuestos": os.path.join(BASE_DIR, "FLUXA APP - BERNARDO PÉREZ RODRÍGUEZ - presupuestos.csv"),
    "planificados": os.path.join(BASE_DIR, "FLUXA APP - BERNARDO PÉREZ RODRÍGUEZ - planificados.csv"),
    "movimientos":  os.path.join(BASE_DIR, "FLUXA APP - BERNARDO PÉREZ RODRÍGUEZ - movimientos.csv"),
}

FRECUENCIA_MAP = {
    "Meses":   "mes",
    "Semanas": "semana",
    "Años":    "año",
    "Días":    "dia",
}

COLOR_MAP = {
    "MP-EFECTIVO": "COL-02",
    "MP-TDD":      "COL-01",
    "MP-TDC":      "COL-05",
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def sq(v):
    """Wrap a Python string as a SQL single-quoted literal, escaping inner quotes.
    Returns NULL (no quotes) for None / empty string."""
    if v is None or str(v).strip() == "":
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def sql_bool(v):
    """Convert a CSV boolean-ish value to SQL TRUE/FALSE."""
    if v is None:
        return "FALSE"
    s = str(v).strip().upper()
    if s in ("1", "TRUE", "YES", "T"):
        return "TRUE"
    return "FALSE"


def sql_num(v):
    """Parse a numeric string (possibly with commas) to SQL NUMERIC literal."""
    if v is None or str(v).strip() == "":
        return "NULL"
    clean = str(v).replace(",", "").strip()
    try:
        float(clean)   # validate
        return clean
    except ValueError:
        return "NULL"


def sql_jsonb(v):
    """Return a ::jsonb cast literal, or NULL if empty."""
    if v is None or str(v).strip() == "":
        return "NULL"
    # Re-parse + re-dump to normalise whitespace, then escape for SQL
    try:
        obj = json.loads(v)
        dumped = json.dumps(obj, ensure_ascii=False)
    except (json.JSONDecodeError, TypeError):
        dumped = str(v)
    return "'" + dumped.replace("'", "''") + "'::jsonb"


def parse_date(v):
    """Extract DATE part from 'YYYY-MM-DD ...' or similar strings."""
    if not v or str(v).strip() == "":
        return "NULL"
    s = str(v).strip()
    # Try YYYY-MM-DD prefix
    m = re.match(r"(\d{4}-\d{2}-\d{2})", s)
    if m:
        return "'" + m.group(1) + "'"
    return "NULL"


def parse_timestamptz(v):
    """Parse a naive datetime string and append Mexico City offset -06:00."""
    if not v or str(v).strip() == "":
        return "NULL"
    s = str(v).strip()
    # Accept 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD HH:MM'
    m = re.match(r"(\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}(:\d{2})?)", s)
    if m:
        dt = m.group(1)
        if not m.group(2):       # no seconds
            dt += ":00"
        return "'" + dt + "-06:00'"
    return "NULL"


def planificado_uuid(id_planificado):
    """Generate a stable UUID v3 from the planificado string ID."""
    # Use uuid5 (SHA-1 namespace) for stability
    ns = uuid.UUID("00000000-0000-0000-0000-000000000000")
    return str(uuid.uuid5(ns, id_planificado))


# ── Read CSVs ────────────────────────────────────────────────────────────────
cuentas      = read_csv(CSV["cuentas"])
categorias   = read_csv(CSV["categorias"])
personas     = read_csv(CSV["personas"])
presupuestos = read_csv(CSV["presupuestos"])
planificados = read_csv(CSV["planificados"])
movimientos  = read_csv(CSV["movimientos"])

print(f"Loaded: {len(cuentas)} accounts, {len(categorias)} categories, "
      f"{len(personas)} people, {len(presupuestos)} budgets, "
      f"{len(planificados)} scheduled, {len(movimientos)} transactions")

# ── Build SQL ─────────────────────────────────────────────────────────────────
lines = []
W = lines.append

W("BEGIN;")
W("")
W("-- =============================================================")
W("-- Migration: Google Sheets → Supabase flux-web")
W(f"-- User: {USER_ID}")
W(f"-- Generated: {datetime.now().isoformat(timespec='seconds')}")
W("-- =============================================================")
W("")

# ── 1. Clean up trigger-created defaults ─────────────────────────────────────
W("-- 1. Remove trigger-created defaults")
W("DELETE FROM accounts WHERE id IN ('CTA-EFE-b36de59f','CTA-TDD-b36de59f');")
W("DELETE FROM people WHERE id = 'PER-YO-b36de59f';")
W("")

# ── 2. Accounts ───────────────────────────────────────────────────────────────
W(f"-- 2. Accounts ({len(cuentas)} rows)")
W("INSERT INTO accounts (id, user_id, name, payment_method_id, color_id, payment_day, is_active, sort_order) VALUES")
account_rows = []
for i, r in enumerate(cuentas):
    id_cuenta = r["id_cuenta"].strip()
    nombre    = r["nombre"].strip()
    mp        = r["id_metodo_pago"].strip()
    dia       = r.get("dia_pago", "").strip()
    color     = COLOR_MAP.get(mp, "COL-01")

    payment_day = dia if dia else "NULL"
    row = (
        f"  ({sq(id_cuenta)}, '{USER_ID}', {sq(nombre)}, {sq(mp)}, "
        f"{sq(color)}, {payment_day}, TRUE, {i + 1})"
    )
    account_rows.append(row)

W(",\n".join(account_rows) + ";")
W("")

# ── 3. Custom categories ──────────────────────────────────────────────────────
W(f"-- 3. Custom categories ({len(categorias)} rows)")
W("INSERT INTO categories (id, user_id, name, icon_id, color_id, is_default, sort_order) VALUES")
cat_rows = []
for i, r in enumerate(categorias):
    id_cat  = r["id_categoria"].strip()
    nombre  = r["nombre"].strip()
    icon    = r.get("id_icon", "").strip()
    color   = r.get("id_color", "").strip()
    row = (
        f"  ({sq(id_cat)}, '{USER_ID}', {sq(nombre)}, "
        f"{sq(icon) if icon else 'NULL'}, "
        f"{sq(color) if color else 'NULL'}, FALSE, {i + 1})"
    )
    cat_rows.append(row)

W(",\n".join(cat_rows) + ";")
W("")

# ── 4. People (including PER-YO) ─────────────────────────────────────────────
# personas.csv has the 7 non-Yo people; we prepend PER-YO manually
W(f"-- 4. People ({len(personas) + 1} rows, including PER-YO)")
W("INSERT INTO people (id, user_id, name, is_me) VALUES")
people_rows = []
# PER-YO first
people_rows.append(f"  ('PER-YO', '{USER_ID}', 'Yo', TRUE)")
for r in personas:
    id_per  = r["id_persona"].strip()
    nombre  = r["nombre"].strip()
    people_rows.append(f"  ({sq(id_per)}, '{USER_ID}', {sq(nombre)}, FALSE)")

W(",\n".join(people_rows) + ";")
W("")

# ── 5. Budgets (skip mes=0 or año=0) ─────────────────────────────────────────
valid_budgets = [
    r for r in presupuestos
    if str(r.get("mes", "0")).strip() not in ("", "0")
    and str(r.get("año", "0")).strip() not in ("", "0")
]
W(f"-- 5. Budgets ({len(valid_budgets)} rows, {len(presupuestos)-len(valid_budgets)} base-budget rows skipped)")
W("INSERT INTO budgets (user_id, month, year, amount) VALUES")
budget_rows = []
for r in valid_budgets:
    mes   = r["mes"].strip()
    anio  = r["año"].strip()
    monto = sql_num(r["monto"])
    budget_rows.append(f"  ('{USER_ID}', {mes}, {anio}, {monto})")

W(",\n".join(budget_rows) + ";")
W("")

# ── 6. Scheduled transactions ─────────────────────────────────────────────────
W(f"-- 6. Scheduled transactions ({len(planificados)} rows)")
W("INSERT INTO scheduled_transactions")
W("  (id, user_id, name, type, amount, category_id, account_id, destination_account_id,")
W("   frequency_num, frequency_unit, payment_day, notification_days, status,")
W("   next_charge_date, last_charge_date, split_data) VALUES")
plan_rows = []
for r in planificados:
    uid          = planificado_uuid(r["id_planificado"].strip())
    nombre       = r.get("nombre", "").strip()
    tipo         = r.get("id_transaccion", "").strip()
    cantidad     = sql_num(r.get("cantidad", ""))
    id_cat       = r.get("id_categoria", "").strip()
    id_cta       = r.get("id_cuenta", "").strip()
    id_dest      = r.get("id_destino", "").strip()
    freq_num     = r.get("frecuencia_num", "").strip()
    freq_unit    = FRECUENCIA_MAP.get(r.get("frecuencia_unidad", "").strip(), r.get("frecuencia_unidad", "").strip())
    dia_pago     = r.get("dia_pago", "").strip()
    dias_notif   = r.get("dias_notificacion", "").strip()
    estado       = r.get("estado", "ACTIVO").strip()
    proximo      = parse_date(r.get("proximo_cobro", ""))
    ultimo       = parse_date(r.get("ultimo_cobro", ""))
    split        = sql_jsonb(r.get("split_data", ""))

    row = (
        f"  ('{uid}', '{USER_ID}', {sq(nombre)}, {sq(tipo)}, {cantidad}, "
        f"{sq(id_cat) if id_cat else 'NULL'}, "
        f"{sq(id_cta) if id_cta else 'NULL'}, "
        f"{sq(id_dest) if id_dest else 'NULL'}, "
        f"{freq_num if freq_num else 'NULL'}, "
        f"{sq(freq_unit) if freq_unit else 'NULL'}, "
        f"{dia_pago if dia_pago else 'NULL'}, "
        f"{dias_notif if dias_notif else 'NULL'}, "
        f"{sq(estado)}, "
        f"{proximo}, {ultimo}, "
        f"{split})"
    )
    plan_rows.append(row)

W(",\n".join(plan_rows) + ";")
W("")

# ── 7. Transactions (movimientos) ────────────────────────────────────────────
W(f"-- 7. Transactions ({len(movimientos)} rows)")
W("INSERT INTO transactions")
W("  (id, user_id, concept, type, amount, adjustment, category_id, account_id,")
W("   transaction_date, is_validated, is_receivable, is_payable, exclude_from_budget, split_data) VALUES")
mov_rows = []
for r in movimientos:
    # IDs: old movimientos used MOV-XXXXX (sequential) and later UUID strings
    old_id = r["id_movimiento"].strip()
    # Generate a stable UUID: if old_id looks like a UUID already, use it; else derive one
    uuid_pat = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
    if uuid_pat.match(old_id):
        new_id = old_id
    else:
        ns = uuid.UUID("00000000-0000-0000-0000-000000000001")
        new_id = str(uuid.uuid5(ns, old_id))

    concepto  = r.get("concepto", "").strip()
    tipo      = r.get("id_transaccion", "").strip()
    cantidad  = sql_num(r.get("cantidad", ""))
    ajuste    = sql_num(r.get("ajuste", ""))

    raw_cat = r.get("id_categoria", "").strip()
    if raw_cat in ("CAT-TRANSFER", ""):
        category_id = "NULL"
    else:
        category_id = sq(raw_cat)

    id_cta       = r.get("id_cuenta", "").strip()
    created_time = parse_timestamptz(r.get("created_time", ""))
    validado     = r.get("validado", "").strip()
    # empty validado → treat as validated (legacy rows)
    if validado == "":
        is_validated = "TRUE"
    else:
        is_validated = sql_bool(validado)

    split     = sql_jsonb(r.get("split_data", ""))
    excl      = sql_bool(r.get("excluir_presupuesto", ""))
    cobrar    = sql_bool(r.get("es_por_cobrar", ""))
    pagar     = sql_bool(r.get("es_por_pagar", ""))

    row = (
        f"  ('{new_id}', '{USER_ID}', {sq(concepto)}, {sq(tipo)}, "
        f"{cantidad}, {ajuste}, "
        f"{category_id}, {sq(id_cta) if id_cta else 'NULL'}, "
        f"{created_time}, {is_validated}, "
        f"{cobrar}, {pagar}, {excl}, {split})"
    )
    mov_rows.append(row)

W(",\n".join(mov_rows) + ";")
W("")

W("COMMIT;")
W("")

# ── Write output ─────────────────────────────────────────────────────────────
sql_text = "\n".join(lines)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(sql_text)

line_count = sql_text.count("\n") + 1
print(f"\nSQL written to: {OUT_FILE}")
print(f"Total lines: {line_count}")
print("\n--- First 50 lines ---")
for i, ln in enumerate(sql_text.splitlines()[:50], 1):
    print(f"{i:4}: {ln}")

print("\n--- Last 20 lines ---")
all_lines = sql_text.splitlines()
for i, ln in enumerate(all_lines[-20:], len(all_lines) - 19):
    print(f"{i:4}: {ln}")
