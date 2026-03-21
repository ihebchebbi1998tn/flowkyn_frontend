import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.resolve(process.cwd(), 'src', 'i18n');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

// Professional game translations
const gameTranslations = {
  fr: {
    'gamePlay.coffeeRoulette.decision.body': 'Vous avez exploré {{count}} sujets. Continuer avec de nouveaux sujets ou terminer cette session ?',
    'gamePlay.coffeeRoulette.decision.continue': 'Continuer',
    'gamePlay.coffeeRoulette.decision.end': 'Terminer',
    'gamePlay.coffeeRoulette.decision.hint': 'Vous pouvez terminer à tout moment — la progression sera enregistrée.',
    'gamePlay.coffeeRoulette.decision.title': 'Continuer ?',
    'gamePlay.coffeeRoulette.defaultTopic': 'Qu\'est-ce qui vous enthousiasme en ce moment ?',
    'gamePlay.coffeeRoulette.endAndClose': 'Terminer et fermer',
    'gamePlay.coffeeRoulette.nextPrompt': 'Sujet suivant',
    'gamePlay.coffeeRoulette.promptCounter': '{{current}} sur {{total}}',
    'gamePlay.coffeeRoulette.spectatorMessage': 'Les paires sont en cours d\'appairage. Vous verrez bientôt votre partenaire.',
    'gamePlay.coffeeRoulette.spectatorTitle': 'Coffee Roulette en cours',
    'gamePlay.coffeeRoulette.spin1': 'Mélange des noms…',
    'gamePlay.coffeeRoulette.spin2': 'Recherche de correspondances…',
    'gamePlay.coffeeRoulette.spin3': 'Brassage…',
    'gamePlay.coffeeRoulette.spin4': 'Presque prêt…',
    'gamePlay.coffeeRoulette.spin5': 'Appairage en cours…',
    'gamePlay.coffeeRoulette.spin6': 'Finalisation des paires…',
    'gamePlay.coffeeRoulette.spin7': 'Verrouillage…',
    'gamePlay.coffeeRoulette.spin8': 'Terminé !',
    'gamePlay.coffeeRoulette.spinning': 'Rotation…',
    'gamePlay.twoTruths.defaultStatement1': 'J\'ai vécu dans un autre pays.',
    'gamePlay.twoTruths.defaultStatement2': 'Je sais jouer d\'un instrument de musique.',
    'gamePlay.twoTruths.defaultStatement3': 'J\'ai rencontré une célébrité.',
    'gamePlay.twoTruths.findingTruth': 'À la recherche de la vérité…',
    'gamePlay.twoTruths.revealHost': 'L\'hôte révélera quand il sera prêt',
    'gamePlay.twoTruths.waitingForPresenter': 'En attente du présentateur…',
    'gamePlay.winsOfWeek.defaultPrompt': 'Partagez vos réussites de cette semaine !',
    'gamePlay.winsOfWeek.emptySubtitle': 'Aucune réussite n\'a encore été partagée.',
    'gamePlay.winsOfWeek.emptyTitle': 'Aucune réussite',
  },
  de: {
    'gamePlay.coffeeRoulette.decision.body': 'Sie haben {{count}} Themen erkundet. Möchten Sie mit neuen Themen fortfahren oder diese Sitzung beenden?',
    'gamePlay.coffeeRoulette.decision.continue': 'Fortfahren',
    'gamePlay.coffeeRoulette.decision.end': 'Beenden',
    'gamePlay.coffeeRoulette.decision.hint': 'Sie können jederzeit beenden – der Fortschritt wird gespeichert.',
    'gamePlay.coffeeRoulette.decision.title': 'Fortfahren?',
    'gamePlay.coffeeRoulette.defaultTopic': 'Worüber freust du dich gerade?',
    'gamePlay.coffeeRoulette.endAndClose': 'Beenden und schließen',
    'gamePlay.coffeeRoulette.nextPrompt': 'Nächstes Thema',
    'gamePlay.coffeeRoulette.promptCounter': '{{current}} von {{total}}',
    'gamePlay.coffeeRoulette.spectatorMessage': 'Paare werden derzeit zusammengestellt. Sie sehen Ihren Partner in Kürze.',
    'gamePlay.coffeeRoulette.spectatorTitle': 'Coffee Roulette läuft',
    'gamePlay.coffeeRoulette.spin1': 'Namen mischen…',
    'gamePlay.coffeeRoulette.spin2': 'Übereinstimmungen suchen…',
    'gamePlay.coffeeRoulette.spin3': 'Durcheinander bringen…',
    'gamePlay.coffeeRoulette.spin4': 'Gleich vorbei…',
    'gamePlay.coffeeRoulette.spin5': 'Personen werden gepaart…',
    'gamePlay.coffeeRoulette.spin6': 'Paare finalisieren…',
    'gamePlay.coffeeRoulette.spin7': 'Sperren…',
    'gamePlay.coffeeRoulette.spin8': 'Erledigt!',
    'gamePlay.coffeeRoulette.spinning': 'Dreht sich…',
    'gamePlay.twoTruths.defaultStatement1': 'Ich habe in einem anderen Land gelebt.',
    'gamePlay.twoTruths.defaultStatement2': 'Ich kann ein Musikinstrument spielen.',
    'gamePlay.twoTruths.defaultStatement3': 'Ich bin einer Berühmtheit begegnet.',
    'gamePlay.twoTruths.findingTruth': 'Wahrheit wird ermittelt…',
    'gamePlay.twoTruths.revealHost': 'Der Host wird es offenbaren, wenn er bereit ist',
    'gamePlay.twoTruths.waitingForPresenter': 'Warten auf den Moderator…',
    'gamePlay.winsOfWeek.defaultPrompt': 'Teilen Sie Ihre Erfolge dieser Woche!',
    'gamePlay.winsOfWeek.emptySubtitle': 'Noch keine Erfolge geteilt.',
    'gamePlay.winsOfWeek.emptyTitle': 'Keine Erfolge',
  },
  es: {
    'gamePlay.coffeeRoulette.decision.body': 'Has explorado {{count}} temas. ¿Continuar con nuevos temas o terminar esta sesión?',
    'gamePlay.coffeeRoulette.decision.continue': 'Continuar',
    'gamePlay.coffeeRoulette.decision.end': 'Terminar',
    'gamePlay.coffeeRoulette.decision.hint': 'Puedes terminar en cualquier momento — el progreso se guardará.',
    'gamePlay.coffeeRoulette.decision.title': '¿Continuar?',
    'gamePlay.coffeeRoulette.defaultTopic': '¿Qué te entusiasma en este momento?',
    'gamePlay.coffeeRoulette.endAndClose': 'Terminar y cerrar',
    'gamePlay.coffeeRoulette.nextPrompt': 'Siguiente tema',
    'gamePlay.coffeeRoulette.promptCounter': '{{current}} de {{total}}',
    'gamePlay.coffeeRoulette.spectatorMessage': 'Se están emparejando participantes. Verás tu pareja en breve.',
    'gamePlay.coffeeRoulette.spectatorTitle': 'Coffee Roulette en progreso',
    'gamePlay.coffeeRoulette.spin1': 'Barajando nombres…',
    'gamePlay.coffeeRoulette.spin2': 'Encontrando coincidencias…',
    'gamePlay.coffeeRoulette.spin3': 'Mezclando…',
    'gamePlay.coffeeRoulette.spin4': 'Casi listo…',
    'gamePlay.coffeeRoulette.spin5': 'Emparejando personas…',
    'gamePlay.coffeeRoulette.spin6': 'Finalizando parejas…',
    'gamePlay.coffeeRoulette.spin7': 'Bloqueando…',
    'gamePlay.coffeeRoulette.spin8': '¡Listo!',
    'gamePlay.coffeeRoulette.spinning': 'Girando…',
    'gamePlay.twoTruths.defaultStatement1': 'He vivido en otro país.',
    'gamePlay.twoTruths.defaultStatement2': 'Puedo tocar un instrumento musical.',
    'gamePlay.twoTruths.defaultStatement3': 'He conocido a una celebridad.',
    'gamePlay.twoTruths.findingTruth': 'Buscando la verdad…',
    'gamePlay.twoTruths.revealHost': 'El anfitrión revelará cuando esté listo',
    'gamePlay.twoTruths.waitingForPresenter': 'Esperando al presentador…',
    'gamePlay.winsOfWeek.defaultPrompt': '¡Comparte tus logros de esta semana!',
    'gamePlay.winsOfWeek.emptySubtitle': 'Aún no se han compartido logros.',
    'gamePlay.winsOfWeek.emptyTitle': 'Sin logros',
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
  for (const [lng, translations] of Object.entries(gameTranslations)) {
    const lngPath = path.join(LOCALES_DIR, `${lng}.json`);
    const data = readJson(lngPath);
    const flat = flattenObj(data);

    let updated = 0;
    for (const [key, value] of Object.entries(translations)) {
      if (flat[key] !== value) {
        flat[key] = value;
        updated++;
      }
    }

    if (updated > 0) {
      const unflat = unflattenObj(flat);
      writeJson(lngPath, unflat);
      console.log(`${lng}: updated ${updated} translations`);
    }
  }

  console.log('Game translations update complete');
}

main();
