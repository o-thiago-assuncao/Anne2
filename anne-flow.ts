export type FlowStep =
  | { type: "bot-text"; text: string; delay?: number }
  | { type: "bot-system"; text: string; delay?: number }
  | { type: "bot-audio"; src?: string; duration?: number; delay?: number }
  | { type: "bot-image"; src: string; caption?: string; delay?: number }
  | { type: "ask-text"; key: string; placeholder?: string }
  | { type: "ask-date"; key: string; placeholder?: string }
  | { type: "ask-email"; key: string; placeholder?: string }
  | { type: "ask-choice"; key: string; options: string[] }
  | { type: "ask-button"; label: string }
  | { type: "ask-donation"; label: string };

import claire from "@/assets/testimonial-claire.jpg";
import olivia from "@/assets/testimonial-olivia.jpg";
import audio1 from "@/assets/anne-audio-1.mp3";
import audio2 from "@/assets/anne-audio-2.mp3";
import audio3 from "@/assets/anne-audio-3.mp3";
import audio4 from "@/assets/anne-audio-4.mp3";
import audio5 from "@/assets/anne-audio-5.mp3";
import audio6 from "@/assets/anne-audio-6.mp3";
import audio7 from "@/assets/anne-audio-7.mp3";

export const anneFlow: FlowStep[] = [
  // 2. Système de connexion
  { type: "bot-system", text: "Madame Anne est en train de se connecter…", delay: 600 },

  // 3-9. Ouverture
  { type: "bot-text", text: "Bonjour, mon amour ! Je suis heureuse que tu aies choisi d'écouter ton cœur et que tu m'aies retrouvée ici aujourd'hui. 🔮", delay: 1400 },
  { type: "bot-text", text: "**Quelque chose d'important va bientôt se produire dans votre vie.**", delay: 1800 },
  { type: "bot-text", text: "Dès que vous êtes entré dans cette pièce, j'ai senti que l'énergie d'un homme était très forte…", delay: 2000 },
  { type: "bot-text", text: "Il a déjà croisé votre chemin, mais quelque chose vous a empêchés de vous rencontrer à ce moment-là, et le destin le **ramène dans votre vie** 💝", delay: 2200 },
  { type: "bot-text", text: "Je m'appelle Anne et je suis devenue célèbre en 2025 en tant que médium n°1 en Europe pour réunir les âmes sœurs grâce à mes dessins.", delay: 2200 },
  { type: "bot-text", text: "**Et en seulement 2 minutes, je vais visualiser et dessiner le visage de cet homme qui pense constamment à vous, jour et nuit !**", delay: 2400 },
  { type: "bot-text", text: "Tu es sûr de vouloir savoir qui c'est ? Je dois te prévenir que ça risque de te bouleverser, voire de te faire pleurer, mais je pense que tu voudras voir… 💕✨", delay: 2400 },

  // 10. Nom
  { type: "bot-text", text: "Avant de commencer, **pourriez-vous me dire votre nom ?**", delay: 1800 },
  { type: "ask-text", key: "nom", placeholder: "Écris-le ici..." },

  // 11-12. Réponse au nom
  { type: "bot-text", text: "Incroyable, {nom}. Dès que tu m'as dit ton nom, j'ai vu apparaître l'image floue d'un homme…", delay: 1800 },
  { type: "bot-text", text: "Cela signifie que votre âme sœur est quelqu'un **qui vous est très proche, ou quelqu'un avec qui vous êtes sur le point d'interagir dans les prochains jours**🙏🔮\n\nContinuons…", delay: 2400 },

  // 13-14. Procédure + audio 1
  { type: "bot-text", text: "Mais avant de continuer, laissez-moi vous expliquer comment fonctionne la procédure afin que nous puissions commencer votre dessin.", delay: 2000 },
  { type: "bot-audio", src: audio1 },

  // 15-17. Prêt
  { type: "bot-text", text: "**Êtes-vous prêt à commencer les questions ?**", delay: 1500 },
  { type: "bot-text", text: "⚠️ N'oubliez pas : ne croisez pas les bras ni les jambes.", delay: 1600 },
  { type: "ask-button", label: "Oui, je suis prêt !" },

  // 18. Date de naissance
  { type: "bot-text", text: "Quelle est votre date de naissance ?", delay: 0 },
  { type: "ask-date", key: "naissance", placeholder: "JJ/MM/AAAA" },

  // 20. Coïncidence + signe
  { type: "bot-text", text: "Quelle coïncidence, {nom} ! Je suis aussi un **{signe}**.", delay: 1800 },

  // 21-23. Heure
  { type: "bot-text", text: "Deuxième question… **À quelle heure êtes-vous né ?**", delay: 1500 },
  { type: "bot-text", text: "(Si vous ne connaissez pas l'heure exacte, ce n'est pas grave.)", delay: 1200 },
  { type: "ask-text", key: "heure", placeholder: "Écris-le ici..." },

  // 24-27. Curiosité
  { type: "bot-text", text: "Comme c'est curieux, {nom}… Ces derniers temps, j'ai reçu plusieurs femmes du signe **{signe}** à la recherche de leur âme divine…", delay: 2000 },
  { type: "bot-text", text: "Il doit t'arriver quelque chose de spécial…", delay: 1800 },
  { type: "bot-text", text: "Dernière question :", delay: 1200 },
  { type: "bot-text", text: "**Comment va ta vie amoureuse ces derniers temps ?**", delay: 1500 },
  {
    type: "ask-choice",
    key: "amour",
    options: [
      "Je suis dans une relation sérieuse.",
      "Je fais connaissance avec quelqu'un ou je discute avec quelqu'un.",
      "Je suis célibataire pour le moment !",
    ],
  },

  // 29-31. Réaction + audio 2
  { type: "bot-text", text: "Je suis ravi de l'apprendre !", delay: 1500 },
  { type: "bot-text", text: "En général, les **{signe}** ont tendance à avoir de la chance dans leurs relations amoureuses, et vous semblez faire partie de celles-ci.", delay: 2200 },
  { type: "bot-audio", src: audio2 },

  // 32-33. Témoignages intro
  { type: "bot-text", text: "Un jour, ces femmes étaient aussi là où vous êtes, en train de me parler…", delay: 2000 },
  { type: "bot-text", text: "Et après quelque temps, ils m'ont envoyé ces photos 👇", delay: 1600 },

  // 34. Olivia
  { type: "bot-image", src: olivia, caption: "Voici **Olivia**, en moins d'un mois, elle avait déjà trouvé la personne représentée dans le dessin !" },

  // 35. Claire
  { type: "bot-image", src: claire, caption: "Et voici **Claire**. Elle m'a demandé d'être sa demoiselle d'honneur à son mariage l'année prochaine. Je suis tellement heureuse pour elle !" },

  // 36-37. Encouragement
  { type: "bot-text", text: "N'est-ce pas incroyable, {nom} ?", delay: 1800 },
  { type: "bot-text", text: "**Commençons à créer votre propre dessin ?**", delay: 1800 },

  // 38-39. CTA dessin
  { type: "bot-text", text: "Dès que vous cliquerez sur le bouton ci-dessous, je visualiserai le visage de votre âme sœur… 🔮", delay: 2200 },
  { type: "ask-button", label: "✅ OUI, JE VEUX QUE VOUS DESSINIEZ MON ÂME SŒUR !" },

  // 40. Echo informations (style système)
  { type: "bot-system", text: "{nom} …", delay: 800 },
  { type: "bot-system", text: "{signe} …", delay: 800 },
  { type: "bot-system", text: "Né le {naissance}…", delay: 800 },

  // 41-45. Concentration
  { type: "bot-text", text: "⌛ Je regarde votre thème astral…", delay: 1800 },
  { type: "bot-text", text: "❌ N'oubliez pas de ne pas croiser les bras ou les jambes.", delay: 1800 },
  { type: "bot-text", text: "Je visualise des informations très importantes concernant votre âme sœur !", delay: 2200 },
  { type: "bot-text", text: "Je vais analyser votre thème astral en profondeur.", delay: 2000 },
  { type: "bot-text", text: "Et grâce à mon don… Je vais me concentrer sur le dessin du visage que je visualise en ce moment.", delay: 2200 },

  // 46-47. Audios 3 & 4 (à uploader)
  { type: "bot-audio", src: audio3 },
  { type: "bot-audio", src: audio4 },

  // 48-49. Email
  { type: "bot-text", text: "**Quelle est la meilleure adresse e-mail à laquelle je peux t'envoyer ton dessin dès qu'il sera prêt ?**", delay: 1800 },
  { type: "ask-email", key: "email", placeholder: "Tapez votre email..." },

  // 50-52. Moment spécial + audio 5
  { type: "bot-text", text: "**{nom}**, vous êtes sur le point de vivre un moment très spécial…", delay: 2000 },
  { type: "bot-text", text: "Écoutez-moi très attentivement, mon amour :", delay: 1500 },
  { type: "bot-audio", src: audio5 },

  // 53-54. SOS + audio 6
  { type: "bot-text", text: "J'ai créé un partenariat avec **SOS Filles de Dieu**, une institution qui accueille des enfants qui souffrent de la perte de leurs parents et permet à des orphelins de grandir ensemble dans un foyer rempli d'amour.", delay: 2400 },
  { type: "bot-audio", src: audio6 },

  // 55-57. Don
  { type: "bot-text", text: "Le don est petit. La plupart des femmes contribuent **seulement 10 €**.", delay: 2000 },
  { type: "bot-text", text: "**Je vais laisser un bouton juste en dessous pour que vous puissiez faire votre don et recevoir le dessin de votre âme sœur immédiatement dans votre email.**", delay: 2400 },
  { type: "ask-donation", label: "💜 OUI ! JE VEUX AIDER LES ENFANTS ET RECEVOIR LE DESSIN DE MON ÂME SŒUR !" },

  // 59-60. Bonus + audio 7
  { type: "bot-text", text: "Dès que votre don sera confirmé, vous recevrez également par email un guide de manifestation personnalisé qui vous aidera à attirer votre âme sœur dans les jours à venir… 💜", delay: 2400 },
  { type: "bot-audio", src: audio7 },

  // 61-64. Closing
  { type: "bot-text", text: "Appuyez sur le bouton ci-dessus pour passer à l'étape suivante.", delay: 1800 },
  { type: "bot-text", text: "Souvenez-vous : votre don va directement aux enfants orphelins. Et Dieu récompense toujours les cœurs généreux.", delay: 2200 },
  { type: "bot-text", text: "Ah… et n'oubliez pas que la vision que j'ai de votre âme sœur est très claire **en ce moment.**", delay: 2200 },
  { type: "bot-text", text: "Mais **je ne peux garder cette image que pendant les 10 prochaines minutes**, avant qu'elle ne commence à s'effacer et que je perde les détails qui rendent cette personne unique pour vous.", delay: 2400 },
];
