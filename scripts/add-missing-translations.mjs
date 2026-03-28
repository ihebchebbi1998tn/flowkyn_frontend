import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.resolve(process.cwd(), 'src', 'i18n');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

// Comprehensive translations for missing keys
const missingTranslations = {
  fr: {
    // Common
    'common.clearAll': 'Effacer tout',
    
    // Departments
    'departments.toast.deleteFailed': 'Échec de la suppression du département',
    'departments.toast.updated': 'Département mis à jour',
    'departmentsSelected': 'Départements sélectionnés',
    
    // Coffee Roulette Game Play
    'gamePlay.coffeeRoulette.complete.message': 'Vous avez eu une excellente conversation ! ☕',
    'gamePlay.coffeeRoulette.complete.prompts': '{{count}} sujets utilisés',
    'gamePlay.coffeeRoulette.complete.subtitle': 'Ces moments construisent de vrais liens d\'équipe.',
    'gamePlay.coffeeRoulette.error.notFound': 'Paire Coffee Roulette non trouvée',
    'gamePlay.coffeeRoulette.lobby.voiceEnabled': 'Voix activée',
    'gamePlay.coffeeRoulette.unmatched': 'Non apparié',
    
    // Game Shell
    'gamePlay.shell.back': 'Retour',
    'gamePlay.shell.userDisconnectedBadge': 'Déconnecté',
    
    // Two Truths
    'gamePlay.twoTruths.markAsLie': 'Marquer comme mensonge',
    'gamePlay.twoTruths.waitForHost': 'En attente de l\'hôte',
    'gamePlay.twoTruths.waitingForHostToStart': 'En attente du démarrage par l\'hôte…',
    
    // Wins of Week
    'gamePlay.winsOfWeek.sharing': 'Partage en cours…',
    
    // Coffee Roulette Admin - Mapping
    'games.coffeeRoulette.admin.mapping.assignDesc': 'Mappez les sujets aux questions de conversation pour cette configuration',
    'games.coffeeRoulette.admin.mapping.assignTitle': 'Mappeur de questions',
    'games.coffeeRoulette.admin.mapping.chooseQuestion': 'Choisir une question',
    'games.coffeeRoulette.admin.mapping.chooseTopic': 'Choisir un sujet',
    'games.coffeeRoulette.admin.mapping.noQuestionsAssigned': 'Aucune question assignée',
    'games.coffeeRoulette.admin.mapping.selectQuestion': 'Sélectionner une question',
    'games.coffeeRoulette.admin.mapping.selectTopic': 'Sélectionner un sujet',
    'games.coffeeRoulette.admin.mapping.subtitle': 'Choisissez quelles questions apparaissent pour chaque sujet',
    'games.coffeeRoulette.admin.mapping.title': 'Mappeur Sujet-Question',
    
    // Coffee Roulette Admin - Questions
    'games.coffeeRoulette.admin.questions.createdLabel': 'Créé',
    'games.coffeeRoulette.admin.questions.id': 'ID',
    'games.coffeeRoulette.admin.questions.noMatches': 'Aucune question trouvée',
    'games.coffeeRoulette.admin.questions.showing': 'Affichage de {{count}} questions',
    'games.coffeeRoulette.admin.questions.subtitle': 'Gérez les questions de conversation pour Coffee Roulette',
    'games.coffeeRoulette.admin.questions.title': 'Questions',
    'games.coffeeRoulette.admin.questions.updatedLabel': 'Mis à jour',
    
    // Coffee Roulette Admin - Settings
    'games.coffeeRoulette.admin.settings.advanced': 'Avancé',
    'games.coffeeRoulette.admin.settings.allowGeneral': 'Autoriser les questions générales comme secours',
    'games.coffeeRoulette.admin.settings.basicSettings': 'Paramètres de base',
    'games.coffeeRoulette.admin.settings.chatDuration': 'Durée du chat (minutes)',
    'games.coffeeRoulette.admin.settings.configurationDetails': 'Détails de configuration',
    'games.coffeeRoulette.admin.settings.configurationId': 'ID de configuration',
    'games.coffeeRoulette.admin.settings.configureDescription': 'Configurez comment Coffee Roulette apparie les participants et sélectionne les sujets',
    'games.coffeeRoulette.admin.settings.create': 'Créer une configuration',
    'games.coffeeRoulette.admin.settings.createdAt': 'Créé le',
    'games.coffeeRoulette.admin.settings.eventId': 'ID d\'événement',
    'games.coffeeRoulette.admin.settings.failedToCreate': 'Échec de la création de la configuration',
    'games.coffeeRoulette.admin.settings.failedToLoad': 'Échec du chargement de la configuration',
    'games.coffeeRoulette.admin.settings.failedToUpdate': 'Échec de la mise à jour de la configuration',
    'games.coffeeRoulette.admin.settings.gameConfiguration': 'Configuration du jeu',
    'games.coffeeRoulette.admin.settings.maxPrompts': 'Sujets maximum',
    'games.coffeeRoulette.admin.settings.questionStrategy': 'Stratégie de sélection des questions',
    'games.coffeeRoulette.admin.settings.random': 'Aléatoire - Sélection complètement aléatoire à chaque fois',
    'games.coffeeRoulette.admin.settings.reset': 'Réinitialiser',
    'games.coffeeRoulette.admin.settings.savedSuccessfully': 'Configuration enregistrée avec succès',
    'games.coffeeRoulette.admin.settings.selectionStrategies': 'Stratégies de sélection',
    'games.coffeeRoulette.admin.settings.sequential': 'Séquentiel - Rotation cyclique à travers tous les éléments',
    'games.coffeeRoulette.admin.settings.shuffleOnRepeat': 'Mélanger les sujets à la répétition',
    'games.coffeeRoulette.admin.settings.title': 'Paramètres de Coffee Roulette',
    'games.coffeeRoulette.admin.settings.topicStrategy': 'Stratégie de sélection des sujets',
    'games.coffeeRoulette.admin.settings.update': 'Mettre à jour la configuration',
    'games.coffeeRoulette.admin.settings.updatedAt': 'Mis à jour le',
    'games.coffeeRoulette.admin.settings.weighted': 'Pondéré - Basé sur les poids d\'élément et les probabilités',
    
    // Coffee Roulette Admin - Topics
    'games.coffeeRoulette.admin.topics.active': 'Actif',
    'games.coffeeRoulette.admin.topics.addTopic': 'Ajouter un sujet',
    'games.coffeeRoulette.admin.topics.createTopic': 'Créer un sujet',
    'games.coffeeRoulette.admin.topics.createdDate': 'Date de création',
    'games.coffeeRoulette.admin.topics.deleteConfirm': 'Êtes-vous certain de vouloir supprimer ce sujet ?',
    'games.coffeeRoulette.admin.topics.editTopic': 'Modifier le sujet',
    'games.coffeeRoulette.admin.topics.failedToCreate': 'Échec de la création du sujet',
    'games.coffeeRoulette.admin.topics.failedToDelete': 'Échec de la suppression du sujet',
    'games.coffeeRoulette.admin.topics.failedToLoad': 'Échec du chargement des sujets',
    'games.coffeeRoulette.admin.topics.failedToUpdate': 'Échec de la mise à jour du sujet',
    'games.coffeeRoulette.admin.topics.noTopics': 'Aucun sujet trouvé',
    'games.coffeeRoulette.admin.topics.title': 'Sujets de conversation',
    'games.coffeeRoulette.admin.topics.topicDescription': 'Description du sujet',
    'games.coffeeRoulette.admin.topics.topicIcon': 'Icône du sujet',
    'games.coffeeRoulette.admin.topics.topicTitle': 'Titre du sujet',
    'games.coffeeRoulette.admin.topics.weight': 'Poids (probabilité)',
    
    // Game Titles
    'games.coffeeRouletteTitle': 'Coffee Roulette',
    'games.comingSoon.title': 'Bientôt disponible',
    'games.strategicEscapeTitle': 'Défi d\'évasion stratégique',
    'games.twoTruthsTitle': 'Deux vérités et un mensonge',
    'games.winsOfWeekTitle': 'Réussites de la semaine',
    
    // Other
    'profileSetup.submitFailed': 'Échec de la soumission du profil',
    'strategic.actions.sessionCreated': 'Session créée',
  },
  de: {
    // Common
    'common.clearAll': 'Alles löschen',
    
    // Departments
    'departments.toast.deleteFailed': 'Abteilung konnte nicht gelöscht werden',
    'departments.toast.updated': 'Abteilung aktualisiert',
    'departmentsSelected': 'Abteilungen ausgewählt',
    
    // Coffee Roulette Game Play
    'gamePlay.coffeeRoulette.complete.message': 'Großartig verbunden! ☕',
    'gamePlay.coffeeRoulette.complete.prompts': '{{count}} Themen verwendet',
    'gamePlay.coffeeRoulette.complete.subtitle': 'Diese Momente schaffen echte Teamverbindungen.',
    'gamePlay.coffeeRoulette.error.notFound': 'Coffee-Roulette-Paar nicht gefunden',
    'gamePlay.coffeeRoulette.lobby.voiceEnabled': 'Stimme aktiviert',
    'gamePlay.coffeeRoulette.unmatched': 'Nicht gepaart',
    
    // Game Shell
    'gamePlay.shell.back': 'Zurück',
    'gamePlay.shell.userDisconnectedBadge': 'Getrennt',
    
    // Two Truths
    'gamePlay.twoTruths.markAsLie': 'Als Lüge markieren',
    'gamePlay.twoTruths.waitForHost': 'Warten auf Host',
    'gamePlay.twoTruths.waitingForHostToStart': 'Warten auf Host zum Starten…',
    
    // Wins of Week
    'gamePlay.winsOfWeek.sharing': 'Wird geteilt…',
    
    // Coffee Roulette Admin - Mapping
    'games.coffeeRoulette.admin.mapping.assignDesc': 'Weisen Sie Themen Gesprächsfragen für diese Konfiguration zu',
    'games.coffeeRoulette.admin.mapping.assignTitle': 'Fragenmapper',
    'games.coffeeRoulette.admin.mapping.chooseQuestion': 'Frage auswählen',
    'games.coffeeRoulette.admin.mapping.chooseTopic': 'Thema auswählen',
    'games.coffeeRoulette.admin.mapping.noQuestionsAssigned': 'Keine Fragen zugewiesen',
    'games.coffeeRoulette.admin.mapping.selectQuestion': 'Frage auswählen',
    'games.coffeeRoulette.admin.mapping.selectTopic': 'Thema auswählen',
    'games.coffeeRoulette.admin.mapping.subtitle': 'Wählen Sie, welche Fragen für jedes Thema angezeigt werden',
    'games.coffeeRoulette.admin.mapping.title': 'Thema-Frage-Mapper',
    
    // Coffee Roulette Admin - Questions
    'games.coffeeRoulette.admin.questions.createdLabel': 'Erstellt',
    'games.coffeeRoulette.admin.questions.id': 'ID',
    'games.coffeeRoulette.admin.questions.noMatches': 'Keine Fragen gefunden',
    'games.coffeeRoulette.admin.questions.showing': 'Zeige {{count}} Fragen',
    'games.coffeeRoulette.admin.questions.subtitle': 'Verwalten Sie Gesprächsfragen für Coffee Roulette',
    'games.coffeeRoulette.admin.questions.title': 'Fragen',
    'games.coffeeRoulette.admin.questions.updatedLabel': 'Aktualisiert',
    
    // Coffee Roulette Admin - Settings
    'games.coffeeRoulette.admin.settings.advanced': 'Erweitert',
    'games.coffeeRoulette.admin.settings.allowGeneral': 'Allgemeine Fragen als Fallback zulassen',
    'games.coffeeRoulette.admin.settings.basicSettings': 'Grundeinstellungen',
    'games.coffeeRoulette.admin.settings.chatDuration': 'Chat-Dauer (Minuten)',
    'games.coffeeRoulette.admin.settings.configurationDetails': 'Konfigurationsdetails',
    'games.coffeeRoulette.admin.settings.configurationId': 'Konfigurations-ID',
    'games.coffeeRoulette.admin.settings.configureDescription': 'Konfigurieren Sie, wie Coffee Roulette Teilnehmer paart und Themen auswählt',
    'games.coffeeRoulette.admin.settings.create': 'Konfiguration erstellen',
    'games.coffeeRoulette.admin.settings.createdAt': 'Erstellt am',
    'games.coffeeRoulette.admin.settings.eventId': 'Veranstaltungs-ID',
    'games.coffeeRoulette.admin.settings.failedToCreate': 'Konfiguration konnte nicht erstellt werden',
    'games.coffeeRoulette.admin.settings.failedToLoad': 'Konfiguration konnte nicht geladen werden',
    'games.coffeeRoulette.admin.settings.failedToUpdate': 'Konfiguration konnte nicht aktualisiert werden',
    'games.coffeeRoulette.admin.settings.gameConfiguration': 'Spielkonfiguration',
    'games.coffeeRoulette.admin.settings.maxPrompts': 'Maximale Themen',
    'games.coffeeRoulette.admin.settings.questionStrategy': 'Strategia der Fragenauswahl',
    'games.coffeeRoulette.admin.settings.random': 'Zufällig - Vollständig zufällige Auswahl jedes Mal',
    'games.coffeeRoulette.admin.settings.reset': 'Zurücksetzen',
    'games.coffeeRoulette.admin.settings.savedSuccessfully': 'Konfiguration erfolgreich gespeichert',
    'games.coffeeRoulette.admin.settings.selectionStrategies': 'Auswahlstrategien',
    'games.coffeeRoulette.admin.settings.sequential': 'Sequenziell - Rotation durch alle Elemente',
    'games.coffeeRoulette.admin.settings.shuffleOnRepeat': 'Themen beim Wiederholen mischen',
    'games.coffeeRoulette.admin.settings.title': 'Coffee-Roulette-Einstellungen',
    'games.coffeeRoulette.admin.settings.topicStrategy': 'Strategia der Themenauswahl',
    'games.coffeeRoulette.admin.settings.update': 'Konfiguration aktualisieren',
    'games.coffeeRoulette.admin.settings.updatedAt': 'Aktualisiert am',
    'games.coffeeRoulette.admin.settings.weighted': 'Gewichtet - Basierend auf Elementgewichtungen und Wahrscheinlichkeiten',
    
    // Coffee Roulette Admin - Topics
    'games.coffeeRoulette.admin.topics.active': 'Aktiv',
    'games.coffeeRoulette.admin.topics.addTopic': 'Thema hinzufügen',
    'games.coffeeRoulette.admin.topics.createTopic': 'Thema erstellen',
    'games.coffeeRoulette.admin.topics.createdDate': 'Erstellungsdatum',
    'games.coffeeRoulette.admin.topics.deleteConfirm': 'Sind Sie sicher, dass Sie dieses Thema löschen möchten?',
    'games.coffeeRoulette.admin.topics.editTopic': 'Thema bearbeiten',
    'games.coffeeRoulette.admin.topics.failedToCreate': 'Thema konnte nicht erstellt werden',
    'games.coffeeRoulette.admin.topics.failedToDelete': 'Thema konnte nicht gelöscht werden',
    'games.coffeeRoulette.admin.topics.failedToLoad': 'Themen konnten nicht geladen werden',
    'games.coffeeRoulette.admin.topics.failedToUpdate': 'Thema konnte nicht aktualisiert werden',
    'games.coffeeRoulette.admin.topics.noTopics': 'Keine Themen gefunden',
    'games.coffeeRoulette.admin.topics.title': 'Gesprächsthemen',
    'games.coffeeRoulette.admin.topics.topicDescription': 'Themenbeschreibung',
    'games.coffeeRoulette.admin.topics.topicIcon': 'Themensymbol',
    'games.coffeeRoulette.admin.topics.topicTitle': 'Thementitel',
    'games.coffeeRoulette.admin.topics.weight': 'Gewichtung (Wahrscheinlichkeit)',
    
    // Game Titles
    'games.coffeeRouletteTitle': 'Coffee Roulette',
    'games.comingSoon.title': 'Demnächst verfügbar',
    'games.strategicEscapeTitle': 'Strategic Escape Challenge',
    'games.twoTruthsTitle': 'Zwei Wahrheiten und eine Lüge',
    'games.winsOfWeekTitle': 'Erfolge der Woche',
    
    // Other
    'profileSetup.submitFailed': 'Profilübermittlung fehlgeschlagen',
    'strategic.actions.sessionCreated': 'Sitzung erstellt',
  },
  es: {
    // Common
    'common.clearAll': 'Limpiar todo',
    
    // Departments
    'departments.toast.deleteFailed': 'Error al eliminar el departamento',
    'departments.toast.updated': 'Departamento actualizado',
    'departmentsSelected': 'Departamentos seleccionados',
    
    // Coffee Roulette Game Play
    'gamePlay.coffeeRoulette.complete.message': '¡Excelente conexión! ☕',
    'gamePlay.coffeeRoulette.complete.prompts': '{{count}} temas utilizados',
    'gamePlay.coffeeRoulette.complete.subtitle': 'Estos momentos crean lazos reales del equipo.',
    'gamePlay.coffeeRoulette.error.notFound': 'Pareja de Coffee Roulette no encontrada',
    'gamePlay.coffeeRoulette.lobby.voiceEnabled': 'Voz habilitada',
    'gamePlay.coffeeRoulette.unmatched': 'Sin emparejar',
    
    // Game Shell
    'gamePlay.shell.back': 'Atrás',
    'gamePlay.shell.userDisconnectedBadge': 'Desconectado',
    
    // Two Truths
    'gamePlay.twoTruths.markAsLie': 'Marcar como mentira',
    'gamePlay.twoTruths.waitForHost': 'Esperando al anfitrión',
    'gamePlay.twoTruths.waitingForHostToStart': 'Esperando a que el anfitrión comience…',
    
    // Wins of Week
    'gamePlay.winsOfWeek.sharing': 'Compartiendo…',
    
    // Coffee Roulette Admin - Mapping
    'games.coffeeRoulette.admin.mapping.assignDesc': 'Asigne temas a preguntas de conversación para esta configuración',
    'games.coffeeRoulette.admin.mapping.assignTitle': 'Mapeador de preguntas',
    'games.coffeeRoulette.admin.mapping.chooseQuestion': 'Elegir pregunta',
    'games.coffeeRoulette.admin.mapping.chooseTopic': 'Elegir tema',
    'games.coffeeRoulette.admin.mapping.noQuestionsAssigned': 'Sin preguntas asignadas',
    'games.coffeeRoulette.admin.mapping.selectQuestion': 'Seleccionar pregunta',
    'games.coffeeRoulette.admin.mapping.selectTopic': 'Seleccionar tema',
    'games.coffeeRoulette.admin.mapping.subtitle': 'Elija qué preguntas aparecen para cada tema',
    'games.coffeeRoulette.admin.mapping.title': 'Mapeador de Tema-Pregunta',
    
    // Coffee Roulette Admin - Questions
    'games.coffeeRoulette.admin.questions.createdLabel': 'Creado',
    'games.coffeeRoulette.admin.questions.id': 'ID',
    'games.coffeeRoulette.admin.questions.noMatches': 'No se encontraron preguntas',
    'games.coffeeRoulette.admin.questions.showing': 'Mostrando {{count}} preguntas',
    'games.coffeeRoulette.admin.questions.subtitle': 'Administre preguntas de conversación para Coffee Roulette',
    'games.coffeeRoulette.admin.questions.title': 'Preguntas',
    'games.coffeeRoulette.admin.questions.updatedLabel': 'Actualizado',
    
    // Coffee Roulette Admin - Settings
    'games.coffeeRoulette.admin.settings.advanced': 'Avanzado',
    'games.coffeeRoulette.admin.settings.allowGeneral': 'Permitir preguntas generales como alternativa',
    'games.coffeeRoulette.admin.settings.basicSettings': 'Configuración básica',
    'games.coffeeRoulette.admin.settings.chatDuration': 'Duración del chat (minutos)',
    'games.coffeeRoulette.admin.settings.configurationDetails': 'Detalles de configuración',
    'games.coffeeRoulette.admin.settings.configurationId': 'ID de configuración',
    'games.coffeeRoulette.admin.settings.configureDescription': 'Configure cómo Coffee Roulette empareja participantes y selecciona temas',
    'games.coffeeRoulette.admin.settings.create': 'Crear configuración',
    'games.coffeeRoulette.admin.settings.createdAt': 'Creado el',
    'games.coffeeRoulette.admin.settings.eventId': 'ID de evento',
    'games.coffeeRoulette.admin.settings.failedToCreate': 'Error al crear la configuración',
    'games.coffeeRoulette.admin.settings.failedToLoad': 'Error al cargar la configuración',
    'games.coffeeRoulette.admin.settings.failedToUpdate': 'Error al actualizar la configuración',
    'games.coffeeRoulette.admin.settings.gameConfiguration': 'Configuración del juego',
    'games.coffeeRoulette.admin.settings.maxPrompts': 'Temas máximos',
    'games.coffeeRoulette.admin.settings.questionStrategy': 'Estrategia de selección de preguntas',
    'games.coffeeRoulette.admin.settings.random': 'Aleatorio - Selección completamente aleatoria cada vez',
    'games.coffeeRoulette.admin.settings.reset': 'Restablecer',
    'games.coffeeRoulette.admin.settings.savedSuccessfully': 'Configuración guardada exitosamente',
    'games.coffeeRoulette.admin.settings.selectionStrategies': 'Estrategias de selección',
    'games.coffeeRoulette.admin.settings.sequential': 'Secuencial - Rotación de todos los elementos',
    'games.coffeeRoulette.admin.settings.shuffleOnRepeat': 'Mezclar temas al repetir',
    'games.coffeeRoulette.admin.settings.title': 'Configuración de Coffee Roulette',
    'games.coffeeRoulette.admin.settings.topicStrategy': 'Estrategia de selección de temas',
    'games.coffeeRoulette.admin.settings.update': 'Actualizar configuración',
    'games.coffeeRoulette.admin.settings.updatedAt': 'Actualizado el',
    'games.coffeeRoulette.admin.settings.weighted': 'Ponderado - Basado en pesos de elementos y probabilidades',
    
    // Coffee Roulette Admin - Topics
    'games.coffeeRoulette.admin.topics.active': 'Activo',
    'games.coffeeRoulette.admin.topics.addTopic': 'Agregar tema',
    'games.coffeeRoulette.admin.topics.createTopic': 'Crear tema',
    'games.coffeeRoulette.admin.topics.createdDate': 'Fecha de creación',
    'games.coffeeRoulette.admin.topics.deleteConfirm': '¿Está seguro de que desea eliminar este tema?',
    'games.coffeeRoulette.admin.topics.editTopic': 'Editar tema',
    'games.coffeeRoulette.admin.topics.failedToCreate': 'Error al crear el tema',
    'games.coffeeRoulette.admin.topics.failedToDelete': 'Error al eliminar el tema',
    'games.coffeeRoulette.admin.topics.failedToLoad': 'Error al cargar los temas',
    'games.coffeeRoulette.admin.topics.failedToUpdate': 'Error al actualizar el tema',
    'games.coffeeRoulette.admin.topics.noTopics': 'No se encontraron temas',
    'games.coffeeRoulette.admin.topics.title': 'Temas de conversación',
    'games.coffeeRoulette.admin.topics.topicDescription': 'Descripción del tema',
    'games.coffeeRoulette.admin.topics.topicIcon': 'Icono del tema',
    'games.coffeeRoulette.admin.topics.topicTitle': 'Título del tema',
    'games.coffeeRoulette.admin.topics.weight': 'Peso (probabilidad)',
    
    // Game Titles
    'games.coffeeRouletteTitle': 'Coffee Roulette',
    'games.comingSoon.title': 'Próximamente',
    'games.strategicEscapeTitle': 'Strategic Escape Challenge',
    'games.twoTruthsTitle': 'Dos Verdades y una Mentira',
    'games.winsOfWeekTitle': 'Triunfos de la Semana',
    
    // Other
    'profileSetup.submitFailed': 'Error al enviar el perfil',
    'strategic.actions.sessionCreated': 'Sesión creada',
  },
};

function flattenObj(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenObj(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function unflattenObj(flat) {
  const out = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return out;
}

function main() {
  for (const [lng, translations] of Object.entries(missingTranslations)) {
    const lngPath = path.join(LOCALES_DIR, `${lng}.json`);
    const data = readJson(lngPath);
    const flat = flattenObj(data);

    let added = 0;
    for (const [key, value] of Object.entries(translations)) {
      if (!(key in flat)) {
        flat[key] = value;
        added++;
      }
    }

    if (added > 0) {
      const unflat = unflattenObj(flat);
      writeJson(lngPath, unflat);
      console.log(`${lng}: added ${added} translations`);
    }
  }

  console.log('Missing translations added');
}

main();
