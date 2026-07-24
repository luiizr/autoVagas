const path = require('path');

let sock = null;
let connectionStatus = 'desconectado';
let starting = null;
let reconnectTimer = null;

async function iniciarBot() {
  if (sock || starting) return starting;
  starting = (async () => {
    const baileys = await import('@whiskeysockets/baileys');
    const qrcode = require('qrcode-terminal');
    const { state, saveCreds } = await baileys.useMultiFileAuthState(path.join(__dirname, '..', 'data', 'whatsapp-session'));
    const { version } = await baileys.fetchLatestBaileysVersion();
    connectionStatus = 'aguardando QR Code';
    const socket = baileys.default({ auth: state, version, browser: ['AutoVagas', 'Chrome', '1.0.0'], syncFullHistory: false, markOnlineOnConnect: false });
    sock = socket;
    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
      if (qr) {
        connectionStatus = 'aguardando QR Code';
        console.log('\nEscaneie este QR Code em WhatsApp > Aparelhos conectados:');
        qrcode.generate(qr, { small: true });
      }
      if (connection === 'open') {
        connectionStatus = 'conectado';
        console.log('WhatsApp bot conectado.');
      }
      if (connection === 'close') {
        sock = null;
        connectionStatus = 'desconectado';
        console.warn('WhatsApp desconectado:', lastDisconnect?.error?.message || 'conexão encerrada');
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => iniciarBot().catch((error) => console.error('Erro ao reconectar WhatsApp:', error.message)), 5000);
      }
    });
  })();
  try { await starting; } finally { starting = null; }
}

function configurado() {
  return connectionStatus === 'conectado' && Boolean(sock);
}

function resumoEdital(edital) {
  return [
    edital.situacao === 'resultado_final_publicado' ? '🏁 *Resultado final publicado — IMD*' : edital.situacao === 'resultados_parciais_publicados' ? '📣 *Resultados parciais publicados — IMD*' : edital.situacao === 'aguardando_resultados_parciais' ? '⏳ *Inscrições encerradas — aguardando resultados parciais*' : '📢 *Inscrições abertas — IMD*',
    edital.titulo,
    edital.prazo && `📅 Prazo: ${edital.prazo}`,
    edital.ehGraduacao && '🎓 Indicado para graduação.',
    edital.exclusivaUfrn ? '🏛️ Exclusiva para UFRN.' : '🌍 Não identificada como exclusiva da UFRN.',
    edital.formaInscricao && `✍️ Inscrição: ${edital.formaInscricao}.`,
    edital.linkInscricao || edital.emailInscricao,
    edital.url,
    '_Leia sempre o edital e os anexos oficiais._'
  ].filter(Boolean).join('\n');
}

async function enviarEditais(whatsapp, editais) {
  if (!configurado()) return { sent: false, reason: `Bot do WhatsApp ${connectionStatus}.` };
  for (const edital of editais) {
    await sock.sendMessage(`${whatsapp.replace(/\D/g, '')}@s.whatsapp.net`, { text: resumoEdital(edital) });
  }
  return { sent: true, count: editais.length };
}

function status() { return connectionStatus; }
module.exports = { iniciarBot, configurado, enviarEditais, status };


