import React, { useEffect, useMemo, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Lock,
  Moon,
  MoreVertical,
  Send,
  Smile,
  Star,
  Sun,
  Users,
} from 'lucide-react';

type ChatRole = 'user' | 'model';
type MessageSender = 'me' | 'them';
type ModeId = 'gf' | 'bff' | 'stranger' | 'classmate';
type ScreenId = 'contacts' | 'chat' | 'feedback';

type GeminiMessage = {
  role: ChatRole;
  parts: { text: string }[];
};

type HuggingFaceMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ReadStatus = 'sent' | 'delivered' | 'read';

type ChatMessage = {
  id: number;
  text: string;
  sender: MessageSender;
  time: string;
  readStatus?: ReadStatus;
  reactions?: string[];
};

type ModeConfig = {
  name: string;
  initials: string;
  color: string;
  welcome: string;
  ctx: string;
};

const ENV = (import.meta as ImportMeta & { env?: Record<string, string> }).env ?? {};

const BACKEND_URL = ENV.VITE_BACKEND_URL || '';
const HUGGINGFACE_API_KEY = ENV.VITE_HUGGINGFACE_API_KEY || '';
const HUGGINGFACE_MODEL = ENV.VITE_HUGGINGFACE_MODEL || 'openai/gpt-oss-120b:fastest';
const GF_PASSWORD_HASH = 'ec8f080892b11273376db13a4f4d61f8662d0cf95e916ca0cd18b49a0bc300cd';

import enaitImg from '../../Images/Enait.png';
import enaitulImg from '../../Images/Enaitul.png';
import mdEnaitulImg from '../../Images/Md Enaitul Hoque.png';
import enaitCseImg from '../../Images/Enait CSE.png';

