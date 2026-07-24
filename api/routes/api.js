const express = require('express');
const EventEmitter = require('events');
const { fontesPublicas, consultarFonte, listarTodas } = require('../services/sources');
const { cadastrar, listar, marcarEnviados, cancelar } = require('../services/subscriptions');
const { configurado, enviarEditais, status: whatsappStatus } = require('../services/whatsapp');

const router = express.Router();
const atualizacoes = new EventEmitter();
let ultimaAssinatura = null;

function assinaturaDasVagas(vagas) {
  return JSON.stringify(vagas.map((vaga) => ({ uid: vaga.uid, prazo: vaga.dataFinalInscricao, situacao: vaga.situacao, resultado: vaga.resultadoUrl, anexos: vaga.anexos?.map((anexo) => anexo.url) }))); 
}
function filtrarVagas(vagas, subscription) {
  return vagas.filter((vaga) =>
    (subscription.fontes || ['imd']).includes(vaga.fonteId) &&
    (!subscription.somenteGraduacao || vaga.ehGraduacao)
  );
}

async function notificarAssinatura(subscription, vagas) {
  const compativeis = filtrarVagas(vagas, subscription);
  const novos = compativeis.filter((vaga) => !subscription.editaisEnviados.includes(vaga.notificacaoId || vaga.uid));
  if (!novos.length) return { sent: false, reason: 'Nenhuma vaga nova compatível.' };
  const result = await enviarEditais(subscription.whatsapp, novos);
  if (result.sent) await marcarEnviados(subscription.id, novos.map((vaga) => vaga.notificacaoId || vaga.uid));
  return { ...result, editais: novos };
}

async function atualizarNotificacoes() {
  const vagas = await listarTodas({ force: true });
  const assinatura = assinaturaDasVagas(vagas);
  const mudou = ultimaAssinatura !== null && assinatura !== ultimaAssinatura;
  ultimaAssinatura = assinatura;
  if (mudou) atualizacoes.emit('vagas-atualizadas', { atualizadoEm: new Date().toISOString() });
  const subscriptions = await listar();
  const results = [];
  for (const subscription of subscriptions.filter((item) => item.ativo && item.consentimento)) {
    try { results.push({ id: subscription.id, ...(await notificarAssinatura(subscription, vagas)) }); }
    catch (error) { results.push({ id: subscription.id, sent: false, error: error.message }); }
  }
  return results;
}

router.get('/status', (req, res) => {
  res.json({ whatsappConfigured: configurado(), whatsappStatus: whatsappStatus() });
});

router.get('/fontes', (req, res) => res.json({ fontes: fontesPublicas() }));

router.get('/atualizacoes', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
  res.write(`event: conectado\ndata: ${JSON.stringify({ conectadoEm: new Date().toISOString() })}\n\n`);
  const onUpdate = (payload) => res.write(`event: vagas-atualizadas\ndata: ${JSON.stringify(payload)}\n\n`);
  atualizacoes.on('vagas-atualizadas', onUpdate);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(heartbeat); atualizacoes.off('vagas-atualizadas', onUpdate); });
});


router.get('/vagas', async (req, res, next) => {
  try {
    const fonte = req.query.fonte || 'imd';
    const vagas = await consultarFonte(fonte, { force: req.query.atualizar === 'true' });
    const onlyGraduation = req.query.graduacao === 'true';
    res.json({ fonte, atualizadoEm: new Date().toISOString(), vagas: onlyGraduation ? vagas.filter((item) => item.ehGraduacao) : vagas });
  } catch (error) { next(error); }
});

// Mantido para não quebrar integrações já apontadas ao endpoint inicial.
router.get('/editais', async (req, res, next) => {
  try {
    const vagas = await consultarFonte('imd', { force: req.query.atualizar === 'true' });
    res.json({ fonte: 'imd', atualizadoEm: new Date().toISOString(), editais: req.query.graduacao === 'true' ? vagas.filter((item) => item.ehGraduacao) : vagas });
  } catch (error) { next(error); }
});

router.post('/inscricoes', async (req, res, next) => {
  try {
    const subscription = await cadastrar(req.body);
    const vagas = await listarTodas();
    const notification = await notificarAssinatura(subscription, vagas);
    res.status(201).json({ subscription: { id: subscription.id, nome: subscription.nome, fontes: subscription.fontes, somenteGraduacao: subscription.somenteGraduacao }, editais: filtrarVagas(vagas, subscription), notification });
  } catch (error) { next(error); }
});

router.delete('/inscricoes/:id', async (req, res, next) => {
  try {
    if (!(await cancelar(req.params.id))) return res.status(404).json({ error: 'Cadastro não encontrado.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/admin/atualizar-notificacoes', async (req, res, next) => {
  try {
    if (!process.env.API_ADMIN_KEY || req.get('x-api-key') !== process.env.API_ADMIN_KEY) return res.status(403).json({ error: 'Não autorizado.' });
    res.json({ results: await atualizarNotificacoes() });
  } catch (error) { next(error); }
});

router.use((error, req, res, next) => {
  console.error(error);
  res.status(400).json({ error: error.message || 'Não foi possível concluir a solicitação.' });
});

router.atualizarNotificacoes = atualizarNotificacoes;
router.atualizacoes = atualizacoes;
module.exports = router;



