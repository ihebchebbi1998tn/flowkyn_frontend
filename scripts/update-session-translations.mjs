#!/usr/bin/env node

/**
 * Update session translations for FR, DE, ES
 * This script fills in missing session translations based on English source
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const i18nDir = path.join(__dirname, '../src/i18n');

// Professional translations for each language
const translations = {
  fr: {
    session: {
      duration: "Durée",
      participants: "Participants",
      messages: "Messages",
      actions: "Actions",
      close: "Fermer la session",
      delete: "Supprimer la session",
      export: "Exporter",
      active: "Actif",
      guest: "Invité",
      joined: "Rejoint",
      left: "Parti",
      interactions: "Interactions",
      noParticipants: "Pas de participants pour le moment",
      noMessages: "Pas de messages pour le moment",
      noActions: "Aucune action pour le moment",
      noTimeline: "Aucun événement pour le moment",
      loadMore: "Charger plus",
      participant: "Participant",
      action: "Action",
      timestamp: "Horodatage",
      payload: "Détails",
      round: "Manche",
      started: "Commencé",
      ended: "Terminé",
      createdAt: "Créé",
      updatedAt: "Mis à jour",
      sessionNotFound: "Session non trouvée",
      roundCompleted: "Manches complétées",
      activeParticipants: "Actifs",
      completedParticipants: "Terminés",
      sessionId: "ID de la session",
      eventTitle: "Événement",
      gameName: "Jeu",
      gameType: "Type de jeu",
      currentRound: "Manche actuelle",
      totalRounds: "Nombre total de manches",
      gameStatus: "Statut",
      closeConfirm: {
        title: "Fermer la session ?",
        description: "Cela mettra fin à la session pour tous les participants. Cette action ne peut pas être annulée."
      },
      deleteConfirm: {
        title: "Supprimer la session ?",
        description: "Cela supprimera définitivement la session et anonymisera tous les messages. Cette action ne peut pas être annulée."
      },
      timeline: {
        joined: "{{name}} a rejoint",
        left: "{{name}} a quitté",
        roundStarted: "La manche {{number}} a commencé",
        roundEnded: "La manche {{number}} s'est terminée",
        action: "{{name}} a effectué {{action}}"
      },
      exportSuccess: "Données de session exportées avec succès",
      closedSuccess: "Session fermée avec succès",
      deletedSuccess: "Session supprimée avec succès"
    }
  },
  de: {
    session: {
      duration: "Dauer",
      participants: "Teilnehmer",
      messages: "Nachrichten",
      actions: "Aktionen",
      close: "Sitzung beenden",
      delete: "Sitzung löschen",
      export: "Exportieren",
      active: "Aktiv",
      guest: "Gast",
      joined: "Beigetreten",
      left: "Verlassen",
      interactions: "Interaktionen",
      noParticipants: "Keine Teilnehmer vorhanden",
      noMessages: "Keine Nachrichten vorhanden",
      noActions: "Keine Aktionen vorhanden",
      noTimeline: "Keine Ereignisse vorhanden",
      loadMore: "Mehr laden",
      participant: "Teilnehmer",
      action: "Aktion",
      timestamp: "Zeitstempel",
      payload: "Details",
      round: "Runde",
      started: "Gestartet",
      ended: "Beendet",
      createdAt: "Erstellt",
      updatedAt: "Aktualisiert",
      sessionNotFound: "Sitzung nicht gefunden",
      roundCompleted: "Runden abgeschlossen",
      activeParticipants: "Aktiv",
      completedParticipants: "Abgeschlossen",
      sessionId: "Sitzungs-ID",
      eventTitle: "Ereignis",
      gameName: "Spiel",
      gameType: "Spieltyp",
      currentRound: "Aktuelle Runde",
      totalRounds: "Gesamte Runden",
      gameStatus: "Status",
      closeConfirm: {
        title: "Sitzung beenden?",
        description: "Dies beendet die Sitzung für alle Teilnehmer. Diese Aktion kann nicht rückgängig gemacht werden."
      },
      deleteConfirm: {
        title: "Sitzung löschen?",
        description: "Dies löscht die Sitzung dauerhaft und anonymisiert alle Nachrichten. Diese Aktion kann nicht rückgängig gemacht werden."
      },
      timeline: {
        joined: "{{name}} ist beigetreten",
        left: "{{name}} hat verlassen",
        roundStarted: "Runde {{number}} gestartet",
        roundEnded: "Runde {{number}} beendet",
        action: "{{name}} hat {{action}} ausgeführt"
      },
      exportSuccess: "Sitzungsdaten erfolgreich exportiert",
      closedSuccess: "Sitzung erfolgreich beendet",
      deletedSuccess: "Sitzung erfolgreich gelöscht"
    }
  },
  es: {
    session: {
      duration: "Duración",
      participants: "Participantes",
      messages: "Mensajes",
      actions: "Acciones",
      close: "Cerrar sesión",
      delete: "Eliminar sesión",
      export: "Exportar",
      active: "Activo",
      guest: "Invitado",
      joined: "Se unió",
      left: "Se fue",
      interactions: "Interacciones",
      noParticipants: "Sin participantes por ahora",
      noMessages: "Sin mensajes por ahora",
      noActions: "Sin acciones por ahora",
      noTimeline: "Sin eventos por ahora",
      loadMore: "Cargar más",
      participant: "Participante",
      action: "Acción",
      timestamp: "Marca de tiempo",
      payload: "Detalles",
      round: "Ronda",
      started: "Iniciado",
      ended: "Finalizado",
      createdAt: "Creado",
      updatedAt: "Actualizado",
      sessionNotFound: "Sesión no encontrada",
      roundCompleted: "Rondas completadas",
      activeParticipants: "Activos",
      completedParticipants: "Completados",
      sessionId: "ID de sesión",
      eventTitle: "Evento",
      gameName: "Juego",
      gameType: "Tipo de juego",
      currentRound: "Ronda actual",
      totalRounds: "Total de rondas",
      gameStatus: "Estado",
      closeConfirm: {
        title: "¿Cerrar sesión?",
        description: "Esto finalizará la sesión para todos los participantes. Esta acción no se puede deshacer."
      },
      deleteConfirm: {
        title: "¿Eliminar sesión?",
        description: "Esto eliminará permanentemente la sesión y anonimizará todos los mensajes. Esta acción no se puede deshacer."
      },
      timeline: {
        joined: "{{name}} se unió",
        left: "{{name}} se fue",
        roundStarted: "Ronda {{number}} iniciada",
        roundEnded: "Ronda {{number}} finalizada",
        action: "{{name}} realizó {{action}}"
      },
      exportSuccess: "Datos de sesión exportados correctamente",
      closedSuccess: "Sesión cerrada correctamente",
      deletedSuccess: "Sesión eliminada correctamente"
    }
  }
};

Object.entries(translations).forEach(([lang, updates]) => {
  const filePath = path.join(i18nDir, `${lang}.json`);

  // Read existing file
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Deep merge session translations
  if (!data.session) {
    data.session = {};
  }

  Object.entries(updates.session).forEach(([key, value]) => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (!data.session[key]) {
        data.session[key] = {};
      }
      Object.assign(data.session[key], value);
    } else {
      data.session[key] = value;
    }
  });

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${lang}.json with session translations`);
});

console.log('\n✅ All session translations updated successfully!');
