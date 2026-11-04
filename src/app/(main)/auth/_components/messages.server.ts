import "server-only";

import { defineMessages, type Locale, type MessageBundle, type PageMeta } from "@/core/i18n";

import { type AuthMessages, type AuthPage, authMessageKey } from "./messages";

const en: AuthMessages = {
  meta: {
    loginV1: {
      title: "Open source split-screen login page with shadcn/ui",
      description:
        "Explore an open source split-screen login page with email and password fields, social sign-in, and a registration link.",
    },
    loginV2: {
      title: "Open source branded login page with shadcn/ui",
      description:
        "Explore an open source branded login page with a two-column layout, social sign-in, and email and password fields.",
    },
    registerV1: {
      title: "Open source split-screen registration page with shadcn/ui",
      description:
        "Explore an open source split-screen registration page with account details, social sign-up, and a login link.",
    },
    registerV2: {
      title: "Open source branded registration page with shadcn/ui",
      description:
        "Explore an open source branded registration page with a two-column layout, social sign-up, and account details.",
    },
  },
  fields: {
    email: "Email address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "••••••••",
    confirmPassword: "Confirm password",
    remember: "Remember me for 30 days",
  },
  actions: {
    login: "Log in",
    register: "Register",
  },
  validation: {
    emailInvalid: "Enter a valid email address.",
    passwordTooShort: "The password must be at least {min} characters long.",
    confirmTooShort: "The password confirmation must be at least {min} characters long.",
    passwordsMismatch: "The passwords do not match.",
  },
  notConnected: {
    login: "Sign-in is not connected in the demo.",
    register: "Registration is not connected in the demo.",
  },
  loginV1: {
    panelTitle: "Hello again",
    panelSubtitle: "Log in to continue",
    title: "Log in",
    description: "Welcome back. Enter your email and password, and let’s hope you remember them this time.",
    noAccount: "Don’t have an account?",
  },
  registerV1: {
    panelTitle: "Welcome",
    panelSubtitle: "You’re in the right place.",
    title: "Register",
    description: "Fill in your details below. We promise not to quiz you about your first pet’s name (this time).",
    haveAccount: "Already have an account?",
  },
  loginV2: {
    title: "Log in to your account",
    subtitle: "Please enter your details to log in.",
    noAccount: "Don’t have an account?",
  },
  registerV2: {
    title: "Create your account",
    subtitle: "Please enter your details to register.",
    haveAccount: "Already have an account?",
  },
  brand: {
    tagline: "Design. Build. Launch. Repeat.",
    launchTitle: "Ready to launch?",
    launchText: "Clone the repo, install dependencies, and your dashboard is live in minutes.",
    helpTitle: "Need help?",
    helpText: "Check out the docs or open an issue on GitHub, community support is just a click away.",
  },
};

const es: AuthMessages = {
  meta: {
    loginV1: {
      title: "Página de inicio de sesión de código abierto a pantalla dividida con shadcn/ui",
      description:
        "Explora una página de inicio de sesión de código abierto a pantalla dividida, con correo y contraseña, acceso social y enlace de registro.",
    },
    loginV2: {
      title: "Página de inicio de sesión de código abierto con marca, con shadcn/ui",
      description:
        "Explora una página de inicio de sesión de código abierto con marca, de dos columnas, con acceso social y campos de correo y contraseña.",
    },
    registerV1: {
      title: "Página de registro de código abierto a pantalla dividida con shadcn/ui",
      description:
        "Explora una página de registro de código abierto a pantalla dividida, con datos de la cuenta, registro social y enlace de inicio de sesión.",
    },
    registerV2: {
      title: "Página de registro de código abierto con marca, con shadcn/ui",
      description:
        "Explora una página de registro de código abierto con marca, de dos columnas, con registro social y datos de la cuenta.",
    },
  },
  fields: {
    email: "Correo electrónico",
    emailPlaceholder: "tu@example.com",
    password: "Contraseña",
    passwordPlaceholder: "••••••••",
    confirmPassword: "Confirmar contraseña",
    remember: "Recordarme durante 30 días",
  },
  actions: {
    login: "Iniciar sesión",
    register: "Registrarse",
  },
  validation: {
    emailInvalid: "Introduce un correo electrónico válido.",
    passwordTooShort: "La contraseña debe tener al menos {min} caracteres.",
    confirmTooShort: "La confirmación de la contraseña debe tener al menos {min} caracteres.",
    passwordsMismatch: "Las contraseñas no coinciden.",
  },
  notConnected: {
    login: "El inicio de sesión no está conectado en la demo.",
    register: "El registro no está conectado en la demo.",
  },
  loginV1: {
    panelTitle: "Hola de nuevo",
    panelSubtitle: "Inicia sesión para continuar",
    title: "Iniciar sesión",
    description: "Te damos la bienvenida. Introduce tu correo y tu contraseña, a ver si esta vez te acuerdas.",
    noAccount: "¿No tienes cuenta?",
  },
  registerV1: {
    panelTitle: "Te damos la bienvenida",
    panelSubtitle: "Estás en el lugar indicado.",
    title: "Registrarse",
    description:
      "Rellena tus datos a continuación. Prometemos no preguntarte el nombre de tu primera mascota (esta vez).",
    haveAccount: "¿Ya tienes cuenta?",
  },
  loginV2: {
    title: "Inicia sesión en tu cuenta",
    subtitle: "Introduce tus datos para iniciar sesión.",
    noAccount: "¿No tienes cuenta?",
  },
  registerV2: {
    title: "Crea tu cuenta",
    subtitle: "Introduce tus datos para registrarte.",
    haveAccount: "¿Ya tienes cuenta?",
  },
  brand: {
    tagline: "Diseña. Construye. Lanza. Repite.",
    launchTitle: "¿Listo para lanzar?",
    launchText: "Clona el repositorio, instala las dependencias y tendrás tu panel en marcha en minutos.",
    helpTitle: "¿Necesitas ayuda?",
    helpText: "Consulta la documentación o abre una incidencia en GitHub: la ayuda de la comunidad está a un clic.",
  },
};

