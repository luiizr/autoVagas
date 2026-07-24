const imd = require('./imd');

const sources = [
  {
    id: 'imd',
    nome: 'IMD / UFRN',
    descricao: 'Editais, bolsas e vagas acadêmicas do Instituto Metrópole Digital.',
    url: imd.EDITAIS_URL,
    status: 'disponivel',
    listar: imd.listarEditais
  },
  {
    id: 'jerimum',
    nome: 'Jerimum Jobs',
    descricao: 'Vagas e oportunidades do ecossistema de tecnologia do RN.',
    url: 'https://jerimumjobs.imd.ufrn.br/',
    status: 'em-breve'
  },
  {
    id: 'linkedin',
    nome: 'LinkedIn',
    descricao: 'Oportunidades profissionais e estágios.',
    url: 'https://www.linkedin.com/jobs/',
    status: 'em-breve'
  }
];

function fontesPublicas() {
  return sources.map(({ id, nome, descricao, url, status }) => ({ id, nome, descricao, url, status }));
}

function obterFonte(id) {
  return sources.find((source) => source.id === id);
}

async function consultarFonte(id, options) {
  const source = obterFonte(id);
  if (!source) throw new Error('Fonte de vagas não encontrada.');
  if (source.status !== 'disponivel' || !source.listar) throw new Error(`${source.nome} ainda está em preparação.`);
  const vagas = await source.listar(options);
  return vagas.map((vaga) => ({ ...vaga, fonteId: source.id, fonteNome: source.nome, uid: `${source.id}:${vaga.id}` }));
}

async function listarTodas(options) {
  const active = sources.filter((source) => source.status === 'disponivel');
  const results = await Promise.all(active.map((source) => consultarFonte(source.id, options)));
  return results.flat();
}

module.exports = { fontesPublicas, consultarFonte, listarTodas, obterFonte };