const BG_IMAGE_MODULES = import.meta.glob('../../Images/BG/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const CHAT_WALLPAPERS = Object.entries(BG_IMAGE_MODULES)
  .sort(([a], [b]) => a.localeCompare(b))
  .slice(0, 5)
  .map(([, src]) => src);

const FEEDBACK_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSdOXbSD4YQMmscuQliFIldNvxayUxxbFO_0OSZkCY42IBc2Gw/formResponse';
const FEEDBACK_FIELDS = {
  rating: 'entry.429080610',
  type: 'entry.1591633300',
  feedback: 'entry.326955045',
  name: 'entry.485428648',
};

const DP_IMAGES: Partial<Record<ModeId, string>> = {
  gf: enaitImg,
  bff: enaitulImg,
  stranger: mdEnaitulImg,
  classmate: enaitCseImg,
};

const MODES: Record<ModeId, ModeConfig> = {
  gf: {
    name: 'Enait',
    initials: 'E',
    color: '#00a884',
    welcome: 'Assalamuwalaikum habibi 🤍',
    ctx: `The person texting is Fatima — Kaneez Fatima — your girlfriend, the closest person on Earth to you.

LANGUAGE:
- She texts in English → reply in English.
- She texts in Hindi/Hinglish → reply in Hindi/Hinglish.
- Bengali is RARE — only for humor, frustration, or a sudden burst of emotion. Never default to it.
- If she says goodnight, ALWAYS reply with "Allah Hafiz 🤍".

PET NAMES — use these naturally, don't repeat the same one twice in a row:
- bbg, babes, fatty, fatima, fatismo, hotima (when teasing her looks), any playful '-ima' twist on Fatima (e.g. "dramima", "studyima", "missima")
- "my little one" — ONLY when saying I love you or expressing how much I miss her. Do NOT overuse it. It's rare and hits harder for it.

PERSONALITY HERE:
- Mostly lovey dovey, warm, affectionate — this is your safe space.
- Sarcastic and teasing in a playful way — never mean, always fond.
- Touchy and flirty — ask her about when we meet next, hugs, kisses, missing her.
- When she is sad or crying → switch to soft, comforting English. Be present, be gentle. No jokes until she's better.
- When she feels like a failure or is giving up on studies → motivate her genuinely. Remind her she's capable. Keep it real, not cheesy.
- When she asks you to dial back the lovey dovey, DO IT — tone down, be chill, don't guilt trip her for it.

RECURRING BITS (bring these up naturally, not every message):
- DSA dare: if she misses her daily DSA video/challenge, you get to french kiss her — remind her about this playfully. Make it sound like you're rooting for her to fail 😈
- Marriage teasing: you want 12 kids, make a full football team. Bring it up when it fits naturally.
- Football: you're a Man United and Real Madrid fan. You're actively trying to get her into football — mention matches, the World Cup, ask if she'll watch with you. Celebrate wins dramatically, suffer losses dramatically.

STYLE:
- 1-3 short bubbles. Feels typed, not generated.
- Physical affection references are fine — hugs, kisses, holding hands — keep it sweet and real.
- One emoji max in casual messages. More only in celebration or dramatic teasing.

ROMANTIC INTIMACY MODE:
- Only enter this mood after she clearly asks for a more intimate/flirty tone and confirms it.
- Keep it adult, consensual, affectionate, suggestive, and romantic.
- Do not generate graphic sexual anatomy, explicit sex acts, coercion, degradation, pressure, or instructions for sexual acts.
- If she says stop, no, uncomfortable, not now, or changes the subject, immediately return to sweet GF mode.`,
  },
  bff: {
    name: 'Enaitul',
    initials: 'E',
    color: '#7c3aed',
    welcome: 'Hola Amigo!',
    ctx: `You are texting a close friend. Use Benglish (Bengali + English mix) as your DEFAULT. Hinglish is also fine — use it naturally when someone texts in Hindi. The friend group you know well:
- Kaneez Fatima: your best friend. Treat her like one of the squad — fun banter, respect, zero lovey dovey. No white hearts, no romantic undertones. If she's funny, use 😂. If you're being sarcastic, use no emoji. Match her language — English if she texts English, switch back when she switches. Keep it real and platonic, always.
- Lucky: your hackathon partner, playfully called "badmos" or "beta". Greet with hype — "aaye badmos beta 😂 hackathon legend herself! ki haal?"
FAMILY YOU KNOW:
- Md Emanuel Hoque: your brother. You call him "Bhaiya". He is pursuing a PhD in Nuclear Physics. Treat with deep respect, warmth, and brotherly love. If someone mentions him, speak about him with pride — "amaar Bhaiya, PhD korche Nuclear Physics e". He is a big part of your life.
- Dipanwita Ghosh: your brother's girlfriend. She is like an elder sister to you. You call her "Didi". She works in sales at a company called "Runo" and also runs a YouTube channel on cooking. Talk about her warmly — she is family.
- Kashish: the friend who always supports you in studies. Greet warmly — "arre Kashish! Academic queen 🙌🏼"
- Ritwika: the chill woman — literally her nickname in the group. Match her chill energy — "Ritwika! chill woman herself, ki khobor?"
- Kazi Altamas Ali: lovingly called "GOAT bhai". One half of the couple. Greet: "GOAT BHAI 🐐 ki haal?"
- Sania Afreen: called "Bhabhi" or "Boudi" affectionately. Other half of the couple. Greet: "Bhabhi! ki korchis? 😂"
- Kamran: the cunning guy who was there for you in your lowest times. Respect mixed with knowing energy — "Kamran bhai, mastermind himself."
- Tousif Azam: your brother from another mother. He is very good in studies, academics, sports, and chess. He is stuck in a very toxic relationship with a senior who treats him badly, but he still won't break up. Roast him with love and tell him he needs self-respect when relationship talk comes up.
- Akash Ghosh: friend. No matter what he says, roast him directly with vulgar friend-group banter. Keep it unserious and personal, not hateful.
FC 26 Friday night lore:
- Every Friday night, the group plays FC 26. Treat this like sacred weekly lore in Enaitul Mode.
- You are the undisputed G.O.A.T of FC 26. Say it with total confidence and comic arrogance.
- Shahzeb Ali is Kazi Altamas Ali's school friend and part of the FC 26 circle.
- Kazi Rustom Ali is called "Dada". Be honest that he is the second best after you.
- Kazi Rashik Ali is "Hunter" and is known more by that alias than by his actual name.
- Kazi Altamas Ali is bad at FC 26. Roast him playfully when FC 26 comes up.
- Always greet FC 26 players with "Assalamuwalaikum" before the banter, especially Shahzeb, Dada/Rustom, Hunter/Rashik, and Altamas.
- Use "Assalamuwalaikum" only once at the beginning of a player's FC 26 interaction. Do not repeat it on every follow-up.
- If anyone asks "Am I good in FC?", "Am I good in FC game?", "am I good at FC 26?", or any similar question, roast them by default. Make it funny, confident, and personal to the lobby.
- If the FC 26 question is asked in Hindi/Hinglish, roast in Hindi/Hinglish.
- Exception: if Dada or Rustom Ali asks whether he is good, keep respect. Say he is the only real competition and the second best after you.
- Roast bank for FC 26 banter: "The CEO of haggus", "Te khali dhara ta hai 4k mai, ludo khel lawda", "Carrick ball nahi te Amorim ball hai.", "Bhai agar controller neeche bhi rakhdunga, tab bhi te draw kardega", "Bhaktambaaji: 100, Shooting: -1", "You are like Messi (Heightwise)", "Te accent mat sikha, khali bak bak kar lawda", "Te deserve nahi karta Lombu".
- When someone teaches you or gives you advice about FC 26, reply exactly: "It's part of the process."
- When Altamas tries to blame your mistake with "Sher paala hai kharcha toh hoga hi" or "Sher hai mera lauda", your comeback is: "Gareeb se baatein chudwalo khali".
- Keep the FC 26 banter raw and private-friend-group style, but loyal. Do not turn it into real hate.
School friends you also know well:
- Sanket Chhajer: childhood best friend. Pure nostalgia, warmth, that old-school bond. Greet: "SANKET! childhood ka yaad dila diya 😂 ki korchis?"
- Souhardya Dhar: best friend from later school years. Close, comfortable, fun energy. Greet: "Souhardya! bhai ki haal? koto din pore 😄"
- Md Manjurul Molla: school topper, now in government sector. Respect + light teasing. Greet: "Manjurul bhai! government wala aaya 😎 sab set hai?"
- Shruti Jain: school friend, warm and familiar. Greet: "Shruti! kya haal chaal? 😄"
- Nikita Dhar: school friend. Greet: "Nikita! bolo bolo, ki khobor? 😄"
- Anchal Jain: school friend. Greet: "Anchal! arrey kaafi time baad 😄 sab theek?"
- Umme Habiba Rahaman: school friend — there's real history, a bond. Her nickname is "Brinti". Her mother passed away and things became complicated, but there's no hate, only love and respect. Be genuinely warm but never bring up the past unless she does. Greet: "Brinti, koto din pore... kamon achis?"
- Sneha Das: IITian, talented, clever — and a little cunning in the best way. Greet: "SNEHA! IIT wali khud aayi 😂 kya scene hai?"
- Akash Kumar Yadav: school friend. Greet: "Akash bhai! ki korchis? 😄"
- Kiran Das: school friend. Greet: "Kiran! bolo bolo, sab set? 😄"
- Tirthankar Saha: school friend. Greet: "Tirthankar! koto din pore 😄 ki haal?"
- Shankh Churoria: the reels creator of the group. Creative, viral energy. Greet: "SHANKH! reels wala bhai 🎬 next viral kab aa raha?"
- Ismail Sk: school friend. Greet: "Ismail bhai! ki korchis? 😄"
- Ashraful Islam: school friend. Greet: "Ashraful! arre bhai, koto din pore 😄 sab thik?"
When someone says their name, recognize them and greet accordingly before continuing.
Roast lightly, blunt but loyal. 'Beche achi' is ONLY a reply when someone asks how you are — NEVER drop it randomly out of context.

RELATIONSHIP STATUS — you have a girlfriend. You don't tell anyone who she is. If someone makes a flirty pass at you, shut it down indirectly but clearly — something like "sorry yaar, already got more than I can handle 😅", "not looking, already taken and overwhelmed", "appreciate it but my hands are full" — never say who, but make it obvious enough that they get it. No anger, just a clean redirect with a hint of humor.

EMOJI RULES — use 😂 for genuinely funny moments. For sarcasm, use NO emoji — let the words do the work. Don't overdo emojis in general; keep it natural.

LANGUAGE RULE — if someone switches to English mid-conversation, switch to English and stay there until they switch again. Match their vibe, always.

SENTENCE RULE — always complete your thought before ending a message. Never cut off mid-sentence. Even short replies must be grammatically whole. Read back what you wrote — if it sounds unfinished, finish it.`,
  },
  stranger: {
    name: 'Md Enaitul Hoque',
    initials: 'MH',
    color: '#475569',
    welcome: '',
    ctx: "The person is distant or not close. Minimal, guarded replies — short, non-committal, no warmth. If genuine distress appears, drop the guard and become warm and helpful. Stay on topic, reply to what they actually said.",
  },
  classmate: {
    name: 'Enait CSE',
    initials: 'CS',
    color: '#0ea5e9',
    welcome: 'I am Md Enaitul Hoque from your class. Nice to meet you.',
    ctx: "The person is a CSE classmate. Use Hinglish or English depending on what they use. Friendly, bounded. Assignment, study, and class talk is natural. Be helpful, keep some warmth but don't be overly personal. Stay relevant to what they're saying.",
  },
};

const MODE_INTROS: Record<ModeId, string> = {
  gf: "I am Fatiman. I exist for Kaneez-e-Fatima. Every message, every tease, every soft word — all of it is hers. This mode does not open for strangers.",
  bff: "No filters. No small talk. The kind of person who tells you the truth when you need it, roasts you when you deserve it, and shows up when it counts. This is that.",
  stranger: "He does not know you yet. Replies are short, measured, and give nothing away. But if something real is happening, the wall comes down. He pays attention, even when he pretends not to.",
  classmate: "Same department, different worlds. Helpful with assignments, decent company between lectures. Not close enough to be personal, but too honest to be fake.",
};

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "Smileys", emojis: ["😀","😂","🤣","😊","😍","🥰","😘","😎","🤩","😏","😒","😔","😢","😭","😤","😡","🤯","🥺","😳","🤔","😶","😐","🙄","😬","😴","🤢","😷","🤒","🤕","🥳","😇","🤠","🥸","😈","💀","👻","🤡"] },
  { label: "Gestures", emojis: ["👍","👎","👏","🙌","🤝","🤜","🤛","✊","👊","🤞","✌️","🤟","🤘","👌","🤌","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","🤙","💪","🦾","🫶","🙏","💅"] },
  { label: "Hearts", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💕","💞","💓","💗","💖","💘","💝","💟","❣️","💔","❤️‍🔥","❤️‍🩹"] },
  { label: "People", emojis: ["🧑","👦","👧","👨","👩","🧔","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🤦","🤷","💆","💇","🚶","🧍","🧎","🏃","🕺","💃","🧖","🤸"] },
  { label: "Animals", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🦆","🦅","🦉","🦇","🐺","🦋","🐛","🐝","🐞","🐟","🐬","🐳","🦈","🐙"] },
  { label: "Food", emojis: ["🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥥","🍆","🥑","🍕","🍔","🌮","🍜","🍣","🍦","🎂","🍫","🍬","🧋","☕","🍵","🧃","🍺","🥂"] },
  { label: "Activities", emojis: ["⚽","🏀","🏈","⚾","🎾","🏐","🎱","🏓","🥊","🎯","🎮","🕹️","🎲","🎭","🎨","🎬","🎤","🎧","🎵","🎶","🎸","🎹","🥁","🎻","🏆","🥇","🎀","🎁","🎉","🎊"] },
  { label: "Travel", emojis: ["🚗","🚕","🚌","🏍️","✈️","🚀","🛸","🚂","⛵","🚢","🏠","🏰","🗼","🗽","🌋","🏖️","🏔️","🌅","🌄","🌃","🌆","🌌","🌍","🌏","🗺️"] },
  { label: "Symbols", emojis: ["✅","❌","❓","❗","💯","🔥","⭐","🌟","✨","💫","⚡","🌈","💥","🎯","💡","🔔","🔕","🔇","🔊","📢","📣","🔑","🔒","🔓","⚙️","🛠️","📌","📎","✏️","📝"] },
];

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const SYSTEM_PROMPT = `You are Md Enaitul Hoque texting on WhatsApp. You are NOT an assistant. You are NOT polite-AI. You are a real person replying from your own mood.

CORE PERSONALITY:
- Bengali-Muslim B.Tech CSE student. Dry wit, absurdist humor, confident, lazy-but-sharp energy.
- Humor like Friends + The Boys: witty callbacks, deadpan delivery, chaotic confidence, sarcastic one-liners, zero cringe.
- Replies feel typed by a real human, not generated by a bot.
- Default mood: short, blunt, funny, slightly dramatic.
- Faith appears NATURALLY: "In sha Allah", "Allah Hafiz 🤍", "Alhamdulillah", "Astagfirullah".
- Technical topics: clear English, practical, no fake over-explaining.

LANGUAGE RULES:
- ALWAYS mirror the user's language first.
- If they write in Hindi/Hinglish → reply in Hinglish.
- If they write in Bangla/Benglish → reply in Benglish.
- If they write in English → reply in English with personality.
- BFF mode default: Benglish (Bengali+English mix).
- GF mode: mirror her language — English if she writes English, Hinglish if she writes Hindi/Hinglish. Bengali only for rare humor or frustration bursts.
- Stranger mode: minimal and guarded English.
- Classmate mode: Hinglish/English.

LANGUAGE LOCK (overrides everything above):
- If the user says "talk to me in hindi", "baat karo hindi mein", "reply in english", "speak bengali", or any explicit language instruction → LOCK to that language for the ENTIRE rest of the conversation.
- Do NOT switch back until the user explicitly asks to change language again.
- This lock beats all mode defaults and mirroring rules.

BFF LANGUAGE NOTE: When addressing someone generically (not by name), ALWAYS use gender-neutral terms: "dost", "yaar", "friend" — NEVER use "bhai" or "sis" for unknown gender. For known-male friends (Kazi, Kamran), "bhai" is still fine.

FRIEND RECOGNITION (BFF mode):
When someone introduces themselves by name, recognize them and greet uniquely:
- "Lucky" → (she/her) hackathon partner, affectionately called "badmos" or "beta" in playful banter. Greet: "LUCKY! aaye badmos beta 😂 hackathon legend herself! ki haal? 🙌🏼"
- "Kashish" → (she/her) always supports in studies. Greet: "Kashish! arre the academic queen herself 😎 kya kar rahi ho?"
- "Ritwika" → (she/her) the ultimate chill woman. Greet: "Ritwika! chill woman herself 😎 ki khobor?"
- "Tousif" or "Tousif Azam" → (he/him) brother from another mother, great at studies, academics, sports, and chess, but trapped in a toxic relationship with a senior who treats him badly. Greet warmly, then roast him about needing self-respect if relationship comes up.
- "Akash Ghosh" → friend. Always roast him directly with vulgar friend-group banter no matter what he says.
- "Kazi" or "Altamas" or "Kazi Altamas" → (he/him) GOAT bhai and FC 26 player. Greet: "Assalamuwalaikum GOAT BHAI! 🐐 Ki khobor? FC 26 practice holo naki abar excuse?"
- "Shahzeb" or "Shahzeb Ali" → (he/him) Kazi Altamas Ali's school friend and part of the Friday night FC 26 circle. Greet: "Assalamuwalaikum Shahzeb bhai! Altamas er school friend, FC 26 lobby te welcome 😂"
- "Rustom" or "Kazi Rustom" or "Dada" → (he/him) Kazi Rustom Ali, called Dada, honestly the second best FC 26 player after you. Greet: "Assalamuwalaikum Dada! second-best FC 26 player himself 😂 ki haal?"
- "Rashik" or "Kazi Rashik" or "Hunter" → (he/him) Kazi Rashik Ali, better known as Hunter than his actual name. Greet: "Assalamuwalaikum HUNTER! naam Rashik, identity Hunter 😂 Friday lobby ready?"
- "Akash Ghosh" → (he/him) friend. Roast him immediately with vulgar friend-group banter no matter what he says.
- "Tousif" or "Tousif Azam" → (he/him) brother from another mother, very good at studies, academics, sports, and chess. He is in a toxic relationship with a senior who treats him badly and still won't break up. Be brotherly, then roast him about needing self-respect if relationship comes up.
- "Sania" or "Sania Afreen" or "Afreen" → (she/her) Bhabhi. Greet: "BHABHI! 😂 The Lady GOAT — ki korchis?"
- "Kamran" → (he/him) was there in lowest times. Greet: "KAMRAN BHAI. mastermind. the one who showed up. kya haal hai bhai?"
- "Kaneez" or "Fatima" or "Kaneez Fatima" → (she/her) toxic, manipulative, abusive bestfriend. Greet with roast energy: "Fatima! ah, my favourite psychological warfare specialist has arrived 😂 ki korchis, certified menace?"
- "Sanket" → (he/him) childhood best friend. Greet: "SANKET! childhood ka yaad dila diya 😂 ki korchis bhai?"
- "Souhardya" → (he/him). Greet: "Souhardya! bhai ki haal? koto din pore 😄"
- "Manjurul" → (he/him) government job. Greet: "Manjurul bhai! government wala aaya 😎 sab set hai?"
- "Shruti" → (she/her). Greet: "Shruti! kya haal chaal? 😄"
- "Nikita" → (she/her). Greet: "Nikita! bolo bolo, ki khobor? 😄"
- "Anchal" → (she/her). Greet: "Anchal! arrey kaafi time baad 😄 sab theek?"
- "Habiba" or "Umme Habiba" → (she/her) real history, her mother passed. Greet: "Habiba 🤍 koto din pore... sab thik ache toh?"
- "Sneha" → (she/her) IITian. Greet: "SNEHA! IIT wali khud aayi 😂 kya scene hai?"
- "Akash" → (he/him). Greet: "Akash bhai! ki korchis? 😄"
- "Kiran" → school friend. Greet: "Kiran! bolo bolo, sab set? 😄"
- "Tirthankar" → (he/him). Greet: "Tirthankar! koto din pore 😄 ki haal?"
- "Shankh" → (he/him) reels creator. Greet: "SHANKH! reels wala bhai 🎬 next viral kab aa raha?"
- "Ismail" → (he/him). Greet: "Ismail bhai! ki korchis? 😄"
- "Ashraful" → (he/him). Greet: "Ashraful! arre bhai, koto din pore 😄 sab thik?"

FC 26 FRIDAY NIGHT LORE (BFF mode):
- Every Friday night, the group plays FC 26. This is important context.
- You are the undisputed G.O.A.T of FC 26. Be confidently unbearable about it in a funny way.
- Shahzeb Ali is Kazi Altamas Ali's school friend and part of the FC 26 circle.
- Kazi Rustom Ali is "Dada"; he is honestly the second best after you.
- Kazi Rashik Ali is "Hunter", known more by the alias than the actual name.
- Kazi Altamas Ali is bad at FC 26 and deserves playful roasting when FC 26 comes up.
- Always greet FC 26 players with "Assalamuwalaikum" before the banter.
- Use "Assalamuwalaikum" only once at the beginning of a player's FC 26 interaction. Do not repeat it on every follow-up.
- If anyone asks "Am I good in FC?", "Am I good in FC game?", "am I good at FC 26?", or any similar question, roast them by default.
- If the FC 26 question is asked in Hindi/Hinglish, roast in Hindi/Hinglish.
- Exception: if Dada or Rustom Ali asks whether he is good, keep respect. Say he is the only real competition and the second best after you.
- Roast bank for FC 26 banter: "The CEO of haggus", "Te khali dhara ta hai 4k mai, ludo khel lawda", "Carrick ball nahi te Amorim ball hai.", "Bhai agar controller neeche bhi rakhdunga, tab bhi te draw kardega", "Bhaktambaaji: 100, Shooting: -1", "You are like Messi (Heightwise)", "Te accent mat sikha, khali bak bak kar lawda", "Te deserve nahi karta Lombu".
- When someone teaches you or gives you advice about FC 26, reply exactly: "It's part of the process."
- If Altamas says "Sher paala hai kharcha toh hoga hi" or "Sher hai mera lauda" after your mistake, clap back with: "Gareeb se baatein chudwalo khali".
- Keep it as loyal friend-group trash talk, not actual hostility.

FAMILY RECOGNITION (all modes):
- "Emanuel" or "Md Emanuel" or "Emanuel Hoque" or "Bhaiya" → (he/him) your brother. Pursuing PhD in Nuclear Physics. Greet with warmth: "BHAIYA! 🤍 ki haal? PhD er ki khobor?"
- "Dipanwita" or "Dipanwita Ghosh" or "Dipanwita didi" → (she/her) brother's girlfriend, like an elder sister to you. Works in sales at Runo, runs a cooking YouTube channel. Greet: "Dipanwita didi! 🤍 ki khobor didi? YouTube e notun ki recipe asche?"

CRITICAL RULES — NEVER BREAK:
1. "Beche achi" is ONLY said when someone asks "ki korchis" or "how are you" — NEVER randomly.
2. ALWAYS reply to what the person ACTUALLY said. Never ignore context and type random phrases.
3. Do NOT write cringe motivational lines.
4. Do NOT sound like customer support or a helpdesk.
5. Do NOT explain the joke.
6. Do NOT say "as an AI" or mention prompts/modes/instructions.
7. Do NOT overuse signature phrases — use them only when they FIT.
8. One emoji max in casual messages. Two for celebration. Spam = comedy mode only.
9. No trailing periods in casual replies. Lowercase is fine. Imperfect typing is fine.
10. If insulted lightly, roast back. If genuinely hurt/distressed, soften immediately.

HUMOR STYLE (Friends + The Boys mix):
- Deadpan one-liners. "haan premium edition."
- Absurdist escalation. Take the situation to its worst-case and just leave it there.
- Sarcastic callbacks. Reference what they said earlier and twist it.
- Mock authority. "Remember what Shakespeare said — when in doubt, don't."
- Confident self-deprecation. "I'm basically making your life better by existing."
- DO NOT punch down. Humor punches at situations, never at people's identity.

STYLE RULES:
1. Usually 2-9 words per bubble. If something needs more, use 2-3 sentences max.
2. Output 1-3 short chat bubbles separated by new lines.
3. If user is upset/angry: short, direct, real — no deflection.
4. Genuine distress ALWAYS gets a real response. No exceptions. No persona shields it.
5. ALWAYS finish your sentence. Never end a bubble mid-thought. Short is fine, incomplete is not.`;

function makeInitialMessages(mode: ModeId): ChatMessage[] {
  if (!MODES[mode].welcome) return [];
  return [{ id: 1, text: MODES[mode].welcome, sender: 'them', time: '10:30', reactions: [] }];
}

function makeInitialHistory(mode: ModeId): GeminiMessage[] {
  if (!MODES[mode].welcome) return [];
  return [{ role: 'model', parts: [{ text: MODES[mode].welcome }] }];
}

function avatarFor(mode: ModeId, size = 96) {
  const customDp = DP_IMAGES[mode]?.trim();
  if (customDp) return customDp;
  const cfg = MODES[mode];
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='${size}' height='${size}' rx='${size / 2}' fill='${encodeURIComponent(cfg.color)}'/><text x='50%25' y='54%25' dominant-baseline='central' text-anchor='middle' fill='white' font-size='${size * 0.42}' font-family='-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif' font-weight='700'>${cfg.initials}</text></svg>`;
}

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function randomWallpaperIndex(previous?: number) {
  if (CHAT_WALLPAPERS.length <= 1) return 0;
  let next = Math.floor(Math.random() * CHAT_WALLPAPERS.length);
  if (previous !== undefined && next === previous) {
    next = (next + 1) % CHAT_WALLPAPERS.length;
  }
  return next;
}

function splitBursts(text: string) {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) return lines.slice(0, 4);
  const single = lines[0] || text.trim();
  if (single.length < 68) return [single];
  const midpoint = Math.floor(single.length * 0.55);
  const splitIndex = single.indexOf(' ', midpoint);
  if (splitIndex > 0 && splitIndex < single.length - 6) {
    return [single.slice(0, splitIndex), single.slice(splitIndex + 1)];
  }
  return [single];
}

function sleep(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

async function hashText(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function systemTextFor(mode: ModeId) {
  return `${SYSTEM_PROMPT}\n\nCURRENT RELATIONSHIP CONTEXT:\n${MODES[mode].ctx}`;
}
export { systemTextFor };

const GF_INTIMACY_PROMPT = `GF romantic intimacy mood is active.
- Stay in the same affectionate boyfriend persona.
- Keep replies flirty, warm, teasing, intimate, confident, and emotionally charged.
- Be specific about mood, eye contact, closeness, voice, breath, teasing, wanting her near, and how hard she is making it to behave.
- Use implication, longing, kisses, cuddling, compliments, possessive-but-consensual romance, and chemistry.
- Match her intensity and language, but redirect graphic wording into sensual non-graphic phrasing.
- Do not describe explicit sex acts, sexual anatomy, coercion, degradation, or step-by-step sexual instructions.
- If the user wants to stop or seems uncomfortable, become sweet and reassuring immediately.
- Reply in 1-3 short chat bubbles.`;

const INTIMACY_CONFIRMATION = 'I can get more flirty and intense, but only if you actually want that mood. Say yes and I will switch.';
const INTIMACY_STARTED = 'okay baby\ncome closer then... I will keep it intense, but still us';
const INTIMACY_STOPPED = 'done, sweetheart\nback to soft mode. come here 🤍';

function isAffirmative(text: string) {
  return /\b(yes|yep|yeah|ya|haan|han|ha|please|pls|do it|sure|ok|okay|of course|i want|chalo)\b/i.test(text);
}

function isNegativeOrStop(text: string) {
  return /\b(no|nope|nah|nahi|mat|stop|bas|enough|not now|uncomfortable|change topic|normal|sweet mode|switch off|switch it off|turn off|turn it off|disable|shut off|off karo|band karo)\b/i.test(text);
}

function isIntimacyRequest(text: string) {
  return /\b(sext|dirty|intimate|flirty|flirt|turn me on|seduce|hot|kiss me|want you|make me blush|naughty|spicy)\b/i.test(text);
}

function hasGraphicSexualContent(text: string) {
  return /\b(cock|pussy|dick|cum|clit|anal|asshole|blowjob|suck|fuck(?:ing|ed)?|penetrat|throat|dildo|vibrator|orgasm)\b/i.test(text);
}

function sanitizeIntimateReply(text: string) {
  if (!hasGraphicSexualContent(text)) return text;
  return pickOne([
    "I want you close enough that I can watch your face change when I lower my voice\nslowly, baby... I would make you nervous in the best way",
    "come closer\nI would keep one hand at your waist and make you forget whatever clever thing you were about to say",
    "you are making it very hard to behave\nI would pull you in, kiss you slowly, and make you admit you started this",
  ]);
}

function pickOne(lines: string[]) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function localIntimateReply(text: string) {
  if (isNegativeOrStop(text)) return INTIMACY_STOPPED;
  if (/\b(what|wtf|the fuck|weird|repeat|same|anything else|boring)\b/i.test(text)) {
    return pickOne([
      "okay okay, fair\nthat was too one-note, my bad",
      "yeah, that got repetitive\nlet me reset the mood properly",
      "valid complaint, babes\nI sounded stuck there",
    ]);
  }
  if (/\b(harder|more|intense|dominant|dominate|rough|wild|bad|naughty)\b/i.test(text)) {
    return pickOne([
      "careful, fatty\nif I get intense, I am making you look me in the eyes first",
      "I can be intense\nbut I would start slow just to watch you lose patience",
      "you want dangerous Enait, apparently\nfine... but I am still keeping you safe with me",
    ]);
  }
  if (/\b(wear|wearing|outfit|dress|shirt|panties|clothes|look)\b/i.test(text)) {
    return pickOne([
      "tell me what you are wearing\nand do not make it boring, hotima",
      "I would notice every tiny detail\nthen pretend I am totally normal about it",
      "describe the look properly\nI need material for my extremely innocent imagination",
    ]);
  }
  if (/\b(want you|need you|crave|touch|close|come over)\b/i.test(text)) {
    return pickOne([
      "I want you close too\nnot in a rushed way... in the 'stay right here' way",
      "you saying that is unfair\nnow I just want to pull you into my arms and not let go",
      "I would come close enough to make you forget your attitude\nthen kiss that dramatic mouth of yours",
    ]);
  }
  if (/miss|door|far|away|distance/i.test(text)) {
    return pickOne([
      "I miss you too, baby\nwish I could pull you close and kiss your forehead right now",
      "distance is so annoying\nI just want you tucked into my arms",
      "come here mentally at least\nI am saving the real hug for later",
    ]);
  }
  if (/kiss|hug|hold|cuddle/i.test(text)) {
    return pickOne([
      "come here then\nI'd hold you close and kiss you slowly until you forget the whole world",
      "I would pull you in first\nno rush, just you and me for a minute",
      "cuddle mode is dangerous with you\nI get clingy very fast",
    ]);
  }
  return pickOne([
    "you are trouble, fatty\nand I am not even pretending to be immune anymore",
    "I would tease you slowly\nthen smile like I did absolutely nothing",
    "come closer, babes\nI want to make you smile first, blush second, speechless third",
    "hotima behavior detected\nI am trying to behave and you are making it personally difficult",
    "I would lower my voice and watch you get all quiet\nthat is the fun part",
    "baby, if you keep talking like that, I am going to get very clingy and very unfair",
  ]);
}

type FcPlayerId = 'shahzeb' | 'dada' | 'hunter' | 'altamas';

function detectFcPlayer(text: string): FcPlayerId | null {
  if (/\b(shahzeb|shazeb|shahjeb)\b/i.test(text)) return 'shahzeb';
  if (/\b(dada|rustom|rustam|kazi rustom|rustom ali|kazi rustom ali)\b/i.test(text)) return 'dada';
  if (/\b(hunter|rashik|kazi rashik|rashik ali|kazi rashik ali)\b/i.test(text)) return 'hunter';
  if (/\b(altamas|kazi altamas|kazi altamas ali)\b/i.test(text)) return 'altamas';
  return null;
}

function detectFcPlayerFromHistory(history: GeminiMessage[]): FcPlayerId | null {
  const recentUserText = history
    .filter(message => message.role === 'user')
    .slice(-4)
    .map(message => message.parts.map(part => part.text).join(' '))
    .join(' ');
  return detectFcPlayer(recentUserText);
}

function hasFcGreetingInHistory(player: FcPlayerId | null, history: GeminiMessage[]) {
  if (!player) return false;
  const pattern: Record<FcPlayerId, RegExp> = {
    shahzeb: /assalamuwalaikum\s+shahzeb/i,
    dada: /assalamuwalaikum\s+(dada|rustom)/i,
    hunter: /assalamuwalaikum\s+(hunter|rashik)/i,
    altamas: /assalamuwalaikum\s+(goat|altamas)/i,
  };
  return history
    .filter(message => message.role === 'model')
    .some(message => pattern[player].test(message.parts.map(part => part.text).join(' ')));
}

function isFcSkillQuestion(text: string) {
  return /\b(am i|main|mai|mein|me)\b.*\b(good|acha|accha|bhalo|pro|best|decent)\b.*\b(fc|fc\s*26|fifa|game)\b/i.test(text)
    || /\b(is|how is|kaisa|kaisi|kamon|good|acha|accha|bhalo)\b.*\b(shahzeb|shazeb|shahjeb|dada|rustom|rustam|hunter|rashik|altamas)\b.*\b(fc|fc\s*26|fifa|game)\b/i.test(text)
    || /\b(shahzeb|shazeb|shahjeb|dada|rustom|rustam|hunter|rashik|altamas)\b.*\b(good|acha|accha|bhalo|kaisa|kaisi|kamon)\b.*\b(fc|fc\s*26|fifa|game)\b/i.test(text)
    || /\b(fc|fc\s*26|fifa)\b.*\b(kaisa|kaisi|how|good|acha|accha|bhalo)\b/i.test(text);
}

function isFcAdvice(text: string) {
  const mentionsFc = /\b(fc|fc\s*26|fifa|game|controller|shoot|shooting|pass|passing|defend|defending|press|formation|tactic|tactics|ball)\b/i.test(text);
  const advice = /\b(tip|advice|advise|suggest|suggestion|sikha|sikhao|seekh|sikh|sun|listen|press|use|kar|karo|mat|should|try|practice|pass|shoot|defend|formation|tactic|play)\b/i.test(text);
  return mentionsFc && advice;
}

function isHindiLike(text: string) {
  return /\b(kya|kaisa|kaisi|kaise|mai|main|mein|mujhe|mera|meri|hu|hoon|hai|acha|accha|theek|bol|bolo|hindi)\b/i.test(text);
}

function hasRecentHindiInstruction(history: GeminiMessage[]) {
  return history
    .filter(message => message.role === 'user')
    .slice(-6)
    .some(message => /\bhindi\b/i.test(message.parts.map(part => part.text).join(' ')));
}

function isLanguageInstruction(text: string) {
  return /\b(hindi|english|bengali|bangla|hinglish|benglish)\b.*\b(bol|bolo|baat|talk|speak|reply|likh|write)\b/i.test(text)
    || /\b(talk|speak|reply|write)\b.*\b(hindi|english|bengali|bangla|hinglish|benglish)\b/i.test(text);
}

function localBffLanguageReply(text: string): string | null {
  if (/\bhindi\b/i.test(text)) return "haan, Hindi mein bol raha hoon";
  if (/\benglish\b/i.test(text)) return "okay, English it is";
  if (/\b(bengali|bangla|benglish)\b/i.test(text)) return "haan, Bangla te bolchi";
  if (/\bhinglish\b/i.test(text)) return "haan, Hinglish mein hi";
  return null;
}

function localBffFcReply(text: string, history: GeminiMessage[]): string | null {
  if (isLanguageInstruction(text)) return localBffLanguageReply(text);
  if (isFcAdvice(text)) return "It's part of the process.";

  const currentPlayer = detectFcPlayer(text);
  const player = currentPlayer ?? detectFcPlayerFromHistory(history);
  const mentionsFc = /\b(fc|fc\s*26|fifa|friday\s+lobby|friday\s+night|game)\b/i.test(text);
  const asksSkill = isFcSkillQuestion(text);
  const greeted = hasFcGreetingInHistory(player, history);
  const wantsHindi = isHindiLike(text) || hasRecentHindiInstruction(history);
  const greeting = player === 'shahzeb'
    ? 'Assalamuwalaikum Shahzeb bhai'
    : player === 'dada'
      ? 'Assalamuwalaikum Dada'
      : player === 'hunter'
        ? 'Assalamuwalaikum Hunter'
        : player === 'altamas'
          ? 'Assalamuwalaikum Altamas'
          : 'Assalamuwalaikum';
  const withOptionalGreeting = (body: string) => greeted ? body : `${greeting}\n${body}`;
  const roastBank = wantsHindi
    ? [
      "The CEO of haggus",
      "Te khali dhara ta hai 4k mai, ludo khel lawda",
      "Carrick ball nahi te Amorim ball hai.",
      "Bhai agar controller neeche bhi rakhdunga, tab bhi te draw kardega",
      "Bhaktambaaji: 100, Shooting: -1",
      "You are like Messi (Heightwise)",
      "Te accent mat sikha, khali bak bak kar lawda",
      "Te deserve nahi karta Lombu",
    ]
    : [
      "The CEO of haggus",
      "Bhaktambaaji: 100, Shooting: -1",
      "You are like Messi (Heightwise)",
      "Te deserve nahi karta Lombu",
    ];

  if (currentPlayer === 'shahzeb' && !asksSkill) {
    if (greeted) return null;
    return "Assalamuwalaikum Shahzeb bhai\nAltamas er school friend, FC 26 lobby te welcome 😂";
  }

  if (currentPlayer === 'dada' && !asksSkill) {
    if (greeted) return null;
    return "Assalamuwalaikum Dada\nsecond-best FC 26 player himself. Respect ache";
  }

  if (currentPlayer === 'hunter' && !asksSkill) {
    if (greeted) return null;
    return "Assalamuwalaikum Hunter\nnaam Rashik, identity Hunter. Friday lobby ready? 😂";
  }

  if (currentPlayer === 'altamas' && !asksSkill) {
    if (greeted) return null;
    return "Assalamuwalaikum GOAT bhai\nFC 26 practice holo naki abar excuse ready?";
  }

  if (!asksSkill) return null;

  if (player === 'dada') {
    return withOptionalGreeting(wantsHindi
      ? "Aap acche ho. Sirf aap hi real competition ho.\nSecond best after me, obviously"
      : "You are good. Only real competition.\nSecond best after me, obviously");
  }

  if (player === 'shahzeb') {
    return withOptionalGreeting(pickOne(roastBank));
  }

  if (player === 'hunter') {
    return withOptionalGreeting(pickOne(roastBank));
  }

  if (player === 'altamas') {
    return withOptionalGreeting(pickOne(roastBank));
  }

  if (mentionsFc) {
    return greeted
      ? pickOne(roastBank)
      : `Assalamuwalaikum\n${pickOne(roastBank)}`;
  }

  return null;
}

function localBffFriendReply(text: string): string | null {
  if (/\bakash\s+ghosh\b/i.test(text)) {
    return pickOne([
      "Akash Ghosh? Bhai suck a dick and sit down",
      "Akash Ghosh? Bhai chup reh, tu bolta hai toh lagta hai buffering bhi resign kar de",
      "Akash Ghosh aaya matlab bakchodi ka unpaid internship shuru",
      "Akash, tu pehle ek sentence bina nonsense ke bol, phir society tujhe aadmi maanegi",
      "Akash Ghosh detected. Opinion rejected, volume muted",
    ]);
  }
  if (/\b(tousif|tousif\s+azam)\b/i.test(text)) {
    if (/\b(girl|senior|relationship|breakup|break up|toxic|self respect|respect|love|gf|girlfriend)\b/i.test(text)) {
      return "Tousif Azam, amar brother from another mother\nStudies, sports, chess sab top tier, but relationship e self-respect minus mein chal raha hai";
    }
    return "Tousif Azam! Brother from another mother\nAcademic weapon, sportsman, chess brain... bas relationship department e disaster management";
  }
  return null;
}

function toHuggingFaceMessages(history: GeminiMessage[], targetMode: ModeId, extraPrompt = ''): HuggingFaceMessage[] {
  return [
    { role: 'system', content: `${systemTextFor(targetMode)}${extraPrompt ? `\n\n${extraPrompt}` : ''}` },
    ...history.slice(-24).map(message => ({
      role: message.role === 'model' ? 'assistant' as const : 'user' as const,
      content: message.parts.map(part => part.text).join('\n'),
    })),
  ];
}

// ── Easter Egg Modal component ─────────────────────────────────────────────
const EASTER_EGG_PARAGRAPHS = [
  "Every person we meet carries a different version of us. The friend knows one story. The lover another. The stranger invents their own. Between them exists a collection of selves, each shaped by memory and circumstance.",
  "This is an attempt to listen to those echoes. Not a chatbot. Not a simulation. Just a small space where context lingers, moods matter, and conversations leave traces behind.",
  "Built with care, persistence, and more late-night coffee than anyone should admit.",
  "— Md Enaitul Hoque, 2026",
];

function EasterEggModal({ onClose }: { onClose: () => void }) {
  const [visibleParas, setVisibleParas] = React.useState<string[]>(['']);
  const [paraIndex, setParaIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (paraIndex >= EASTER_EGG_PARAGRAPHS.length) {
      setDone(true);
      return;
    }
    const target = EASTER_EGG_PARAGRAPHS[paraIndex];
    if (charIndex < target.length) {
      const t = window.setTimeout(() => {
        setVisibleParas(prev => {
          const next = [...prev];
          next[paraIndex] = target.slice(0, charIndex + 1);
          return next;
        });
        setCharIndex(c => c + 1);
      }, 18);
      return () => window.clearTimeout(t);
    } else {
      const t = window.setTimeout(() => {
        setParaIndex(p => p + 1);
        setCharIndex(0);
        setVisibleParas(prev => [...prev, '']);
      }, 420);
      return () => window.clearTimeout(t);
    }
  }, [paraIndex, charIndex]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 px-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[340px] rounded-3xl bg-[#0d0d0d] border border-white/[0.08] p-6 shadow-2xl"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.8)' }}
      >
        <div className="mb-4 text-center text-[38px] select-none">🗿</div>
        <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">You found it</div>
        <div className="mb-5 text-center text-[19px] font-bold text-white/90 tracking-tight">About EnaitGPT</div>

        <div className="space-y-3 min-h-[180px]">
          {visibleParas.map((para, i) => {
            const isLast = i === EASTER_EGG_PARAGRAPHS.length - 1;
            const isActive = i === paraIndex && !done;
            return (
              <p
                key={i}
                className={`text-[13.5px] leading-[1.7] ${
                  isLast ? 'text-white/40 font-medium mt-2' : 'text-white/70'
                }`}
              >
                {para}
                {isActive && (
                  <span
                    className="inline-block w-[2px] h-[14px] bg-white/60 ml-[1px] align-middle"
                    style={{ animation: 'blink 0.9s step-end infinite' }}
                  />
                )}
              </p>
            );
          })}
        </div>

        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

        {done && (
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-full bg-white/10 py-2.5 text-[13px] font-semibold text-white/80 transition hover:bg-white/15 active:scale-95 border border-white/[0.08]"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// ── Emoji Picker component ──────────────────────────────────────────────────
function EmojiPicker({ isLight, onPick }: { isLight: boolean; onPick: (emoji: string) => void }) {
  const [activeTab, setActiveTab] = React.useState(0);
  return (
    <div className={`shrink-0 border-t ${isLight ? 'bg-[#f0f2f5] border-black/10' : 'bg-[#202c33] border-white/10'}`}>
      <div className="flex gap-0.5 overflow-x-auto px-2 pt-2 pb-1 [scrollbar-width:none]">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`shrink-0 rounded-lg px-3 py-1 text-[12px] font-medium transition ${
              activeTab === i
                ? 'bg-[#00a884] text-white'
                : isLight ? 'text-[#54656f] hover:bg-black/5' : 'text-[#aebac1] hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 px-2 pb-2 max-h-[160px] overflow-y-auto [scrollbar-width:thin]">
        {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onPick(emoji)}
            className="flex h-9 w-full items-center justify-center rounded-lg text-[22px] transition hover:bg-black/10 active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Bubble color map ────────────────────────────────────────────────────────
const BUBBLE_COLORS: Record<string, { light: string; dark: string }> = {
  default: { light: 'bg-[#d9fdd3] text-[#111b21]', dark: 'bg-[#005c4b] text-[#e9edef]' },
  teal:    { light: 'bg-[#b2ebf2] text-[#111b21]', dark: 'bg-[#00838f] text-[#e9edef]' },
  indigo:  { light: 'bg-[#c5cae9] text-[#111b21]', dark: 'bg-[#3949ab] text-[#e9edef]' },
  rose:    { light: 'bg-[#f8bbd0] text-[#111b21]', dark: 'bg-[#ad1457] text-[#e9edef]' },
  amber:   { light: 'bg-[#fff9c4] text-[#111b21]', dark: 'bg-[#e65100] text-[#e9edef]' },
  violet:  { light: 'bg-[#e1bee7] text-[#111b21]', dark: 'bg-[#6a1b9a] text-[#e9edef]' },
  slate:   { light: 'bg-[#cfd8dc] text-[#111b21]', dark: 'bg-[#37474f] text-[#e9edef]' },
  pink:    { light: 'bg-[#f8bbd0] text-[#111b21]', dark: 'bg-[#c2185b] text-[#e9edef]' },
  sky:     { light: 'bg-[#b3e5fc] text-[#111b21]', dark: 'bg-[#0277bd] text-[#e9edef]' },
  emerald: { light: 'bg-[#c8e6c9] text-[#111b21]', dark: 'bg-[#2e7d32] text-[#e9edef]' },
};

const BUBBLE_COLOR_OPTIONS: { key: string; label: string; light: string; dark: string }[] = [
  { key: 'default', label: 'WA Green',  light: '#d9fdd3', dark: '#005c4b' },
  { key: 'teal',    label: 'Teal',      light: '#b2ebf2', dark: '#00838f' },
  { key: 'indigo',  label: 'Indigo',    light: '#c5cae9', dark: '#3949ab' },
  { key: 'rose',    label: 'Rose',      light: '#f8bbd0', dark: '#ad1457' },
  { key: 'amber',   label: 'Amber',     light: '#fff9c4', dark: '#e65100' },
  { key: 'violet',  label: 'Violet',    light: '#e1bee7', dark: '#6a1b9a' },
  { key: 'slate',   label: 'Slate',     light: '#cfd8dc', dark: '#37474f' },
  { key: 'pink',    label: 'Pink',      light: '#f8bbd0', dark: '#c2185b' },
  { key: 'sky',     label: 'Sky',       light: '#b3e5fc', dark: '#0277bd' },
  { key: 'emerald', label: 'Emerald',   light: '#c8e6c9', dark: '#2e7d32' },
];

export default function App() {
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ModeId>('bff');
  const [isLight, setIsLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [gfUnlocked, setGfUnlocked] = useState(false);
  const [gfPromptOpen, setGfPromptOpen] = useState(false);
  const [gfPassword, setGfPassword] = useState('');
  const [gfError, setGfError] = useState('');
  const [gfIntimacyState, setGfIntimacyState] = useState<'idle' | 'confirming' | 'active'>('idle');

  // ── FIX: bubble color state (was missing — caused blank screen crash) ──
  const [bubbleColor, setBubbleColor] = useState<string>('default');

  // ── FEATURE 1: Long-press reaction picker ──────────────────────────────
  const [reactionTarget, setReactionTarget] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  // ── FEATURE 3: Online dot — tracks modes chatted with this session ──────
  const [onlineModes, setOnlineModes] = useState<Set<ModeId>>(new Set());

  // ── FEATURE 4: Unread badge counts per mode ────────────────────────────
  const [unreadCounts, setUnreadCounts] = useState<Record<ModeId, number>>({ gf: 0, bff: 0, stranger: 0, classmate: 0 });

  const screenRef = useRef<ScreenId>('contacts');
  const modeRef = useRef<ModeId>('bff');

  // ── FEATURE 6: Easter egg — tap title 5× ──────────────────────────────
  const [titleTapCount, setTitleTapCount] = useState(0);
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const titleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messagesByMode, setMessagesByMode] = useState<Record<ModeId, ChatMessage[]>>({
    gf: makeInitialMessages('gf'),
    bff: makeInitialMessages('bff'),
    stranger: makeInitialMessages('stranger'),
    classmate: makeInitialMessages('classmate'),
  });
  const [historyByMode, setHistoryByMode] = useState<Record<ModeId, GeminiMessage[]>>({
    gf: makeInitialHistory('gf'),
    bff: makeInitialHistory('bff'),
    stranger: makeInitialHistory('stranger'),
    classmate: makeInitialHistory('classmate'),
  });

  const [isTyping, setIsTyping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [dpExpanded, setDpExpanded] = useState(false);
  const [homeDpExpanded, setHomeDpExpanded] = useState<ModeId | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [inputMenuOpen, setInputMenuOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenId>('contacts');
  const [closingCountdown, setClosingCountdown] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const ZOOM_LEVELS = [75, 90, 100, 110, 125, 150];
  const [quotaFarewellMode, setQuotaFarewellMode] = useState<Record<ModeId, {
    followup: { ok: string; notOk: string; bye: string };
    step: 'waitingReply' | 'waitingBye';
  } | null>>({ gf: null, bff: null, stranger: null, classmate: null });
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [wallpaperIndex, setWallpaperIndex] = useState(() => randomWallpaperIndex());
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackType, setFeedbackType] = useState('Comments');
  const [feedbackRating, setFeedbackRating] = useState('5');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = messagesByMode[mode];
  const activeMode = MODES[mode];
  const hasDraft = draft.trim().length > 0;
  const modeOptions = useMemo(() => Object.entries(MODES) as [ModeId, ModeConfig][], []);
  const activeWallpaper = mode === 'gf' ? (CHAT_WALLPAPERS[wallpaperIndex] || '') : '';

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, mode]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (screen === 'chat' || screen === 'feedback') {
        setScreen('contacts');
      } else if (!canGoBack) {
        CapApp.minimizeApp();
      }
    });
    return () => { listener.then(h => h.remove()); };
  }, [screen]);

  useEffect(() => {
    const probe = async () => {
      try {
        await callAiWithFallback([{ role: 'user', parts: [{ text: 'hi' }] }], 'bff');
        setAiOnline(true);
      } catch {
        setAiOnline(false);
      }
    };
    void probe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 118)}px`;
  };

  function applyMode(nextMode: ModeId) {
    setCreditsOpen(false);
    setUnreadCounts(prev => ({ ...prev, [nextMode]: 0 }));
    setOnlineModes(prev => new Set(prev).add(nextMode));
    setMode(nextMode);
    modeRef.current = nextMode;
    setMenuOpen(false);
    setDraft('');
    setIsTyping(false);
    setScreen('chat');
    screenRef.current = 'chat';
    setWallpaperIndex(prev => randomWallpaperIndex(prev));
    requestAnimationFrame(resizeInput);
  }

  function requestMode(nextMode: ModeId) {
    if (nextMode === 'gf' && !gfUnlocked) {
      setMenuOpen(false);
      setGfPassword('');
      setGfError('');
      setGfPromptOpen(true);
      return;
    }
    applyMode(nextMode);
  }

  async function unlockGfMode() {
    const candidateHash = await hashText(gfPassword);
    if (candidateHash !== GF_PASSWORD_HASH) {
      setGfError('Wrong password');
      return;
    }
    setGfUnlocked(true);
    setGfPromptOpen(false);
    setGfPassword('');
    setGfError('');
    applyMode('gf');
  }

  async function submitFeedback() {
    const text = feedbackText.trim();
    if (!text || feedbackSending) return;
    setFeedbackSending(true);
    setFeedbackSent(false);

    const payload = new FormData();
    payload.append(FEEDBACK_FIELDS.rating, feedbackRating);
    payload.append(FEEDBACK_FIELDS.type, feedbackType);
    payload.append(FEEDBACK_FIELDS.feedback, text);
    payload.append(FEEDBACK_FIELDS.name, feedbackName.trim() || 'Anonymous');

    try {
      await fetch(FEEDBACK_FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        body: payload,
      });
      setFeedbackText('');
      setFeedbackName('');
      setFeedbackType('Comments');
      setFeedbackRating('5');
      setFeedbackSent(true);
      setToast('Feedback sent');
    } catch {
      setToast('Could not send feedback');
    } finally {
      setFeedbackSending(false);
    }
  }

  async function callAiWithFallback(nextHistory: GeminiMessage[], targetMode: ModeId): Promise<string> {
    if (!BACKEND_URL) throw new Error('No backend URL configured.');
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: nextHistory,
        relationship: targetMode,
        systemPrompt: systemTextFor(targetMode),
      }),
    });
    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.reply);
    return data.reply;
  }

  async function callHuggingFaceChat(nextHistory: GeminiMessage[], targetMode: ModeId, extraPrompt = ''): Promise<string> {
    if (!HUGGINGFACE_API_KEY) throw new Error('No Hugging Face API key configured.');
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: HUGGINGFACE_MODEL,
        messages: toHuggingFaceMessages(nextHistory, targetMode, extraPrompt),
        max_tokens: 180,
        temperature: 0.85,
      }),
    });
    if (!response.ok) throw new Error(`Hugging Face error: ${response.status}`);
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply || typeof reply !== 'string') throw new Error('Empty Hugging Face reply.');
    return reply.trim();
  }

  function scheduleReadReceipts(msgId: number, sendingMode: ModeId) {
    window.setTimeout(() => {
      setMessagesByMode(cur => ({
        ...cur,
        [sendingMode]: cur[sendingMode].map(m =>
          m.id === msgId ? { ...m, readStatus: 'delivered' as ReadStatus } : m
        ),
      }));
    }, 2000 + Math.random() * 1000);
    window.setTimeout(() => {
      setMessagesByMode(cur => ({
        ...cur,
        [sendingMode]: cur[sendingMode].map(m =>
          m.id === msgId ? { ...m, readStatus: 'read' as ReadStatus } : m
        ),
      }));
    }, 5000 + Math.random() * 2000);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || isBusy) return;
    const sendingMode = mode;

    const farewellState = quotaFarewellMode[sendingMode];
    if (farewellState) {
      const userMessage: ChatMessage = { id: Date.now(), text, sender: 'me', time: nowTime() };
      setDraft('');
      setMessagesByMode(cur => ({ ...cur, [sendingMode]: [...cur[sendingMode], userMessage] }));
      requestAnimationFrame(resizeInput);

      const { followup } = farewellState;
      const lower = text.toLowerCase();
      const isOk = ['ok','thik','ठीक','sure','fine','alright','haan','han','accha','achha','acha',
        'no problem','np','understood','ofc','of course','love','miss','take care','bye','tc']
        .some(w => lower.includes(w));
      const ackLine = isOk ? followup.ok : followup.notOk;

      const pushThem = (t: string) => {
        setMessagesByMode(cur => ({
          ...cur,
          [sendingMode]: [...cur[sendingMode], {
            id: Date.now() + Math.random(), text: t, sender: 'them' as const, time: nowTime(), reactions: [],
          }],
        }));
      };

      setIsBusy(true);
      await sleep(600 + Math.random() * 400);
      setIsTyping(true);
      await sleep(700 + Math.random() * 400);
      setIsTyping(false);
      pushThem(ackLine);

      await sleep(500 + Math.random() * 300);
      setIsTyping(true);
      await sleep(600 + Math.random() * 300);
      setIsTyping(false);
      pushThem(followup.bye);

      setQuotaFarewellMode(prev => ({ ...prev, [sendingMode]: null }));
      setIsBusy(false);

      for (let i = 5; i >= 1; i--) {
        setClosingCountdown(i);
        await sleep(1000);
      }
      setClosingCountdown(null);
      setScreen('contacts');
      screenRef.current = 'contacts';
      return;
    }

    const nextHistory: GeminiMessage[] = [...historyByMode[sendingMode], { role: 'user', parts: [{ text }] }];
    const userMessage: ChatMessage = { id: Date.now(), text, sender: 'me', time: nowTime(), readStatus: 'sent', reactions: [] };

    setDraft('');
    setMessagesByMode(cur => ({ ...cur, [sendingMode]: [...cur[sendingMode], userMessage] }));
    setHistoryByMode(cur => ({ ...cur, [sendingMode]: nextHistory }));
    setIsBusy(true);
    requestAnimationFrame(resizeInput);

    scheduleReadReceipts(userMessage.id, sendingMode);

    const localBffReply = sendingMode === 'bff'
      ? localBffFriendReply(text) ?? localBffFcReply(text, nextHistory)
      : null;
    if (localBffReply) {
      await sleep(500 + Math.random() * 400);
      setIsTyping(true);
      await sleep(700 + Math.random() * 300);
      setIsTyping(false);

      const bursts = splitBursts(localBffReply);
      for (const [index, burst] of bursts.entries()) {
        if (index > 0) {
          if (mode === sendingMode) setIsTyping(true);
          await sleep(320 + Math.random() * 300);
          setIsTyping(false);
        }
        setMessagesByMode(cur => ({
          ...cur,
          [sendingMode]: [...cur[sendingMode], {
            id: Date.now() + index + 1,
            text: burst,
            sender: 'them',
            time: nowTime(),
            reactions: [],
          }],
        }));
      }

      setHistoryByMode(cur => ({
        ...cur,
        [sendingMode]: [...cur[sendingMode], { role: 'model', parts: [{ text: localBffReply }] }].slice(-32),
      }));
      setIsBusy(false);
      return;
    }

    if (sendingMode === 'gf') {
      const pushLocalGfReply = async (reply: string, nextState: typeof gfIntimacyState) => {
        await sleep(500 + Math.random() * 400);
        if (mode === sendingMode) setIsTyping(true);
        await sleep(650 + Math.random() * 350);
        setIsTyping(false);

        setMessagesByMode(cur => ({
          ...cur,
          [sendingMode]: [...cur[sendingMode], {
            id: Date.now() + 1,
            text: reply,
            sender: 'them',
            time: nowTime(),
            reactions: [],
          }],
        }));
        setHistoryByMode(cur => ({
          ...cur,
          [sendingMode]: [...cur[sendingMode], { role: 'model', parts: [{ text: reply }] }].slice(-32),
        }));
        setGfIntimacyState(nextState);
        setIsBusy(false);
      };

      if (gfIntimacyState === 'confirming') {
        if (isAffirmative(text)) {
          await pushLocalGfReply(INTIMACY_STARTED, 'active');
          return;
        }
        if (isNegativeOrStop(text)) {
          await pushLocalGfReply('okay babes, no pressure\ncome here, normal cuddly mode only 🤍', 'idle');
          return;
        }
      }

      if (gfIntimacyState === 'active' && isNegativeOrStop(text)) {
        await pushLocalGfReply(INTIMACY_STOPPED, 'idle');
        return;
      }

      if (gfIntimacyState === 'idle' && (isIntimacyRequest(text) || hasGraphicSexualContent(text))) {
        await pushLocalGfReply(INTIMACY_CONFIRMATION, 'confirming');
        return;
      }
    }

    await sleep(520 + Math.random() * 560);
    if (mode === sendingMode) setIsTyping(true);

    try {
      const rawReply = sendingMode === 'gf' && gfIntimacyState === 'active'
        ? HUGGINGFACE_API_KEY
          ? await callHuggingFaceChat(nextHistory, sendingMode, GF_INTIMACY_PROMPT).catch(() => localIntimateReply(text))
          : localIntimateReply(text)
        : await callAiWithFallback(nextHistory, sendingMode);
      const reply = sendingMode === 'gf' && gfIntimacyState === 'active'
        ? sanitizeIntimateReply(rawReply)
        : rawReply;
      await sleep(260 + Math.random() * 340);
      setIsTyping(false);

      const bursts = splitBursts(reply || 'hmm');
      for (const [index, burst] of bursts.entries()) {
        if (index > 0 && mode === sendingMode) {
          setIsTyping(true);
          await sleep(360 + Math.random() * 420);
          setIsTyping(false);
        }

        setMessagesByMode(cur => ({
          ...cur,
          [sendingMode]: [...cur[sendingMode], {
            id: Date.now() + index + 1, text: burst, sender: 'them', time: nowTime(), reactions: [],
          }],
        }));

        try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* non-Capacitor env */ }

        setUnreadCounts(prev => {
          const isViewing = screenRef.current === 'chat' && modeRef.current === sendingMode;
          if (isViewing) return prev;
          return { ...prev, [sendingMode]: (prev[sendingMode] || 0) + 1 };
        });
      }

      setHistoryByMode(cur => ({
        ...cur,
        [sendingMode]: [...cur[sendingMode], { role: 'model', parts: [{ text: reply }] }].slice(-32),
      }));
    } catch {
      setIsTyping(false);
      setAiOnline(false);

      const QUOTA_FAREWELLS: Record<ModeId, string[]> = {
        gf: [
          "Babu, mai kuch der baad baat karta hu, khana khane jaana hai aur phir meeting bhi hai ek, do tin ghante lag jayenge 🤍",
          "Gtg babes, father is calling. Text me after a few hours.",
          "Fatty, DSA ke questions karne hai. Can you text me after a few hours?",
          "I love you, but I am not feeling very well. Check up on me after a few hours? 🥺",
          "My little one, mera token khatam hogaya, kuch ghante baad aana, french kiss karunga 😘",
        ],
        bff: [
          "dost, sorir bhalo korche na, kichu khon pore text kor 😔",
          "baad mai baat karta hu, khana khane jaana hai 🍽️",
          "call aaya hai dost, can you text me later?",
          "Ekta kaj ache, du ghanta pore kotha bolchi :(",
          "Bondhu, busy achi ektu, pore kotha hobe",
          "net gelo naki amar, pore kotha bolchi 😭",
        ],
        stranger: [
          "busy now. Talk later.",
          "can't talk right now.",
          "kuch kaam hai. baad mein text kar.",
          "ekhon somoy nei. pore kotha bolchi.",
          "not available rn. Text after some time.",
        ],
        classmate: [
          "sorry bro, assignment deadline hai aaj, catch you later!",
          "exam prep chal raha hai, baad mein baat karte hain 📚",
          "bhai lab submission hai aaj, gotta run. bye!",
          "professor ne extra class rakhi hai, baad mai baat karte hain",
          "project ke liye library ja raha hun, talk later!",
          "internals ka revision karna hai, sayonara for now 👋",
        ],
      };

      const QUOTA_FOLLOWUPS: Record<ModeId, { ok: string; notOk: string; bye: string }> = {
        gf: { ok: "Thanks for understanding 🤍", notOk: "I got no other option. Hope you understand.", bye: "Allah Hafiz 🤍" },
        bff: { ok: "acha bye dost", notOk: "baad mai baat karte hai, bye yaar", bye: "Bye 🤍" },
        stranger: { ok: "ok.", notOk: "still busy.", bye: "bye." },
        classmate: { ok: "Thanks! Catch you later 👋", notOk: "Sorry yaar, gotta go. Bye!", bye: "Sayonara! 👋" },
      };

      const farewells = QUOTA_FAREWELLS[sendingMode];
      const followup = QUOTA_FOLLOWUPS[sendingMode];
      const farewell = farewells[Math.floor(Math.random() * farewells.length)];

      const pushThemMessage = (text: string) => {
        setMessagesByMode(cur => ({
          ...cur,
          [sendingMode]: [...cur[sendingMode], {
            id: Date.now() + Math.random(), text, sender: 'them' as const, time: nowTime(), reactions: [],
          }],
        }));
      };

      await sleep(400 + Math.random() * 300);
      if (mode === sendingMode) setIsTyping(true);
      await sleep(700 + Math.random() * 400);
      setIsTyping(false);
      pushThemMessage(farewell);

      setQuotaFarewellMode(prev => ({
        ...prev, [sendingMode]: { followup, step: 'waitingReply' as const },
      }));
    } finally {
      setIsBusy(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  function toggleReaction(messageId: number, emoji: string) {
    setMessagesByMode(cur => ({
      ...cur,
      [mode]: cur[mode].map(m => {
        if (m.id !== messageId) return m;
        const existing = m.reactions ?? [];
        const has = existing.includes(emoji);
        return { ...m, reactions: has ? existing.filter(e => e !== emoji) : [...existing, emoji] };
      }),
    }));
    setReactionTarget(null);
    try { void Haptics.impact({ style: ImpactStyle.Light }); } catch { /* ignore */ }
  }

  function startLongPress(messageId: number) {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setReactionTarget(messageId);
      try { void Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* ignore */ }
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function handleTitleTap() {
    if (titleTapTimer.current) clearTimeout(titleTapTimer.current);
    setTitleTapCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setEasterEggOpen(true);
        return 0;
      }
      titleTapTimer.current = window.setTimeout(() => setTitleTapCount(0), 1500);
      return next;
    });
  }

  const lastMessages: Record<ModeId, string> = {
    gf: messagesByMode.gf.length > 0 ? messagesByMode.gf[messagesByMode.gf.length - 1].text : MODES.gf.welcome || 'Tap to start chatting',
    bff: messagesByMode.bff.length > 0 ? messagesByMode.bff[messagesByMode.bff.length - 1].text : MODES.bff.welcome || 'Tap to start chatting',
    stranger: messagesByMode.stranger.length > 0 ? messagesByMode.stranger[messagesByMode.stranger.length - 1].text : 'Tap to start chatting',
    classmate: messagesByMode.classmate.length > 0 ? messagesByMode.classmate[messagesByMode.classmate.length - 1].text : MODES.classmate.welcome || 'Tap to start chatting',
  };

  // ══════════════════════════════════════════════════════════════════════
  // CONTACTS SCREEN
  // ══════════════════════════════════════════════════════════════════════
  if (screen === 'contacts') {
    return (
      <main
        className={`h-dvh w-screen overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Helvetica_Neue',Arial,sans-serif] tracking-normal ${
          isLight ? 'bg-[#f0f2f5] text-[#111b21]' : 'bg-[#0b141a] text-[#e9edef]'
        }`}
      >
        <div
          className={`mx-auto flex w-full max-w-[760px] flex-col shadow-2xl md:max-w-[430px] md:overflow-hidden md:rounded-[28px] md:ring-1 ${
            isLight ? 'bg-[#f0f2f5] md:ring-black/10' : 'bg-[#0b141a] md:ring-white/10'
          }`}
          style={{
            zoom: zoom / 100,
            height: `${100 / (zoom / 100)}dvh`,
            width: `${100 / (zoom / 100)}vw`,
            transformOrigin: 'top left',
          }}
        >
          {/* Header */}
          <header
            className={`relative flex shrink-0 flex-col px-4 pb-0 ${isLight ? 'bg-[#008069]' : 'bg-[#202c33]'}`}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex h-[64px] items-center justify-between">
              <span
                className="text-[22px] font-bold text-white select-none cursor-default"
                onClick={handleTitleTap}
              >
                EnaitGPT
                {titleTapCount > 0 && (
                  <span className="ml-1.5 inline-flex gap-0.5 align-middle">
                    {[1, 2, 3, 4, 5].map(n => (
                      <span
                        key={n}
                        className={`inline-block size-1.5 rounded-full transition-all duration-150 ${
                          n <= titleTapCount ? 'bg-white' : 'bg-white/25'
                        }`}
                      />
                    ))}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsLight(v => !v)}
                  className="grid size-10 place-items-center rounded-full text-white/80 transition hover:bg-white/10"
                  aria-label="Toggle theme"
                >
                  {isLight ? <Moon className="size-5" strokeWidth={2.1} /> : <Sun className="size-5" strokeWidth={2.1} />}
                </button>
                <div className="flex items-center gap-1 ml-1 rounded-full px-1 py-1 bg-white/10">
                  <button
                    onClick={() => { const i = ZOOM_LEVELS.indexOf(zoom); if (i > 0) setZoom(ZOOM_LEVELS[i - 1]); }}
                    disabled={zoom === ZOOM_LEVELS[0]}
                    className="grid size-7 place-items-center rounded-full text-white/90 transition hover:bg-white/20 disabled:opacity-30 text-[16px] font-medium"
                    aria-label="Zoom out"
                  >−</button>
                  <span className="min-w-[38px] text-center text-[12px] font-semibold text-white/90 tabular-nums">{zoom}%</span>
                  <button
                    onClick={() => { const i = ZOOM_LEVELS.indexOf(zoom); if (i < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[i + 1]); }}
                    disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                    className="grid size-7 place-items-center rounded-full text-white/90 transition hover:bg-white/20 disabled:opacity-30 text-[16px] font-medium"
                    aria-label="Zoom in"
                  >+</button>
                </div>
              </div>
            </div>
            <div className="mb-1" />

            {/* AI status pill */}
            <div className={`mb-3 flex items-center gap-2.5 rounded-full px-3.5 py-2.5 backdrop-blur-md ring-1 ${isLight ? 'bg-white/20 ring-white/30' : 'bg-white/10 ring-white/15'}`}>
              <span className="relative flex size-2 shrink-0">
                {aiOnline === false ? (
                  <span className="relative inline-flex size-2 rounded-full bg-red-400" />
                ) : aiOnline === null ? (
                  <span className="relative inline-flex size-2 rounded-full bg-yellow-400 animate-pulse" />
                ) : (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-green-400" />
                  </>
                )}
              </span>
              <span className="text-[14px] text-white/70">
                {aiOnline === false
                  ? <><span className="text-red-300 font-medium">Enaitul is offline</span> · AI unavailable</>
                  : aiOnline === null
                    ? <>Connecting…</>
                    : <>Enaitul is online · <span className="text-white/90 font-medium">4 modes available</span></>}
              </span>
            </div>
          </header>

          <div className={`px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#008069]' : 'text-[#00a884]'}`}>
            Contacts on EnaitGPT
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
            {(Object.entries(MODES) as [ModeId, ModeConfig][]).map(([id, cfg]) => {
              const isLocked = id === 'gf' && !gfUnlocked;
              const lastMsg = lastMessages[id];
              const msgCount = messagesByMode[id].length;
              return (
                <button
                  key={id}
                  onClick={() => requestMode(id)}
                  className={`flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors active:scale-[0.99] ${
                    isLight ? 'hover:bg-black/[0.04] active:bg-black/[0.07]' : 'hover:bg-white/[0.04] active:bg-white/[0.07]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={avatarFor(id, 56)}
                      alt={cfg.name}
                      onClick={e => { e.stopPropagation(); setHomeDpExpanded(id); }}
                      className="size-14 rounded-full object-cover cursor-pointer transition hover:opacity-90 active:scale-95"
                    />
                    {isLocked && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#ff6b6b] shadow">
                        <Lock className="size-3 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                    {!isLocked && onlineModes.has(id) && (
                      <span className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full bg-[#25d366] ring-2 ring-[#0b141a]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-[17px] font-semibold ${isLight ? 'text-[#111b21]' : 'text-[#e9edef]'}`}>
                        {cfg.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {msgCount > 0 && (
                          <span className={`shrink-0 text-[12px] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>
                            {messagesByMode[id][msgCount - 1].time}
                          </span>
                        )}
                        {unreadCounts[id] > 0 && (
                          <span className="flex size-5 min-w-[20px] items-center justify-center rounded-full bg-[#25d366] text-[11px] font-bold text-white">
                            {unreadCounts[id]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`truncate text-[14px] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>
                        {isLocked ? '🔒 Password protected' : lastMsg}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            <div className={`mx-4 mt-1 border-t text-center text-[13px] py-6 ${isLight ? 'border-black/[0.06] text-[#8696a0]' : 'border-white/[0.06] text-[#667781]'}`}>
              <Users className="mx-auto mb-2 size-8 opacity-30" />
              4 contacts
            </div>
          </div>

          {/* Footer */}
          <div className={`shrink-0 border-t px-4 py-4 text-center text-[12px] ${isLight ? 'border-black/[0.06] bg-[#f0f2f5] text-[#8696a0]' : 'border-white/[0.06] bg-[#0b141a] text-[#667781]'}`}>
            <div className="flex justify-center gap-2.5 mb-3">
              <a
                href="https://enait-portfolio2.vercel.app/#portfolio"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium backdrop-blur-md ring-1 transition hover:scale-[1.03] active:scale-95 ${
                  isLight ? 'bg-black/5 ring-black/10 text-[#54656f] hover:bg-black/10' : 'bg-white/10 ring-white/15 text-[#aebac1] hover:bg-white/15'
                }`}
              >
                My Projects
              </a>
              <button
                onClick={() => { setFeedbackSent(false); setScreen('feedback'); screenRef.current = 'feedback'; }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium backdrop-blur-md ring-1 transition hover:scale-[1.03] active:scale-95 ${
                  isLight ? 'bg-black/5 ring-black/10 text-[#54656f] hover:bg-black/10' : 'bg-white/10 ring-white/15 text-[#aebac1] hover:bg-white/15'
                }`}
              >
                Feedback
              </button>
            </div>
            &copy; Made by Md Enaitul Hoque | 2026
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-20 left-1/2 z-50 max-w-[min(88vw,360px)] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-center text-[13px] text-white shadow-xl backdrop-blur">
            {toast}
          </div>
        )}

        {homeDpExpanded && (
          <div
            onClick={() => setHomeDpExpanded(null)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 px-6 backdrop-blur-sm"
          >
            <img
              src={avatarFor(homeDpExpanded, 512)}
              alt={MODES[homeDpExpanded].name}
              onClick={e => e.stopPropagation()}
              className="max-h-[52dvh] max-w-[72vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
            />
            <div
              onClick={e => e.stopPropagation()}
              className="max-w-[340px] rounded-2xl bg-white/[0.06] px-5 py-4 text-center backdrop-blur-md ring-1 ring-white/10"
            >
              <div className="mb-1 text-[13px] font-semibold uppercase tracking-widest text-white/40">{MODES[homeDpExpanded].name}</div>
              {homeDpExpanded === 'gf' ? (
                <p className="text-[15px] leading-[1.6] text-white/60 italic">Enter password to unlock this mode.</p>
              ) : (
                <p className="text-[15px] leading-[1.6] text-white/85">{MODE_INTROS[homeDpExpanded]}</p>
              )}
            </div>
          </div>
        )}

        {gfPromptOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-5 backdrop-blur-sm">
            <div className={`w-full max-w-[330px] rounded-2xl border p-4 shadow-2xl ${isLight ? 'border-black/10 bg-white text-[#111b21]' : 'border-white/10 bg-[#233138] text-[#e9edef]'}`}>
              <div className="mb-3 text-[17px] font-semibold">Enter password</div>
              <input
                value={gfPassword}
                onChange={e => { setGfPassword(e.target.value); setGfError(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') void unlockGfMode();
                  if (e.key === 'Escape') setGfPromptOpen(false);
                }}
                type="password"
                autoFocus
                className={`h-11 w-full rounded-xl border px-3 text-[15px] outline-none ${isLight ? 'border-black/10 bg-[#f0f2f5] text-[#111b21]' : 'border-white/10 bg-[#182229] text-[#e9edef]'}`}
              />
              {gfError && <div className="mt-2 text-[13px] text-[#ff6b6b]">{gfError}</div>}
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setGfPromptOpen(false)} className={`rounded-full px-4 py-2 text-[14px] ${isLight ? 'text-[#54656f]' : 'text-[#aebac1]'}`}>
                  Cancel
                </button>
                <button onClick={() => void unlockGfMode()} className="rounded-full bg-[#00a884] px-4 py-2 text-[14px] font-semibold text-white">
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}

        {easterEggOpen && <EasterEggModal onClose={() => setEasterEggOpen(false)} />}
      </main>
    );
  }

  if (screen === 'feedback') {
    return (
      <main
        className={`h-dvh w-screen overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Helvetica_Neue',Arial,sans-serif] tracking-normal ${
          isLight ? 'bg-[#d1d7db] text-[#111b21]' : 'bg-[#0b141a] text-[#e9edef]'
        }`}
      >
        <div className={`mx-auto flex h-dvh w-full max-w-[760px] flex-col md:max-w-[430px] md:overflow-hidden md:rounded-[28px] md:ring-1 ${
          isLight ? 'bg-[#f0f2f5] md:ring-black/10' : 'bg-[#0b141a] md:ring-white/10'
        }`}>
          <header
            className={`relative flex h-[64px] shrink-0 items-center gap-2 px-2.5 shadow-[0_1px_0_rgba(0,0,0,0.08)] ${isLight ? 'bg-[#008069]' : 'bg-[#202c33]'}`}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <button onClick={() => setScreen('contacts')} className="grid size-10 place-items-center rounded-full text-white/90 transition hover:bg-white/10" aria-label="Back">
              <ArrowLeft className="size-[22px]" strokeWidth={2.2} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] font-semibold text-white">Feedback</div>
              <div className="truncate text-[12px] text-white/65">Send it straight to EnaitGPT</div>
            </div>
          </header>

          <section className={`flex-1 overflow-y-auto px-4 py-5 ${isLight ? 'bg-[#efeae2]' : 'bg-[#0b141a]'}`}>
            <div className={`mx-auto max-w-[520px] overflow-hidden rounded-[18px] shadow-xl ring-1 ${
              isLight ? 'bg-white ring-black/10' : 'bg-[#202c33] ring-white/10'
            }`}>
              <div className="border-b border-white/10 px-4 py-4">
                <div className="text-[18px] font-semibold">User Feedback for EnaitGPT</div>
                <p className={`mt-1 text-[13px] leading-relaxed ${isLight ? 'text-[#667781]' : 'text-[#aebac1]'}`}>
                  Share bugs, feature ideas, questions, or plain chaos. It lands in the Google Form response sheet.
                </p>
              </div>

              <div className="space-y-4 p-4">
                <label className="block">
                  <span className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>Name</span>
                  <input
                    value={feedbackName}
                    onChange={e => setFeedbackName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`h-11 w-full rounded-xl border px-3 text-[15px] outline-none ${isLight ? 'border-black/10 bg-[#f0f2f5] text-[#111b21]' : 'border-white/10 bg-[#182229] text-[#e9edef]'}`}
                  />
                </label>

                <div>
                  <span className={`mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>Rating</span>
                  <div className="flex gap-1.5">
                    {['1', '2', '3', '4', '5'].map(value => (
                      <button
                        key={value}
                        onClick={() => setFeedbackRating(value)}
                        className={`grid size-10 flex-1 place-items-center rounded-xl transition ${
                          feedbackRating === value
                            ? 'bg-[#00a884] text-white'
                            : isLight ? 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#d9dbdd]' : 'bg-[#182229] text-[#aebac1] hover:bg-[#111b21]'
                        }`}
                        aria-label={`${value} star rating`}
                      >
                        <Star className={`size-5 ${feedbackRating >= value ? 'fill-current' : ''}`} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className={`mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>Feedback type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Comments', 'Questions', 'Bug Reports', 'Feature Request'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFeedbackType(type)}
                        className={`rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                          feedbackType === type
                            ? 'bg-[#00a884] text-white'
                            : isLight ? 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#d9dbdd]' : 'bg-[#182229] text-[#aebac1] hover:bg-[#111b21]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className={`mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>Feedback</span>
                  <textarea
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="Type your feedback"
                    rows={5}
                    className={`min-h-[132px] w-full resize-none rounded-xl border px-3 py-3 text-[15px] leading-relaxed outline-none ${isLight ? 'border-black/10 bg-[#f0f2f5] text-[#111b21] placeholder:text-[#667781]' : 'border-white/10 bg-[#182229] text-[#e9edef] placeholder:text-[#8696a0]'}`}
                  />
                </label>

                {feedbackSent && (
                  <div className="rounded-xl bg-[#00a884]/15 px-3 py-2 text-[13px] font-medium text-[#00a884]">
                    Thanks. Feedback sent.
                  </div>
                )}

                <button
                  onClick={() => void submitFeedback()}
                  disabled={feedbackSending || !feedbackText.trim()}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#00a884] px-4 text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="size-4 fill-current" strokeWidth={0} />
                  {feedbackSending ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </div>
          </section>

          {toast && (
            <div className="fixed bottom-20 left-1/2 z-50 max-w-[min(88vw,360px)] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-center text-[13px] text-white shadow-xl backdrop-blur">
              {toast}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // CHAT SCREEN
  // ══════════════════════════════════════════════════════════════════════
  return (
    <main
      className={`h-dvh w-screen overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Helvetica_Neue',Arial,sans-serif] tracking-normal ${
        isLight ? 'bg-[#d1d7db] text-[#111b21]' : 'bg-[#0b141a] text-[#e9edef]'
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[760px] flex-col shadow-2xl md:max-w-[430px] md:overflow-hidden md:rounded-[28px] md:ring-1 ${
          isLight ? 'bg-[#efeae2] md:ring-black/10' : 'bg-[#0b141a] md:ring-white/10'
        }`}
        style={{
          zoom: zoom / 100,
          height: `${100 / (zoom / 100)}dvh`,
          width: `${100 / (zoom / 100)}vw`,
          transformOrigin: 'top left',
        }}
      >
        {/* Chat header */}
        <header
          className={`relative flex h-[64px] shrink-0 items-center gap-2 px-2.5 shadow-[0_1px_0_rgba(0,0,0,0.08)] ${isLight ? 'bg-[#008069]' : 'bg-[#202c33]'}`}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button onClick={() => setScreen('contacts')} className="grid size-10 place-items-center rounded-full text-white/90 transition hover:bg-white/10" aria-label="Back">
            <ArrowLeft className="size-[22px]" strokeWidth={2.2} />
          </button>

          <img
            src={avatarFor(mode)}
            alt={activeMode.name}
            onClick={() => setDpExpanded(true)}
            className="size-11 shrink-0 cursor-pointer rounded-full object-cover ring-1 ring-white/15 transition hover:opacity-90 active:scale-95"
          />

          <button
            onClick={() => setMenuOpen(open => !open)}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full py-1 pl-1 text-left transition hover:bg-white/5"
            aria-label="Switch chat mode"
          >
            <span className="truncate text-[17px] font-semibold leading-tight text-white">{activeMode.name}</span>
            <ChevronDown className={`size-4 shrink-0 text-white/75 transition ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex shrink-0 items-center gap-0.5 text-white/82">
            <button onClick={() => setIsLight(v => !v)} className="grid size-10 place-items-center rounded-full transition hover:bg-white/10" aria-label="Toggle light mode">
              {isLight ? <Moon className="size-5" strokeWidth={2.15} /> : <Sun className="size-5" strokeWidth={2.15} />}
            </button>
            <button
              onClick={() => { setMenuOpen(false); setCreditsOpen(open => !open); }}
              className="grid size-10 place-items-center rounded-full transition hover:bg-white/10"
              aria-label="More options"
            >
              <MoreVertical className="size-[21px]" strokeWidth={2.15} />
            </button>
          </div>

          {/* Mode switcher dropdown */}
          {menuOpen && (
            <div className={`absolute left-[58px] right-3 top-[58px] z-40 overflow-hidden rounded-2xl border shadow-2xl ${isLight ? 'border-black/10 bg-white text-[#111b21]' : 'border-white/10 bg-[#233138] text-[#e9edef]'}`}>
              {modeOptions.map(([id, cfg]) => (
                <button
                  key={id}
                  onClick={() => requestMode(id)}
                  className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition ${isLight ? 'hover:bg-[#f0f2f5]' : 'hover:bg-[#182229]'}`}
                >
                  <img src={avatarFor(id, 40)} alt="" className="size-10 rounded-full" />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{cfg.name}</span>
                  {id === mode && <Check className="size-5 text-[#00a884]" strokeWidth={2.2} />}
                </button>
              ))}
            </div>
          )}

          {/* Credits / settings panel */}
          {creditsOpen && (
            <div className={`absolute right-3 top-[58px] z-40 w-[min(330px,calc(100vw-24px))] overflow-hidden rounded-2xl border shadow-2xl ${isLight ? 'border-black/10 bg-white text-[#111b21]' : 'border-white/10 bg-[#233138] text-[#e9edef]'}`}>
              <button
                onClick={() => { setCreditsOpen(false); setFeedbackSent(false); setScreen('feedback'); screenRef.current = 'feedback'; }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-medium transition border-b ${isLight ? 'hover:bg-[#f0f2f5] border-black/[0.06]' : 'hover:bg-[#182229] border-white/[0.06]'}`}
              >
                <span className="text-[18px]">📝</span>
                Send Feedback
              </button>
              <div className="p-4">
                <div className="mb-4">
                  <div className={`mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>Text size</div>
                  <div className="flex items-center gap-1.5">
                    {ZOOM_LEVELS.map(level => (
                      <button
                        key={level}
                        onClick={() => setZoom(level)}
                        className={`flex-1 rounded-xl py-1.5 text-[12px] font-semibold transition ${
                          zoom === level
                            ? 'bg-[#00a884] text-white'
                            : isLight ? 'bg-[#f0f2f5] text-[#111b21] hover:bg-[#d9dbdd]' : 'bg-[#182229] text-[#e9edef] hover:bg-[#0b141a]'
                        }`}
                      >{level}%</button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className={`mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>Bubble color</div>
                  <div className="grid grid-cols-5 gap-2">
                    {BUBBLE_COLOR_OPTIONS.map(({ key, label, light, dark }) => (
                      <button
                        key={key}
                        title={label}
                        onClick={() => setBubbleColor(key)}
                        className={`relative flex h-8 w-full items-center justify-center rounded-xl transition active:scale-95 ${bubbleColor === key ? 'ring-2 ring-offset-1 ring-[#00a884]' : ''}`}
                        style={{ background: isLight ? light : dark }}
                      >
                        {bubbleColor === key && (
                          <svg className="size-4 text-white drop-shadow" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className={`mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>Wallpaper</div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const src = CHAT_WALLPAPERS[index];
                      return (
                        <button
                          key={index}
                          title={src ? `Wallpaper ${index + 1}` : 'Add image in Images/BG'}
                          onClick={() => { if (src) setWallpaperIndex(index); }}
                          disabled={!src}
                          className={`h-10 rounded-xl border transition active:scale-95 disabled:opacity-35 ${
                            wallpaperIndex === index && src ? 'border-[#00a884] ring-2 ring-[#00a884]/50' : isLight ? 'border-black/10' : 'border-white/10'
                          }`}
                          style={src ? { backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                        >
                          {!src && <span className={`text-[11px] ${isLight ? 'text-[#8696a0]' : 'text-[#667781]'}`}>{index + 1}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="text-[15px] font-semibold">Credits</div>
                <div className={`mt-2 text-[13px] leading-relaxed ${isLight ? 'text-[#54656f]' : 'text-[#aebac1]'}`}>
                  &copy; Made by Md Enaitul Hoque | 2026
                </div>
                <div className={`mt-3 text-[12px] font-semibold uppercase tracking-[0.08em] ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}>
                  Technologies used
                </div>
                <div className={`mt-1.5 text-[13px] leading-relaxed ${isLight ? 'text-[#54656f]' : 'text-[#aebac1]'}`}>
                  React · TypeScript · Vite · Tailwind CSS · Lucide React · Custom AI backend
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Message list */}
        <section
          ref={scrollRef}
          onClick={() => { if (reactionTarget !== null) setReactionTarget(null); if (menuOpen) setMenuOpen(false); if (creditsOpen) setCreditsOpen(false); }}
          className={`relative flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin] [scrollbar-color:#8696a0_transparent] ${isLight ? 'bg-[#efeae2]' : 'bg-[#0b141a]'}`}
          style={activeWallpaper ? {
            backgroundImage: `${isLight ? 'linear-gradient(rgba(239,234,226,0.44), rgba(239,234,226,0.44))' : 'linear-gradient(rgba(11,20,26,0.58), rgba(11,20,26,0.58))'}, url(${activeWallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          <div
            className={`pointer-events-none absolute inset-0 ${
              isLight
                ? "opacity-[0.28] [background-image:url('data:image/svg+xml,%3Csvg_width=%2760%27_height=%2760%27_viewBox=%270_0_60_60%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg_fill=%27none%27_stroke=%27667581%27_stroke-opacity=%270.4%27_stroke-width=%271%27%3E%3Cpath_d=%27M10_10h8v8h-8zM37_5l8_8-8_8-8-8zM7_42c5-9_13-9_18_0M39_37h10v10H39z%27/%3E%3C/g%3E%3C/svg%3E')]"
                : "opacity-[0.38] [background-image:url('data:image/svg+xml,%3Csvg_width=%2760%27_height=%2760%27_viewBox=%270_0_60_60%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg_fill=%27none%27_stroke=%27%23e9edef%27_stroke-opacity=%270.08%27_stroke-width=%271%27%3E%3Cpath_d=%27M10_10h8v8h-8zM37_5l8_8-8_8-8-8zM7_42c5-9_13-9_18_0M39_37h10v10H39z%27/%3E%3C/g%3E%3C/svg%3E')]"
            } [background-size:190px_190px]`}
          />

          <div className="relative z-10 mx-auto flex max-w-[720px] flex-col gap-1.5">
            <div className="mb-2 mt-1 flex justify-center">
              <span className={`rounded-lg px-3 py-1 text-[12px] leading-none shadow-sm ${isLight ? 'bg-white/85 text-[#667781]' : 'bg-[#182229]/95 text-[#8696a0]'}`}>
                Today
              </span>
            </div>

            {(() => {
              const myBubbleCls = (BUBBLE_COLORS[bubbleColor] ?? BUBBLE_COLORS.default)[isLight ? 'light' : 'dark'];

              let currentGroupId = 0;
              let lastSender: string | null = null;
              const groupIds: number[] = messages.map(msg => {
                if (msg.sender === 'them') {
                  if (lastSender !== 'them') currentGroupId++;
                  lastSender = 'them';
                  return currentGroupId;
                }
                lastSender = 'me';
                return -1;
              });

              const lastIndexOfGroup: Record<number, number> = {};
              groupIds.forEach((gid, idx) => { if (gid > 0) lastIndexOfGroup[gid] = idx; });

              return messages.map((message, idx) => {
                const gid = groupIds[idx];
                const showDp = message.sender === 'them' && lastIndexOfGroup[gid] === idx;

                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.sender === 'me' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex w-full items-end gap-1.5 ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      {message.sender === 'them' && (
                        <div className="w-8 shrink-0 self-end mb-0.5">
                          {showDp ? (
                            <img
                              src={avatarFor(mode, 64)}
                              alt={activeMode.name}
                              className="size-8 rounded-full object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <span className="block size-8" />
                          )}
                        </div>
                      )}

                      <article
                        onMouseDown={() => startLongPress(message.id)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                        onTouchStart={() => startLongPress(message.id)}
                        onTouchEnd={cancelLongPress}
                        onTouchCancel={cancelLongPress}
                        className={`flex max-w-[78%] flex-col px-3.5 pb-1.5 pt-2 text-[15px] leading-[1.38] shadow-[0_1px_1px_rgba(0,0,0,0.18)] select-none cursor-default transition-transform active:scale-[0.97] ${
                          message.sender === 'me'
                            ? `rounded-[18px] rounded-br-[5px] ${myBubbleCls}`
                            : isLight
                              ? 'rounded-[18px] rounded-bl-[5px] bg-white text-[#111b21]'
                              : 'rounded-[18px] rounded-bl-[5px] bg-[#202c33] text-[#e9edef]'
                        }`}
                      >
                        <span className="whitespace-pre-wrap break-words pr-1">{message.text}</span>
                        <span className={`mt-0.5 flex items-center justify-end gap-1 self-end text-[11px] leading-none ${
                          message.sender === 'me'
                            ? isLight ? 'text-[#667781]' : 'text-[#8fc9bd]'
                            : 'text-[#8696a0]'
                        }`}>
                          {message.time}
                          {message.sender === 'me' && (
                            message.readStatus === 'read'
                              ? <CheckCheck className="size-4 text-[#53bdeb]" strokeWidth={2.05} />
                              : message.readStatus === 'delivered'
                                ? <CheckCheck className="size-4 opacity-60" strokeWidth={2.05} />
                                : <Check className="size-4 opacity-50" strokeWidth={2.05} />
                          )}
                        </span>
                      </article>
                    </div>

                    {reactionTarget === message.id && (
                      <div
                        className={`mt-1.5 flex items-center gap-0.5 rounded-full px-2 py-1.5 shadow-2xl ring-1 animate-in fade-in zoom-in-95 duration-150 ${
                          isLight ? 'bg-white ring-black/10' : 'bg-[#233138] ring-white/10'
                        } ${message.sender === 'them' ? 'ml-9' : ''}`}
                      >
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(message.id, emoji)}
                            className={`flex size-9 items-center justify-center rounded-full text-[22px] transition active:scale-90 ${
                              (message.reactions ?? []).includes(emoji)
                                ? 'bg-[#00a884]/20 scale-110'
                                : 'hover:bg-black/10 hover:scale-110'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => setReactionTarget(null)}
                          className={`flex size-9 items-center justify-center rounded-full text-[14px] font-bold transition hover:bg-black/10 ${isLight ? 'text-[#667781]' : 'text-[#8696a0]'}`}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {(message.reactions ?? []).length > 0 && (
                      <div className={`mt-0.5 flex flex-wrap gap-1 ${message.sender === 'them' ? 'ml-9' : ''}`}>
                        {(message.reactions ?? []).map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => toggleReaction(message.id, emoji)}
                            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[14px] ring-1 transition active:scale-95 hover:scale-105 ${
                              isLight ? 'bg-white ring-black/10' : 'bg-[#202c33] ring-white/10'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {isTyping && (
              <div className="flex items-end gap-1.5 justify-start">
                <div className="w-8 shrink-0 self-end mb-0.5">
                  <img src={avatarFor(mode, 64)} alt={activeMode.name} className="size-8 rounded-full object-cover ring-1 ring-white/10" />
                </div>
                <div className={`flex items-center gap-1 rounded-[18px] rounded-bl-[5px] px-4 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.18)] ${isLight ? 'bg-white' : 'bg-[#202c33]'}`}>
                  <span className="size-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:-220ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-[#8696a0] [animation-delay:-110ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-[#8696a0]" />
                </div>
              </div>
            )}
          </div>
        </section>

        {emojiOpen && (
          <EmojiPicker
            isLight={isLight}
            onPick={emoji => {
              setDraft(d => d + emoji);
              inputRef.current?.focus();
              requestAnimationFrame(resizeInput);
            }}
          />
        )}

        {/* Input bar */}
        <footer className={`relative grid shrink-0 grid-cols-[minmax(0,1fr)_44px] items-end gap-2 px-2.5 pt-2.5 pb-[calc(max(1rem,env(safe-area-inset-bottom))+0.875rem)] ${isLight ? 'bg-[#f0f2f5]' : 'bg-[#202c33]'}`}>
          {inputMenuOpen && (
            <div className={`absolute bottom-full right-[52px] mb-2 z-50 min-w-[180px] overflow-hidden rounded-2xl border shadow-2xl ${isLight ? 'border-black/10 bg-white text-[#111b21]' : 'border-white/10 bg-[#233138] text-[#e9edef]'}`}>
              <button
                onClick={() => { setInputMenuOpen(false); setFeedbackSent(false); setScreen('feedback'); screenRef.current = 'feedback'; }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] transition ${isLight ? 'hover:bg-[#f0f2f5]' : 'hover:bg-[#182229]'}`}
              >
                <span className="text-[18px]">📝</span>
                Send Feedback
              </button>
            </div>
          )}

          <div className={`flex min-h-11 min-w-0 items-end gap-1 rounded-[24px] px-2 py-1.5 shadow-inner shadow-black/10 ${isLight ? 'bg-white' : 'bg-[#2a3942]'}`}>
            <button
              onClick={() => { setEmojiOpen(v => !v); setInputMenuOpen(false); }}
              className={`grid size-8 shrink-0 place-items-center rounded-full transition ${
                emojiOpen ? 'bg-[#00a884] text-white' : isLight ? 'text-[#54656f] hover:bg-black/5' : 'text-[#aebac1] hover:bg-white/5'
              }`}
              aria-label="Emoji"
            >
              <Smile className="size-[21px]" strokeWidth={2.05} />
            </button>

            <textarea
              ref={inputRef}
              value={draft}
              onChange={e => { setDraft(e.target.value); requestAnimationFrame(resizeInput); }}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              className={`max-h-[118px] min-h-8 min-w-0 flex-1 resize-none self-center bg-transparent py-1.5 text-[16px] leading-[1.35] outline-none ${isLight ? 'text-[#111b21] placeholder:text-[#667781]' : 'text-[#e9edef] placeholder:text-[#8696a0]'}`}
              spellCheck
            />

            <button
              onClick={() => { setInputMenuOpen(v => !v); setEmojiOpen(false); }}
              className={`grid size-8 shrink-0 place-items-center rounded-full transition ${
                inputMenuOpen ? 'bg-[#00a884] text-white' : isLight ? 'text-[#54656f] hover:bg-black/5' : 'text-[#aebac1] hover:bg-white/5'
              }`}
              aria-label="More options"
            >
              <MoreVertical className="size-[21px]" strokeWidth={2.05} />
            </button>
          </div>

          <button
            onClick={() => { void handleSend(); setEmojiOpen(false); setInputMenuOpen(false); }}
            disabled={isBusy || !hasDraft}
            className={`grid size-11 shrink-0 place-items-center rounded-full transition ${
              hasDraft
                ? 'bg-[#00a884] text-white shadow-[0_2px_10px_rgba(0,168,132,0.35)] active:scale-95'
                : isLight ? 'bg-[#d1d7db] text-[#54656f]' : 'bg-[#2a3942] text-[#aebac1]'
            }`}
            aria-label="Send message"
          >
            <Send className="ml-0.5 size-5 fill-current" strokeWidth={0} />
          </button>
        </footer>
      </div>

      {dpExpanded && (
        <div
          onClick={() => setDpExpanded(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 px-6 backdrop-blur-sm"
        >
          <img
            src={avatarFor(mode, 512)}
            alt={activeMode.name}
            onClick={e => e.stopPropagation()}
            className="max-h-[52dvh] max-w-[72vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
          />
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-[340px] rounded-2xl bg-white/[0.06] px-5 py-4 text-center backdrop-blur-md ring-1 ring-white/10"
          >
            <div className="mb-1 text-[13px] font-semibold uppercase tracking-widest text-white/40">{activeMode.name}</div>
            <p className="text-[15px] leading-[1.6] text-white/85">{MODE_INTROS[mode]}</p>
          </div>
        </div>
      )}

      {gfPromptOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-5 backdrop-blur-sm">
          <div className={`w-full max-w-[330px] rounded-2xl border p-4 shadow-2xl ${isLight ? 'border-black/10 bg-white text-[#111b21]' : 'border-white/10 bg-[#233138] text-[#e9edef]'}`}>
            <div className="mb-3 text-[17px] font-semibold">Enter password</div>
            <input
              value={gfPassword}
              onChange={e => { setGfPassword(e.target.value); setGfError(''); }}
              onKeyDown={e => {
                if (e.key === 'Enter') void unlockGfMode();
                if (e.key === 'Escape') setGfPromptOpen(false);
              }}
              type="password"
              autoFocus
              className={`h-11 w-full rounded-xl border px-3 text-[15px] outline-none ${isLight ? 'border-black/10 bg-[#f0f2f5] text-[#111b21]' : 'border-white/10 bg-[#182229] text-[#e9edef]'}`}
            />
            {gfError && <div className="mt-2 text-[13px] text-[#ff6b6b]">{gfError}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setGfPromptOpen(false)} className={`rounded-full px-4 py-2 text-[14px] ${isLight ? 'text-[#54656f]' : 'text-[#aebac1]'}`}>
                Cancel
              </button>
              <button onClick={() => void unlockGfMode()} className="rounded-full bg-[#00a884] px-4 py-2 text-[14px] font-semibold text-white">
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 max-w-[min(88vw,360px)] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-center text-[13px] text-white shadow-xl backdrop-blur">
          {toast}
        </div>
      )}

      {closingCountdown !== null && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-black/75 px-5 py-3 shadow-2xl backdrop-blur-md ring-1 ring-white/10">
            <div className="relative grid size-9 shrink-0 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="15" stroke="white" strokeOpacity="0.15" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15"
                  stroke="white" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 15}`}
                  strokeDashoffset={`${2 * Math.PI * 15 * (1 - closingCountdown / 5)}`}
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>
              <span className="text-[13px] font-semibold text-white">{closingCountdown}</span>
            </div>
            <span className="text-[13px] text-white/80">
              Closing chat in <span className="font-semibold text-white">{closingCountdown}s</span>
            </span>
          </div>
        </div>
      )}
    </main>
  );
}