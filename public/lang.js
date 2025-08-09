const LANGS = {
  fr: {
    brand: "Acme • Recrutement",
    start_title: "Pré-sélection des candidats",
    start_intro: "Ce test comporte <b>10 questions</b> à répondre par écrit (audio optionnel).",
    start_button: "Commencer le test",
    conf: "Confidentialité",
    footer: "Politique de confidentialité",
    step_prefix: "Question",
    time_prefix: "Temps écoulé",
    audio_label: "Réponse audio (optionnelle)",
    record: "🎙️ Enregistrer",
    stop: "⏹ Arrêter",
    prev: "← Précédent",
    next: "Suivant →",
    submit: "Soumettre ✅",
    sending: "Envoi en cours…",
    sent: "✅ Réponses envoyées. Merci !",
    send_fail: "❌ Échec de l’envoi :",
    id_shown: id => (id ? `ID : ${id}` : "ID non fourni"),
    questions: [
      "Présentez-vous.",
      "Pourquoi voulez-vous ce poste ?",
      "Racontez une résolution de problème.",
      "Comment gérez-vous la pression ?",
      "Parlez d’un échec et de l’apprentissage.",
      "Compétences clés que vous apportez ?",
      "Un projet dont vous êtes fier/fière ?",
      "Votre organisation au quotidien ?",
      "Ce que vous attendez du manager ?",
      "Disponibilité et prétentions ?"
    ]
  },
  en: {
    brand: "Acme • Hiring",
    start_title: "Candidate pre-screen",
    start_intro: "This test has <b>10 questions</b> (written answers, optional audio).",
    start_button: "Start the test",
    conf: "Privacy",
    footer: "Privacy policy",
    step_prefix: "Question",
    time_prefix: "Elapsed time",
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
      "Introduce yourself.",
      "Why do you want this job?",
      "Tell us about solving a problem.",
      "How do you handle pressure?",
      "A failure and what you learned.",
      "Key skills you bring?",
      "A project you’re proud of?",
      "How do you organize your day?",
      "What do you expect from a manager?",
      "Availability and salary expectations?"
    ]
  }
};
const getLang = () => localStorage.getItem("lang") || (navigator.language.startsWith("en") ? "en" : "fr");
const setLang = l => localStorage.setItem("lang", l);