const de: AuthMessages = {
  meta: {
    loginV1: {
      title: "Open-Source-Anmeldeseite mit geteiltem Bildschirm und shadcn/ui",
      description:
        "Entdecke eine Open-Source-Anmeldeseite mit geteiltem Bildschirm, E-Mail- und Passwortfeldern, Social-Login und Link zur Registrierung.",
    },
    loginV2: {
      title: "Open-Source-Anmeldeseite im Markendesign mit shadcn/ui",
      description:
        "Entdecke eine Open-Source-Anmeldeseite im Markendesign mit zwei Spalten, Social-Login sowie E-Mail- und Passwortfeldern.",
    },
    registerV1: {
      title: "Open-Source-Registrierungsseite mit geteiltem Bildschirm und shadcn/ui",
      description:
        "Entdecke eine Open-Source-Registrierungsseite mit geteiltem Bildschirm, Kontodaten, Social-Registrierung und Link zur Anmeldung.",
    },
    registerV2: {
      title: "Open-Source-Registrierungsseite im Markendesign mit shadcn/ui",
      description:
        "Entdecke eine Open-Source-Registrierungsseite im Markendesign mit zwei Spalten, Social-Registrierung und Kontodaten.",
    },
  },
  fields: {
    email: "E-Mail-Adresse",
    emailPlaceholder: "du@example.com",
    password: "Passwort",
    passwordPlaceholder: "••••••••",
    confirmPassword: "Passwort bestätigen",
    remember: "30 Tage angemeldet bleiben",
  },
  actions: {
    login: "Anmelden",
    register: "Registrieren",
  },
  validation: {
    emailInvalid: "Gib eine gültige E-Mail-Adresse ein.",
    passwordTooShort: "Das Passwort muss mindestens {min} Zeichen lang sein.",
    confirmTooShort: "Die Passwortbestätigung muss mindestens {min} Zeichen lang sein.",
    passwordsMismatch: "Die Passwörter stimmen nicht überein.",
  },
  notConnected: {
    login: "Die Anmeldung ist in der Demo nicht angebunden.",
    register: "Die Registrierung ist in der Demo nicht angebunden.",
  },
  loginV1: {
    panelTitle: "Schön, dich wiederzusehen",
    panelSubtitle: "Melde dich an, um fortzufahren",
    title: "Anmelden",
    description:
      "Willkommen zurück. Gib deine E-Mail-Adresse und dein Passwort ein – hoffentlich weißt du sie diesmal noch.",
    noAccount: "Du hast noch kein Konto?",
  },
  registerV1: {
    panelTitle: "Willkommen",
    panelSubtitle: "Hier bist du richtig.",
    title: "Registrieren",
    description:
      "Trage unten deine Daten ein. Wir versprechen, dich diesmal nicht nach dem Namen deines ersten Haustiers zu fragen.",
    haveAccount: "Du hast schon ein Konto?",
  },
  loginV2: {
    title: "Melde dich bei deinem Konto an",
    subtitle: "Gib deine Daten ein, um dich anzumelden.",
    noAccount: "Du hast noch kein Konto?",
  },
  registerV2: {
    title: "Erstelle dein Konto",
    subtitle: "Gib deine Daten ein, um dich zu registrieren.",
    haveAccount: "Du hast schon ein Konto?",
  },
  brand: {
    tagline: "Gestalten. Bauen. Starten. Wiederholen.",
    launchTitle: "Bereit für den Start?",
    launchText: "Repository klonen, Abhängigkeiten installieren – und dein Dashboard ist in wenigen Minuten live.",
    helpTitle: "Brauchst du Hilfe?",
    helpText: "Schau in die Dokumentation oder eröffne ein Issue auf GitHub – die Community hilft dir mit einem Klick.",
  },
};

