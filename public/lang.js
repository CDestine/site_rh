// public/lang.js
const LANGS = {
  fr: {
    brand: "Acme • Recrutement",
    start_title: "Pré-sélection des candidats",
    start_intro: "Ce test comporte <b>10 questions</b> ...",
    start_button: "Commencer le test",
    conf: "Confidentialité",
    footer: "Politique de confidentialité",
    step_prefix: "Question",
    time_prefix: "Temps écoulé",
    written: "Réponse écrite",
    audio_label: "Réponse audio (optionnelle)",
    record: "🎙️ Enregistrer",
    stop: "⏹ Arrêter",
    prev: "← Précédent",
    next: "Suivant →",
    submit: "Soumettre ✅",
    sending: "Envoi en cours…",
    sent: "✅ Réponses envoyées. Merci !",
    send_fail: "❌ Échec de l’envoi :",
    id_shown: id => (id ? `ID: ${id}` : "ID non fourni"),
    questions: [
      "Présentez-vous en quelques lignes.",
      "Pourquoi souhaitez-vous ce poste ?",
      "Décrivez une situation où vous avez résolu un problème complexe.",
      "Comment gérez-vous la pression et les délais ?",
      "Parlez d’un échec et de ce que vous avez appris.",
      "Quelles compétences clés apportez-vous à l’équipe ?",
      "Expliquez un projet dont vous êtes fier/fière.",
      "Comment vous organisez-vous au quotidien ?",
      "Qu’attendez-vous de votre manager ?",
      "Votre disponibilité et vos prétentions ?"
    ]
  },
  en: {
    brand: "Acme • Hiring",
    start_title: "Candidate pre-screen",
    start_intro: "This test has <b>10 questions</b> ...",
    start_button: "Start",
    conf: "Privacy",
    footer: "Privacy policy",
    step_prefix: "Question",
    time_prefix: "Elapsed time",
    written: "Written answer",
    audio_label: "Audio answer (optional)",
    record: "🎙️ Record",
    stop: "⏹ Stop",
    prev: "← Previous",
    next: "Next →",
    submit: "Submit ✅",
    sending: "Submitting…",
    sent: "✅ Answers submitted. Thank you!",
    send_fail: "❌ Submit failed:",
    id_shown: id => (id ? `ID: ${id}` : "No ID"),
    questions: [
      "Introduce yourself briefly.",
      "Why do you want this role?",
      "Describe a time you solved a complex problem.",
      "How do you handle pressure and deadlines?",
      "Tell us about a failure and what you learned.",
      "Key skills you bring to the team?",
      "Explain a project you are proud of.",
      "How do you organize your day?",
      "What do you expect from your manager?",
      "Availability and salary expectations?"
    ]
  }
};

function getLang() {
  return localStorage.getItem("lang") || (navigator.language.startsWith("en") ? "en" : "fr");
}
function setLang(l) { localStorage.setItem("lang", l); }
