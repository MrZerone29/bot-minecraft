const mineflayer = require('mineflayer')
const gui = require('mineflayer-gui')

const username = 'acc'
const password = 'pass'

let loginSent = false
let logEnabled = false
let loginCount = 0
let reconnecting = false
let menuFailCount = 0
let kickCount = 0
const MAX_FAILS = 5

const comparator = (arg, item) => item.displayName.includes(arg)
const comparatorSlot = (arg, item) => item.slot === arg

function createBot() {
  reconnecting = false
  loginSent = false
  logEnabled = false
  loginCount = 0

  const bot = mineflayer.createBot({
    host: 'kingmc.vn',
    port: 25565,
    username: username,
    auth: 'offline',
    version: '1.21.1',
    checkTimeoutInterval: 30000,
    hideErrors: true
  })

  bot.loadPlugin(gui)

  bot.on('spawn', () => {
    console.log(`[+] Spawn tại server`)
    if (!loginSent) {
      loginSent = true
      setTimeout(() => {
        bot.chat(`/dn ${password}`)
        console.log('[+] Đã gửi lệnh đăng nhập')
        logEnabled = true
      }, 1500)
    }
  })

  bot.on('message', (jsonMsg) => {
    const text = jsonMsg.toString()
    if (!text) return

    if (logEnabled) console.log(`[MSG] ${text}`)

    if (text.includes('Đăng nhập thành công')) {
      loginCount++
      console.log(`[+] Thông báo đăng nhập lần ${loginCount}`)

      if (loginCount >= 2) {
        console.log('[+] Đã xác nhận vào sảnh, đợi 3s rồi mở Menu...')
        setTimeout(() => openMenu(), 3000)
      }
    }
  })

  bot.on('actionBar', (jsonMsg) => {
    const text = jsonMsg.toString()
    if (text) console.log(`[ACTIONBAR] ${text}`)
  })

  bot.on('windowOpen', (window) => {
    if (!logEnabled) return
    console.log(`[DEBUG] GUI mở`)
    window.slots.forEach((slot, i) => {
      if (slot && slot.name === 'player_head') {
        console.log(`  [SLOT ${i}] displayName: ${slot.displayName} | nbt: ${JSON.stringify(slot.nbt)}`)
      }
    })
  })

  async function openMenu() {
    console.log('[+] Đang mở Clock...')
    const query = bot.gui.Query()
      .Hotbar(comparator)
        .Open('Clock', 'right')
      .end()
      .Window(comparatorSlot)
        .Click(24)
      .close()

    const result = await query.run()

    if (result) {
      console.log('[+] Đã click KingSMP thành công! Đợi 5s...')
      menuFailCount = 0
      logEnabled = false

      setTimeout(() => {
        console.log('[+] Gửi lệnh /warp afk...')
        bot.chat('/warp afk')
        console.log('[+] Bot đang đứng yên tại AFK zone...')
      }, 5000)
    } else {
      menuFailCount++
      console.log(`[!] Mở menu thất bại lần ${menuFailCount}/${MAX_FAILS}`)

      if (menuFailCount >= MAX_FAILS) {
        console.log('[X] Mở menu thất bại quá 5 lần. Dừng bot.')
        process.exit(1)
      }

      console.log('[!] Thử lại sau 5s...')
      setTimeout(() => openMenu(), 5000)
    }
  }

  bot.on('respawn', () => {
    console.log(`[+] Chuyển server`)
  })

  bot.on('chat', (username, message) => {
    console.log(`[CHAT] <${username}> ${message}`)
  })

  bot.on('error', (err) => {
    if (!logEnabled) return
    console.log(`[ERROR] ${err.message}`)
  })

  bot.on('kicked', (reason) => {
    let text = ''
    try {
      if (typeof reason === 'object') {
        text = reason?.value?.text?.value || JSON.stringify(reason)
      } else {
        const parsed = JSON.parse(reason)
        text = parsed.text || JSON.stringify(parsed)
      }
    } catch (_) {
      text = reason
    }

    kickCount++
    console.log(`[KICKED] lần ${kickCount}/${MAX_FAILS}: ${text}`)

    if (kickCount >= MAX_FAILS) {
      console.log('[X] Bị kick quá 5 lần. Dừng bot.')
      process.exit(1)
    }

    const isAlreadyConnected = text.includes('đã kết nối') ||
                                text.includes('already connected') ||
                                text.includes('Already connected') ||
                                text.includes('lỗi nội bộ') ||
                                text.includes('nội bộ')

    if (!reconnecting) {
      reconnecting = true
      if (isAlreadyConnected) {
        console.log('[*] Server bị lag/đã kết nối, đợi 5 phút rồi thử lại...')
        setTimeout(() => createBot(), 5 * 60 * 1000)
      } else {
        console.log('[*] Reconnect sau 10 giây...')
        setTimeout(() => createBot(), 10000)
      }
    }
  })

  bot.on('end', (reason) => {
    console.log(`[*] Mất kết nối: ${reason || 'không rõ'}`)
    if (!reconnecting) {
      reconnecting = true
      console.log('[*] Reconnect sau 10 giây...')
      setTimeout(() => createBot(), 10000)
    }
  })

  return bot
}

createBot()