const fr: AuthMessages = {
  meta: {
    loginV1: {
      title: "Page de connexion open source en écran partagé avec shadcn/ui",
      description:
        "Découvrez une page de connexion open source en écran partagé, avec adresse e-mail, mot de passe, connexion sociale et lien d’inscription.",
    },
    loginV2: {
      title: "Page de connexion open source aux couleurs de la marque avec shadcn/ui",
      description:
        "Découvrez une page de connexion open source aux couleurs de la marque, sur deux colonnes, avec connexion sociale, adresse e-mail et mot de passe.",
    },
    registerV1: {
      title: "Page d’inscription open source en écran partagé avec shadcn/ui",
      description:
        "Découvrez une page d’inscription open source en écran partagé, avec les informations du compte, inscription sociale et lien de connexion.",
    },
    registerV2: {
      title: "Page d’inscription open source aux couleurs de la marque avec shadcn/ui",
      description:
        "Découvrez une page d’inscription open source aux couleurs de la marque, sur deux colonnes, avec inscription sociale et informations du compte.",
    },
  },
  fields: {
    email: "Adresse e-mail",
    emailPlaceholder: "vous@example.com",
    password: "Mot de passe",
    passwordPlaceholder: "••••••••",
    confirmPassword: "Confirmer le mot de passe",
    remember: "Se souvenir de moi pendant 30 jours",
  },
  actions: {
    login: "Se connecter",
    register: "S’inscrire",
  },
  validation: {
    emailInvalid: "Saisissez une adresse e-mail valide.",
    passwordTooShort: "Le mot de passe doit contenir au moins {min} caractères.",
    confirmTooShort: "La confirmation du mot de passe doit contenir au moins {min} caractères.",
    passwordsMismatch: "Les mots de passe ne correspondent pas.",
  },
  notConnected: {
    login: "La connexion n’est pas activée dans la démo.",
    register: "L’inscription n’est pas activée dans la démo.",
  },
  loginV1: {
    panelTitle: "Content de vous revoir",
    panelSubtitle: "Connectez-vous pour continuer",
    title: "Se connecter",
    description:
      "Bon retour. Saisissez votre adresse e-mail et votre mot de passe, en espérant que vous vous en souveniez cette fois.",
    noAccount: "Vous n’avez pas encore de compte ?",
  },
  registerV1: {
    panelTitle: "Bienvenue",
    panelSubtitle: "Vous êtes au bon endroit.",
    title: "S’inscrire",
    description:
      "Renseignez vos informations ci-dessous. Promis, nous ne vous demanderons pas le nom de votre premier animal (pour cette fois).",
    haveAccount: "Vous avez déjà un compte ?",
  },
  loginV2: {
    title: "Connectez-vous à votre compte",
    subtitle: "Saisissez vos informations pour vous connecter.",
    noAccount: "Vous n’avez pas encore de compte ?",
  },
  registerV2: {
    title: "Créez votre compte",
    subtitle: "Saisissez vos informations pour vous inscrire.",
    haveAccount: "Vous avez déjà un compte ?",
  },
  brand: {
    tagline: "Concevez. Construisez. Lancez. Recommencez.",
    launchTitle: "Prêt à vous lancer ?",
    launchText: "Clonez le dépôt, installez les dépendances et votre tableau de bord est en ligne en quelques minutes.",
    helpTitle: "Besoin d’aide ?",
    helpText: "Consultez la documentation ou ouvrez un ticket sur GitHub : l’aide de la communauté est à un clic.",
  },
};

export const authMessages = defineMessages<AuthMessages>({ en, es, de, fr });

export const authBundle: MessageBundle<AuthMessages> = { key: authMessageKey, dictionary: authMessages };

/** `pageMetadata` reads one `meta` per dictionary; this picks the page's own from each locale. */
export function authPageMeta(page: AuthPage): Readonly<Record<Locale, { readonly meta: PageMeta }>> {
  return {
    en: { meta: en.meta[page] },
    es: { meta: es.meta[page] },
    de: { meta: de.meta[page] },
    fr: { meta: fr.meta[page] },
  };
}
