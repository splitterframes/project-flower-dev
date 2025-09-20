# Project Flower - Database Setup

## 📋 Übersicht

Dieses Verzeichnis enthält die kompletten SQL-Dateien für die Project Flower Datenbank.

## 📁 Dateien

### `database_schema.sql` (VOLLSTÄNDIG)
- **Komplettes Schema** mit allen Tabellen, Indizes und Constraints
- **Produktionsbereit** mit optimierten Performance-Indizes
- **Alle Features** wie Aquarium, Garten, Markt, Challenges, etc.
- **Empfohlen für:** Produktion, vollständige Entwicklung

### `database_schema_minimal.sql` (MINIMAL)
- **Nur essenzielle Tabellen** für schnelles Setup
- **Reduzierte Komplexität** für Testing
- **Grundfunktionen** wie Benutzer, Sammlungen, Garten, Exhibition
- **Empfohlen für:** Entwicklung, Testing, Prototyping

### `complete_database_backup.sql` (BACKUP)
- **Original Backup** mit allen Daten
- **Enthält Produktionsdaten** (35.000+ Zeilen)
- **Nur für Referenz** oder Datenwiederherstellung

## 🚀 Setup-Anleitung

### Option 1: Neue Datenbank (Vollständig)
```bash
# PostgreSQL Datenbank erstellen
createdb project_flower

# Schema importieren
psql -d project_flower -f database_schema.sql
```

### Option 2: Neue Datenbank (Minimal)
```bash
# PostgreSQL Datenbank erstellen  
createdb project_flower_dev

# Minimales Schema importieren
psql -d project_flower_dev -f database_schema_minimal.sql
```

### Option 3: Neon Database (Cloud)
1. Gehe zu [Neon Console](https://console.neon.tech)
2. Erstelle neue Datenbank
3. Kopiere den Inhalt von `database_schema.sql`
4. Führe SQL im Neon SQL Editor aus

## 🔧 Konfiguration

### Umgebungsvariablen anpassen
```bash
# In .env Datei:
DATABASE_URL="postgresql://user:password@host:port/project_flower"
```

### Server-Konfiguration prüfen
```typescript
// In server/postgresStorage.ts ist bereits konfiguriert für:
- SSL-Verbindungen (Neon compatible)
- Retry-Logic für robuste Verbindungen
- Korrekte Tabellennamen (exhibition_frame_likes, etc.)
```

## ⚡ Performance-Optimierungen

Das Schema enthält bereits optimierte Indizes für:
- ✅ **Benutzer-Abfragen** (`idx_users_username`)
- ✅ **Sammlungs-Zugriffe** (`idx_user_butterflies_user_id`)
- ✅ **Garten-Operationen** (`idx_planted_fields_user_id`)
- ✅ **Exhibition-System** (`idx_exhibition_frame_likes_frame_id`)
- ✅ **Markt-Suchen** (`idx_market_listings_is_active`)
- ✅ **Spawning-Systeme** (`idx_sun_spawns_user_id`)

## 🐛 Fehlerbehebung

### Häufige Probleme:

**Problem:** `relation "exhibition_likes" does not exist`
- **Lösung:** Verwende das neue Schema - Tabelle heißt `exhibition_frame_likes`

**Problem:** `column "status" does not exist`
- **Lösung:** Verwende `is_active` statt `status` in `market_listings`

**Problem:** SSL-Verbindungsfehler
- **Lösung:** Schema ist bereits für Neon SSL konfiguriert

### Datenbank-Reset:
```sql
-- Alle Tabellen löschen und neu erstellen
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\i database_schema.sql
```

## 📊 Schema-Version

**Aktuelle Version:** 1.0.0
**Kompatibilität:** PostgreSQL 16.9+
**Letzte Aktualisierung:** September 2025

## 🔒 Sicherheit

- **Passwörter:** Werden mit bcrypt gehashed gespeichert
- **Demo-User:** Passwort sollte in Produktion geändert werden
- **Foreign Keys:** Alle Referenzen sind korrekt gesetzt
- **Constraints:** Unique-Constraints verhindern Duplikate

## 📝 Migration

Für Updates von alten Schemas:
```sql
-- Backup erstellen
pg_dump project_flower > backup.sql

-- Neues Schema anwenden  
\i database_schema.sql

-- Daten migrieren falls nötig
```

## 💡 Tipps

1. **Entwicklung:** Verwende `database_schema_minimal.sql`
2. **Produktion:** Verwende `database_schema.sql`
3. **Testing:** Erstelle separate Test-Datenbank
4. **Backup:** Regelmäßige Backups mit `pg_dump`

---

**Erstellt für Project Flower** 🌸🦋  
Bei Fragen oder Problemen, siehe Server-Logs oder GitHub Issues.