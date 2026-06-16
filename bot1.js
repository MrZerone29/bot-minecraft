const mineflayer = require('mineflayer')
const gui = require('mineflayer-gui')
const { SocksClient } = require('socks')
const https = require('https')

const BOTS = [
  { username: 'acc1', password: 'pass' },
  { username: 'acc2', password: 'pass' },
]

//const PROXY_LIST_URL = 'https://raw.githubusercontent.com/proxifly/free-proxy-list/refs/heads/main/proxies/countries/VN/data.txt'
const PROXY_LIST_URL = 'https://raw.githubusercontent.com/proxifly/free-proxy-list/refs/heads/main/proxies/protocols/socks5/data.txt'
const PROXY_TEST_TIMEOUT = 500
const MC_HOST = 'sgp.kingmc.vn'
const MC_PORT = 25565
const MAX_PROXY_FAIL = 5 // số lần kick liên tiếp trước khi đổi proxy

let availableProxies = []

const comparator = (arg, item) => item.displayName.includes(arg)
const comparatorSlot = (arg, item) => item.slot === arg

// ====== Lấy + test proxy ======

function fetchProxyList(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

function parseSocks5Proxies(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const result = []

  for (const line of lines) {
    let host, port, protocol

    if (line.includes('://')) {
      const m = line.match(/^(\w+):\/\/([^:]+):(\d+)/)
      if (m) {
        protocol = m[1].toLowerCase()
        host = m[2]
        port = parseInt(m[3], 10)
      }
    } else {
      const parts = line.split(':')
      if (parts.length >= 2) {
        host = parts[0]
        port = parseInt(parts[1], 10)
        protocol = (parts[2] || 'http').toLowerCase()
      }
    }

    if (host && port && /socks5/.test(protocol || '')) {
      result.push({ host, port })
    }
  }

  return result
}

function testProxy(proxy) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), PROXY_TEST_TIMEOUT)

    SocksClient.createConnection({
      proxy: {
        host: proxy.host,
        port: proxy.port,
        type: 5
      },
      command: 'connect',
      destination: { host: MC_HOST, port: MC_PORT },
      timeout: PROXY_TEST_TIMEOUT
    }, (err, info) => {
      clearTimeout(timer)
      if (err) {
        resolve(false)
      } else {
        try { info.socket.destroy() } catch (_) {}
        resolve(true)
      }
    })
  })
}

async function loadLiveProxies() {
  console.log('[PROXY] Đang tải danh sách proxy...')
  let raw
  try {
    raw = await fetchProxyList(PROXY_LIST_URL)
  } catch (e) {
    console.log(`[PROXY] [ERROR] Lỗi tải danh sách: ${e.message}`)
    return []
  }

  const socks5List = parseSocks5Proxies(raw)
  console.log(`[PROXY] Tìm thấy ${socks5List.length} proxy socks5, đang test live...`)

  const live = []
  for (const proxy of socks5List) {
    const ok = await testProxy(proxy)
    if (ok) {
      console.log(`[PROXY] [LIVE] ${proxy.host}:${proxy.port}`)
      live.push(proxy)
    } else {
      console.log(`[PROXY] [DEAD] ${proxy.host}:${proxy.port}`)
    }
  }

  console.log(`[PROXY] Tổng số proxy live: ${live.length}`)
  return live
}

// ====== Bot ======

function printScoreboard(label, scoreboard, tag) {
  console.log(`${tag} [${label}] === ${scoreboard.name} ===`)
  const items = (scoreboard.items || [])
    .sort((a, b) => b.value - a.value)

  if (items.length === 0) {
    console.log(`${tag}   (trống)`)
    return
  }

  items.forEach(item => {
    const name = item.displayName?.toString?.() || item.name || '?'
    console.log(`${tag}   [${item.value}] ${name}`)
  })
}

