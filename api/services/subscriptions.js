const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'subscriptions.json');

function normalizarTelefone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) {
    throw new Error('Informe um número de WhatsApp válido, com DDD.');
  }
  return digits.startsWith('55') ? digits : `55${digits}`;
}

async function listar() {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function salvar(items) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf8');
}

async function cadastrar({ nome, telefone, fontes, somenteGraduacao, consentimento }) {
  if (!nome || String(nome).trim().length < 2) throw new Error('Informe seu nome.');
  if (consentimento !== true) throw new Error('É necessário autorizar o recebimento de alertas.');

  const fontesEscolhidas = Array.isArray(fontes) ? fontes : fontes ? [fontes] : ['imd'];
  const fontesValidas = fontesEscolhidas.filter((fonte) => fonte === 'imd');
  if (!fontesValidas.length) throw new Error('Escolha pelo menos uma fonte disponível.');
  const whatsapp = normalizarTelefone(telefone);
  const items = await listar();
  const now = new Date().toISOString();
  const previous = items.find((item) => item.whatsapp === whatsapp);
  const subscription = {
    id: previous?.id || crypto.randomUUID(),
    nome: String(nome).trim().slice(0, 100),
    whatsapp,
    fontes: fontesValidas,
    somenteGraduacao: Boolean(somenteGraduacao),
    consentimento: true,
    ativo: true,
    criadoEm: previous?.criadoEm || now,
    atualizadoEm: now,
    editaisEnviados: previous?.editaisEnviados || [],
  };
  await salvar([...items.filter((item) => item.whatsapp !== whatsapp), subscription]);
  return subscription;
}

async function marcarEnviados(subscriptionId, editalIds) {
  const items = await listar();
  const item = items.find((candidate) => candidate.id === subscriptionId);
  if (!item) return;
  item.editaisEnviados = [...new Set([...(item.editaisEnviados || []), ...editalIds])];
  item.atualizadoEm = new Date().toISOString();
  await salvar(items);
}

async function cancelar(subscriptionId) {
  const items = await listar();
  const item = items.find((candidate) => candidate.id === subscriptionId);
  if (!item) return false;
  item.ativo = false;
  item.atualizadoEm = new Date().toISOString();
  await salvar(items);
  return true;
}

module.exports = { cadastrar, listar, marcarEnviados, cancelar };
