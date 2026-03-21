import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const LANGUAGE_KEY = 'appLanguage';

const translations = {
  en: {
    home: 'Home',
    explore: 'Attractions',
    bookings: 'Bookings',
    chatbot: 'Chatbot',
    profile: 'Profile',
    live: 'Live',
    app_name: 'Explore Kenya',
    welcome_title: 'Discover parks, wildlife, culture, and travel support in one app.',
    welcome_copy:
      'Search attractions, view wildlife information, navigate to destinations, manage bookings, and get travel assistance from the chatbot.',
    traveler: 'Traveler',
    home_hero_title: 'Your Kenya travel hub for stays, sightings, routes, and ready-to-book escapes.',
    home_hero_copy:
      'Start with featured destinations, jump into wildlife learning, ask the assistant for planning help, and move from inspiration to navigation in a few taps.',
    home_ready_label: 'Ready for',
    home_primary_cta: 'Open Explore',
    home_destinations_label: 'Active destinations',
    home_categories_label: 'Spotlight themes',
    home_route_ready_label: 'Route-ready stops',
    home_banner_title: 'Build today\'s adventure faster.',
    home_banner_copy: 'Browse the full attraction catalog, compare destination types, and open detailed pages for maps and bookings.',
    home_category_spotlight: 'Category Spotlight',
    home_category_copy: 'See what kinds of Kenyan experiences are standing out most in the app right now.',
    home_places_suffix: 'places',
    home_featured_copy: 'Hand-picked destinations to start with before you dive deeper into the full catalog.',
    home_view_destination: 'View destination',
    home_trip_flow_title: 'Trip Flow',
    home_trip_flow_copy: 'A simple path from discovery to movement so the landing page helps you act, not just browse.',
    home_trip_step_one: 'Open a destination that matches your mood, season, or travel style.',
    home_trip_step_two: 'Use the chatbot, wildlife hub, and attraction details to plan with confidence.',
    home_trip_step_three: 'Launch navigation or booking when you are ready to move.',
    featured_attractions: 'Featured Attractions',
    featured_copy: 'Browse a few highlighted destinations, then open the full explore screen for search and filters.',
    explore_all: 'Explore all attractions',
    wildlife_library: 'Wildlife Library',
    wildlife_copy: 'Learn about iconic species, habitats, and conservation efforts.',
    open_wildlife: 'Open Wildlife',
    live_experiences: 'Live Experiences',
    live_copy: 'Open curated wildlife streams and scenic video experiences.',
    open_live: 'Open Live',
    assistant_title: 'Travel Assistant',
    assistant_copy: 'Ask for park tips, safety guidance, and planning advice.',
    open_chatbot: 'Open Chatbot',
    no_attractions: 'No attractions available yet.',
    loading: 'Loading...',
    login_title: 'Welcome Back',
    login_copy: 'Sign in to continue planning your next Kenyan adventure.',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    forgot_password: 'Forgot password?',
    no_account: "Don't have an account? Register",
    register_title: 'Create Your Account',
    register_copy: 'Join Explore Kenya to manage trips, bookings, and destination plans.',
    full_name: 'Full Name',
    phone_number: 'Phone Number',
    register: 'Register',
    already_have_account: 'Already have an account? Login',
    forgot_title: 'Reset Your Password',
    forgot_copy: 'Enter your email to generate a secure reset code.',
    request_code: 'Request Reset Code',
    reset_title: 'Enter Reset Code',
    reset_copy: 'Use the reset code and choose a new password.',
    reset_code: 'Reset Code',
    new_password: 'New Password',
    confirm_password: 'Confirm Password',
    reset_password: 'Reset Password',
    profile_title: 'Profile Management',
    profile_copy: 'Update your account details, interests, and preferred app language.',
    save_profile: 'Save Profile',
    language: 'Language',
    interests: 'Travel Interests',
    logout: 'Logout',
    role: 'Role',
    explore_title: 'Tourist Attractions',
    explore_copy: 'Search by name, filter by category, and open a destination to view details, maps, and bookings.',
    search_placeholder: 'Search attractions or cultural sites',
    all_categories: 'All',
    wildlife_title: 'Wildlife & Conservation',
    wildlife_copy_2: 'Explore species profiles, habitats, and conservation notes.',
    chatbot_title: 'Tourist Assistance Chatbot',
    chatbot_copy:
      'Ask about safari planning, safety guidance, park visits, or payment support. The chatbot uses a MongoDB-backed knowledge base.',
    type_message: 'Ask a question',
    send: 'Send',
    faq: 'Suggested Questions',
    profile_saved: 'Your profile was updated successfully.',
    reset_code_generated: 'Reset code generated.',
    use_code_now: 'Use this code now',
    reset_success: 'Password reset successful.',
    settings: 'Settings',
    guest: 'Guest',
    language_saved: 'Language updated.',
  },
  sw: {
    home: 'Nyumbani',
    explore: 'Vivutio',
    bookings: 'Uhifadhi',
    chatbot: 'Msaidizi',
    profile: 'Wasifu',
    live: 'Moja kwa Moja',
    app_name: 'Explore Kenya',
    welcome_title: 'Gundua mbuga, wanyamapori, tamaduni na msaada wa safari katika programu moja.',
    welcome_copy:
      'Tafuta vivutio, angalia taarifa za wanyamapori, elekezwa kwenye maeneo, dhibiti uhifadhi, na upate msaada wa safari kutoka kwa chatbot.',
    traveler: 'Msafiri',
    home_hero_title: 'Kituo chako cha safari za Kenya kwa mapumziko, kuona wanyama, njia, na maeneo ya kuhifadhi.',
    home_hero_copy:
      'Anza na maeneo yaliyochaguliwa, ingia kwenye maudhui ya wanyamapori, muulize msaidizi kuhusu mipango, na utoke kwenye hamasa hadi urambazaji kwa mibofyo michache.',
    home_ready_label: 'Tayari kwa',
    home_primary_cta: 'Fungua Vivutio',
    home_destinations_label: 'Maeneo yanayopatikana',
    home_categories_label: 'Mada zinazoongoza',
    home_route_ready_label: 'Maeneo yenye njia',
    home_banner_title: 'Panga safari ya leo kwa haraka.',
    home_banner_copy: 'Tazama orodha yote ya vivutio, linganisha aina za maeneo, na fungua kurasa za kina kwa ramani na uhifadhi.',
    home_category_spotlight: 'Mwangaza wa Makundi',
    home_category_copy: 'Angalia aina za uzoefu wa Kenya zinazojitokeza zaidi ndani ya programu kwa sasa.',
    home_places_suffix: 'maeneo',
    home_featured_copy: 'Maeneo machache yaliyopendekezwa ili uanze kabla ya kuingia kwenye orodha nzima.',
    home_view_destination: 'Fungua eneo',
    home_trip_flow_title: 'Mtiririko wa Safari',
    home_trip_flow_copy: 'Njia rahisi kutoka ugunduzi hadi hatua ili ukurasa wa mwanzo usaide kuchukua hatua, si kutazama tu.',
    home_trip_step_one: 'Fungua eneo linalolingana na hamu yako, msimu, au aina ya safari.',
    home_trip_step_two: 'Tumia chatbot, maktaba ya wanyamapori, na maelezo ya vivutio kupanga kwa uhakika.',
    home_trip_step_three: 'Anzisha urambazaji au uhifadhi ukiwa tayari kusonga.',
    featured_attractions: 'Vivutio Vilivyochaguliwa',
    featured_copy: 'Angalia maeneo machache muhimu kisha fungua ukurasa wa vivutio kwa utafutaji na uchujaji.',
    explore_all: 'Fungua vivutio vyote',
    wildlife_library: 'Maktaba ya Wanyamapori',
    wildlife_copy: 'Jifunze kuhusu spishi maarufu, makazi yao, na juhudi za uhifadhi.',
    open_wildlife: 'Fungua Wanyamapori',
    live_experiences: 'Matukio ya Moja kwa Moja',
    live_copy: 'Fungua video za moja kwa moja za wanyamapori na mandhari.',
    open_live: 'Fungua Live',
    assistant_title: 'Msaidizi wa Safari',
    assistant_copy: 'Uliza kuhusu hifadhi, usalama, na ushauri wa kupanga safari.',
    open_chatbot: 'Fungua Chatbot',
    no_attractions: 'Hakuna vivutio kwa sasa.',
    loading: 'Inapakia...',
    login_title: 'Karibu Tena',
    login_copy: 'Ingia ili uendelee kupanga safari yako ijayo nchini Kenya.',
    email: 'Barua pepe',
    password: 'Nenosiri',
    login: 'Ingia',
    forgot_password: 'Umesahau nenosiri?',
    no_account: 'Huna akaunti? Jisajili',
    register_title: 'Tengeneza Akaunti',
    register_copy: 'Jiunge na Explore Kenya kusimamia safari, uhifadhi, na mipango ya maeneo.',
    full_name: 'Jina Kamili',
    phone_number: 'Namba ya Simu',
    register: 'Jisajili',
    already_have_account: 'Una akaunti tayari? Ingia',
    forgot_title: 'Weka Upya Nenosiri',
    forgot_copy: 'Weka barua pepe yako ili kupata msimbo wa kuweka upya.',
    request_code: 'Omba Msimbo',
    reset_title: 'Weka Msimbo wa Uthibitisho',
    reset_copy: 'Tumia msimbo wa kuweka upya na chagua nenosiri jipya.',
    reset_code: 'Msimbo wa Uthibitisho',
    new_password: 'Nenosiri Jipya',
    confirm_password: 'Thibitisha Nenosiri',
    reset_password: 'Weka Upya Nenosiri',
    profile_title: 'Usimamizi wa Wasifu',
    profile_copy: 'Sasisha taarifa za akaunti, mapendeleo, na lugha ya programu.',
    save_profile: 'Hifadhi Wasifu',
    language: 'Lugha',
    interests: 'Mambo Unayopenda',
    logout: 'Toka',
    role: 'Jukumu',
    explore_title: 'Vivutio vya Watalii',
    explore_copy: 'Tafuta kwa jina, chuja kwa kundi, na fungua eneo kuona maelezo, ramani, na uhifadhi.',
    search_placeholder: 'Tafuta vivutio au maeneo ya kitamaduni',
    all_categories: 'Yote',
    wildlife_title: 'Wanyamapori na Uhifadhi',
    wildlife_copy_2: 'Chunguza profaili za spishi, makazi, na taarifa za uhifadhi.',
    chatbot_title: 'Chatbot ya Msaada wa Watalii',
    chatbot_copy:
      'Uliza kuhusu kupanga safari, usalama, kutembelea mbuga, au malipo. Chatbot hutumia maarifa yaliyohifadhiwa MongoDB.',
    type_message: 'Uliza swali',
    send: 'Tuma',
    faq: 'Maswali Yanayopendekezwa',
    profile_saved: 'Wasifu wako umehifadhiwa kwa mafanikio.',
    reset_code_generated: 'Msimbo wa kuweka upya umetengenezwa.',
    use_code_now: 'Tumia msimbo huu sasa',
    reset_success: 'Nenosiri limewekwa upya kwa mafanikio.',
    settings: 'Mipangilio',
    guest: 'Mgeni',
    language_saved: 'Lugha imesasishwa.',
  },
};

const LocalizationContext = createContext(null);

export function LocalizationProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (savedLanguage && translations[savedLanguage]) {
          setLanguageState(savedLanguage);
        }
      } finally {
        setReady(true);
      }
    };

    void loadLanguage();
  }, []);

  const setLanguage = async (nextLanguage) => {
    if (!translations[nextLanguage]) {
      return;
    }

    setLanguageState(nextLanguage);
    await SecureStore.setItemAsync(LANGUAGE_KEY, nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      ready,
      t: (key) => translations[language]?.[key] || translations.en[key] || key,
    }),
    [language, ready]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocale must be used within LocalizationProvider');
  }

  return context;
}