function createBot(config, initialProxy) {
  let loginSent = false
  let logEnabled = false
  let loginCount = 0
  let reconnecting = false
  let proxy = initialProxy
  let proxyFailCount = 0

  const tag = `[${config.username}]`

  function logProxyStatus() {
    if (proxy) {
      console.log(`${tag} [PROXY] Sử dụng proxy ${proxy.host}:${proxy.port}`)
    } else {
      console.log(`${tag} [PROXY] Không dùng proxy (kết nối trực tiếp)`)
    }
  }

  function switchProxy(reason) {
    console.log(`${tag} [PROXY] Đổi proxy do: ${reason}`)
    const next = availableProxies.shift()
    if (next) {
      proxy = next
      proxyFailCount = 0
      console.log(`${tag} [PROXY] Proxy mới: ${proxy.host}:${proxy.port}`)
    } else {
      console.log(`${tag} [PROXY] Hết proxy dự phòng, chuyển sang kết nối trực tiếp`)
      proxy = null
      proxyFailCount = 0
    }
  }

  logProxyStatus()

  function start() {
    reconnecting = false
    loginSent = false
    logEnabled = false
    loginCount = 0

    const options = {
      host: MC_HOST,
      port: MC_PORT,
      username: config.username,
      auth: 'offline',
      version: '1.21.11',
      checkTimeoutInterval: 30000,
      hideErrors: true
    }

    if (proxy) {
      const currentProxy = proxy
      options.connect = (client) => {
        SocksClient.createConnection({
          proxy: {
            host: currentProxy.host,
            port: currentProxy.port,
            type: 5
          },
          command: 'connect',
          destination: { host: MC_HOST, port: MC_PORT }
        }, (err, info) => {
          if (err) {
            console.log(`${tag} [PROXY] [ERROR] Kết nối proxy lỗi: ${err.message}`)
            client.emit('error', err)
            return
          }
          client.setSocket(info.socket)
          client.emit('connect')
        })
      }
    }

    const bot = mineflayer.createBot(options)

    bot.loadPlugin(gui)

    bot.on('scoreboardCreated', (sb) => printScoreboard('SCOREBOARD', sb, tag))
    bot.on('scoreboardUpdated', (sb) => printScoreboard('SCOREBOARD UPDATE', sb, tag))
    bot.on('scoreboardItemUpdated', (item, sb) => {
      const name = item.displayName?.toString?.() || item.name || '?'
      console.log(`${tag} [SCOREBOARD ITEM] [${item.value}] ${name} (${sb.name})`)
    })

    bot.on('spawn', () => {
      console.log(`${tag} [+] Spawn tại server`)
      proxyFailCount = 0 // spawn thành công => proxy ổn ở bước login
      if (!loginSent) {
        loginSent = true
        setTimeout(() => {
          bot.chat(`/dn ${config.password}`)
          console.log(`${tag} [+] Đã gửi lệnh đăng nhập`)
          logEnabled = true
        }, 1500)
      }
    })

    bot.on('message', (jsonMsg) => {
      const text = jsonMsg.toString()
      if (!text) return

      if (logEnabled) console.log(`${tag} [MSG] ${text}`)

      if (text.includes('Đăng nhập thành công')) {
        loginCount++
        console.log(`${tag} [+] Thông báo đăng nhập lần ${loginCount}`)

        if (loginCount >= 2) {
          console.log(`${tag} [+] Đã xác nhận vào sảnh, đợi 3s rồi mở Menu...`)
          setTimeout(() => openMenu(), 3000)
        }
      }
    })

    bot.on('actionBar', (jsonMsg) => {
      const text = jsonMsg.toString()
      if (text) console.log(`${tag} [ACTIONBAR] ${text}`)
    })

    bot.on('windowOpen', (window) => {
      if (!logEnabled) return
      console.log(`${tag} [DEBUG] GUI mở`)
      window.slots.forEach((slot, i) => {
        if (slot && slot.name === 'player_head') {
          console.log(`${tag}   [SLOT ${i}] displayName: ${slot.displayName} | nbt: ${JSON.stringify(slot.nbt)}`)
        }
      })
    })

    async function openMenu() {
      console.log(`${tag} [+] Đang mở Clock...`)
      const query = bot.gui.Query()
        .Hotbar(comparator)
          .Open('Clock', 'right')
        .end()
        .Window(comparatorSlot)
          .Click(24)
        .close()

      const result = await query.run()

      if (result) {
        console.log(`${tag} [+] Đã click KingSMP thành công! Đợi 5s...`)
        logEnabled = false

        setTimeout(() => {
          console.log(`${tag} [+] Gửi lệnh /warp afk...`)
          bot.chat('/warp afk')
          console.log(`${tag} [+] Bot đang đứng yên tại AFK zone...`)
        }, 5000)
      } else {
        console.log(`${tag} [!] Thất bại, thử lại sau 5s...`)
        setTimeout(() => openMenu(), 5000)
      }
    }

    bot.on('respawn', () => {
      console.log(`${tag} [+] Chuyển server`)
    })

    bot.on('chat', (username, message) => {
      console.log(`${tag} [CHAT] <${username}> ${message}`)
    })

    bot.on('error', (err) => {
      if (err.code === 'EPIPE' || err.message?.includes('EPIPE')) return
      console.log(`${tag} [ERROR] ${err.message}`)
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
      console.log(`${tag} [KICKED] ${text}`)

      const isAlreadyConnected = text.includes('đã kết nối') ||
                                  text.includes('already connected') ||
                                  text.includes('Already connected') ||
                                  text.includes('lỗi nội bộ') ||
                                  text.includes('nội bộ')

      // Nếu bị kick ngay từ giai đoạn login (chưa kịp spawn) và đang dùng proxy
      // => rất có khả năng do proxy, tăng fail count
      if (proxy && !loginSent) {
        proxyFailCount++
        console.log(`${tag} [PROXY] Lần fail thứ ${proxyFailCount} với proxy ${proxy.host}:${proxy.port}`)
      }

      if (!reconnecting) {
        reconnecting = true

        if (proxy && proxyFailCount >= MAX_PROXY_FAIL) {
          switchProxy('proxy có vẻ không hoạt động với server (kick liên tục khi login)')
          console.log(`${tag} [*] Thử lại ngay với proxy/kết nối mới sau 3 giây...`)
          setTimeout(() => start(), 3000)
        } else if (isAlreadyConnected) {
          console.log(`${tag} [*] Server bị lag/đã kết nối, đợi 5 phút rồi thử lại...`)
          setTimeout(() => start(), 5 * 60 * 1000)
        } else {
          console.log(`${tag} [*] Reconnect sau 10 giây...`)
          setTimeout(() => start(), 10000)
        }
      }
    })

    bot.on('end', (reason) => {
      console.log(`${tag} [*] Mất kết nối: ${reason || 'không rõ'}`)

      if (proxy && !loginSent) {
        proxyFailCount++
        console.log(`${tag} [PROXY] Lần fail thứ ${proxyFailCount} với proxy ${proxy.host}:${proxy.port} (end: ${reason})`)
      }

      if (!reconnecting) {
        reconnecting = true

        if (proxy && proxyFailCount >= MAX_PROXY_FAIL) {
          switchProxy(`mất kết nối liên tục khi login (reason: ${reason})`)
          console.log(`${tag} [*] Thử lại ngay với proxy/kết nối mới sau 3 giây...`)
          setTimeout(() => start(), 3000)
        } else {
          console.log(`${tag} [*] Reconnect sau 10 giây...`)
          setTimeout(() => start(), 10000)
        }
      }
    })

    return bot
  }

  start()
}

// ====== Khởi động ======

async function main() {
  availableProxies = await loadLiveProxies()

  BOTS.forEach((config, i) => {
    setTimeout(() => {
      const proxy = availableProxies.shift() || null
      createBot(config, proxy)
    }, i * 3000)
  })
}

main()