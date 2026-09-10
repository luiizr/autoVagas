const pdfParse = require('pdf-parse');

const EDITAIS_URL = 'https://www.imd.ufrn.br/portal/editais';
const BASE_URL = 'https://www.imd.ufrn.br';
const CACHE_MS = 5 * 60 * 1000;
let cache = null;

function limparHtml(value = '') {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, decimal) =>
      String.fromCharCode(parseInt(hex || decimal, hex ? 16 : 10)),
    )
    .replace(/\s+/g, ' ')
    .trim();
}
function urlAbsoluta(value) {
  try {
    return new URL(String(value).replace(/&amp;/gi, '&'), BASE_URL).toString();
  } catch {
    return null;
  }
}
async function buscar(url, binary = false) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AutoVagas/1.0 (consulta pública de editais)',
      Accept: binary ? 'application/pdf,*/*' : 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`IMD retornou ${response.status} ao consultar ${url}.`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}
function extrairLinksDeEditais(html) {
  const aberto =
    html.match(/Em\s+andamento([\s\S]*?)(?:Encerrados|<h[1-6][^>]*>\s*Encerrados)/i)?.[1] || html;
  const links = [];
  const regex = /<a\b[^>]*href=["']([^"']*\/visualizar\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(aberto))) {
    const url = urlAbsoluta(match[1]);
    const texto = limparHtml(match[2]);
    const id = url?.match(/\/visualizar\/(\d+)/)?.[1];
    if (!url || !id || !texto || links.some((item) => item.id === id)) continue;
    links.push({
      id,
      url,
      titulo: texto.split(/Inscri[cç][õo]es\s+at[eé]/i)[0].trim() || texto,
      resumo: texto,
      prazo: texto.match(/Inscri[cç][õo]es\s+at[eé]\s+([0-3]?\d\/\d{2}\/\d{4})/i)?.[1] || null,
    });
  }
  return links;
}
function tipoAnexo(nome) {
  if (/resultado|homologa[cç][aã]o|classifica[cç][aã]o|lista\s+final/i.test(nome)) return 'resultado';
  if (/edital|sele[cç][aã]o|retifica[cç][aã]o|prorroga[cç][aã]o/i.test(nome)) return 'edital';
  return 'outro';
}
function extrairLinksAnexos(html) {
  const links = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const url = urlAbsoluta(match[1]);
    const nome = limparHtml(match[2]);
    if (
      !url ||
      !/(download|arquivo|anexo|edital|\.pdf(?:$|\?))/i.test(`${url} ${nome}`) ||
      links.some((item) => item.url === url)
    )
      continue;
    links.push({ nome: nome || 'Anexo do edital', url, tipo: tipoAnexo(nome || url) });
  }
  return links.slice(0, 8);
}
function trecho(texto, expressao, tamanho = 850) {
  const found = expressao.exec(texto);
  return found
    ? texto
        .slice(found.index, found.index + tamanho)
        .replace(/\s+/g, ' ')
        .trim()
    : null;
}
const meses = {
  janeiro: '01',
  fevereiro: '02',
  marco: '03',
  março: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12',
};
function datasNoTexto(texto) {
  const datas = [];
  const regex =
    /\b([0-3]?\d\/\d{2}\/\d{4}|([0-3]?\d)\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4}))\b/gi;
  let match;
  while ((match = regex.exec(texto))) {
    if (match[2]) datas.push(`${match[2].padStart(2, '0')}/${meses[match[3].toLowerCase()]}/${match[4]}`);
    else datas.push(match[1]);
  }
  return datas;
}
function extrairDataFinalInscricao(texto) {
  const contextos =
    texto.match(
      /(?:inscri[cç](?:[aã]o|[õo]es?)|prazo\s+(?:para\s+)?inscri[cç](?:[aã]o|[õo]es?))[\s\S]{0,420}/gi,
    ) || [];
  for (const contexto of contextos) {
    const datas = datasNoTexto(contexto);
    if (datas.length) return datas.at(-1);
  }
  return null;
}
function extrairInscricao(texto) {
  const form = texto
    .match(/https?:\/\/(?:forms\.gle\/|docs\.google\.com\/forms\/|selecao\.imd\.ufrn\.br\/?)[^\s)<]*/i)?.[0]
    ?.replace(/[.,;:]+$/, '');
  if (form) return { formaInscricao: 'formulário online', linkInscricao: form, emailInscricao: null };

  const instrucaoEmail =
    /(?:inscri[cç](?:[aã]o|[õo]es?)|envi(?:o|ar)|encaminh(?:ar|amento))[^.!?]{0,220}?(?:por|via|atrav[eé]s\s+de)?\s*(?:correio\s+eletr[oô]nico|e-?mail)[^\w@]{0,40}([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i.exec(
      texto,
    ) ||
    /(?:correio\s+eletr[oô]nico|e-?mail)[^\w@]{0,40}([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})[^.!?]{0,180}(?:inscri[cç](?:[aã]o|[õo]es?)|document)/i.exec(
      texto,
    );
  if (instrucaoEmail)
    return { formaInscricao: 'e-mail', linkInscricao: null, emailInscricao: instrucaoEmail[1] };
  return { formaInscricao: 'consulte o edital', linkInscricao: null, emailInscricao: null };
}
function extrairValor(texto) {
  return texto.match(/R\$\s*[\d.]+(?:,\d{2})?/i)?.[0]?.replace(/\s+/g, ' ') || null;
}
function extrairPeriodoVaga(texto) {
  const match = texto.match(
    /(?:per[ií]odo\s+de\s+vig[eê]ncia|vig[eê]ncia\s+(?:da\s+)?bolsa|dura[cç][aã]o\s+(?:da\s+)?bolsa|per[ií]odo\s+da\s+bolsa)\s*[:\-]?\s*(.{0,110}?\b(?:dias?|meses?|anos?)\b)/i,
  );
  return match ? match[0].replace(/\s+/g, ' ').trim() : null;
}
function extrairProcesso(texto, fallback) {
  return (
    texto
      .match(
        /(?:processo\s+seletivo(?:\s+simplificado)?|edital\s+(?:de\s+)?sele[cç][aã]o)[^.!?]{0,180}/i,
      )?.[0]
      ?.trim() || fallback
  );
}
function dataJaPassou(data) {
  if (!data) return false;
  const [dia, mes, ano] = data.split('/').map(Number);
  if (!ano || !mes || !dia) return false;
  const agora = new Date();
  return new Date(ano, mes - 1, dia, 23, 59, 59) < agora;
}
function possuiListaDeCandidatos(texto, indiceResultado) {
  const amostra = texto.slice(indiceResultado, indiceResultado + 6500);
  const temCabecalho =
    /(?:nome\s+(?:do|d[ao]s?)?\s*candidat|lista\s+(?:de\s+)?(?:candidat|inscrit|aprovad|classificad|homologad)|candidat(?:os|as)?\s+(?:aprovad|classificad|homologad)|classifica[cç][aã]o\s+(?:final|preliminar))/i.test(
      amostra,
    );
  if (!temCabecalho) return false;
  const nomes =
    amostra.match(/\b[A-ZÀ-Ý]{2,}(?:\s+(?:DE|DA|DO|DAS|DOS|E))?(?:\s+[A-ZÀ-Ý]{2,}){1,4}\b/g) || [];
  const ignorar =
    /MINISTÉRIO|EDUCAÇÃO|UNIVERSIDADE|FEDERAL|RIO GRANDE|INSTITUTO|METRÓPOLE|DIGITAL|PROCESSO|SELETIVO|RESULTADO|EDITAL|ANEXO|CANDIDATO|INSCRIÇÃO|COMISSÃO|CLASSIFICAÇÃO|HOMOLOGAÇÃO|CRONOGRAMA|COORDENAÇÃO|PROJETO/;
  return nomes.filter((nome) => !ignorar.test(nome)).length >= 2;
}
function identificarResultadoComLista(anexos) {
  for (const anexo of anexos) {
    const texto = anexo.texto || '';
    const cabecalho = texto.slice(0, 2200);
    const match =
      /(?:resultado\s+(?:preliminar|parcial|final|definitivo)|homologa[cç][aã]o\s+(?:das\s+)?inscri[cç][õo]es|lista\s+(?:de\s+)?(?:candidat|aprovad|classificad|homologad)|classifica[cç][aã]o\s+(?:final|preliminar))/i.exec(
        cabecalho,
      );
    if (!match || !possuiListaDeCandidatos(texto, match.index)) continue;
    return {
      url: anexo.url,
      situacao: /resultado\s+(?:final|definitivo)|classifica[cç][aã]o\s+final/i.test(match[0])
        ? 'resultado_final_publicado'
        : 'resultados_parciais_publicados',
    };
  }
  return null;
}
function extrairExclusividadeUfrn(texto) {
  const campoExplicito =
    /vaga\s+exclusiva\s+para\s+(?:pessoas?|discentes?|estudantes?)(?:\s+da)?\s+UFRN\s*[:\-]?\s*(sim|n[aã]o)/i.exec(
      texto,
    );
  if (campoExplicito) return /^sim$/i.test(campoExplicito[1]);
  return /exclusiv[oa][^.!?]{0,160}(?:UFRN|Universidade Federal do Rio Grande do Norte)|(?:alun[oa]s?|discentes?)\s+(?:regularmente\s+)?(?:matriculad[oa]s?\s+)?(?:na|no)\s+UFRN/i.test(
    texto,
  );
}
async function textoDoPdf(anexo) {
  if (!/\.pdf(?:$|\?)/i.test(anexo.url) && !/downloadPorNome/i.test(anexo.url)) return '';
  try {
    const buffer = await buscar(anexo.url, true);
    if (buffer.length > 8 * 1024 * 1024) return '';
    return String((await pdfParse(buffer)).text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30000);
  } catch {
    return '';
  }
}
function textoEntre(texto, inicio, fim) {
  const start = texto.search(inicio);
  if (start < 0) return null;
  const trechoInicial = texto.slice(start).replace(inicio, '').trim();
  const end = trechoInicial.search(fim);
  return limparTrechoPdf(end >= 0 ? trechoInicial.slice(0, end) : trechoInicial);
}
function extrairDetalhesDaVaga(texto) {
  const numeroVagas = /n[uú]mero\s+de\s+vagas\s+(\d+)/i.exec(texto)?.[1] || null;
  const cadastroReserva = /cadastro\s+de\s+reserva\s+(sim|n[aã]o)/i.exec(texto)?.[1] || null;
  const cargaHoraria = /carga\s+hor[aá]ria\s+semanal\s+([^\s]+(?:\s*horas?)?)/i.exec(texto)?.[1] || null;
  const turno = textoEntre(
    texto,
    /turno\s+de\s+trabalho/i,
    /modalidade\s+de\s+trabalho|dura[cç][aã]o\s+da\s+bolsa/i,
  );
  const modalidadeTrabalho = textoEntre(
    texto,
    /modalidade\s+de\s+trabalho/i,
    /dura[cç][aã]o\s+da\s+bolsa|forma[cç][aã]o\s+necess[aá]ria/i,
  );
  const tipoBolsa = textoEntre(
    texto,
    /tipo\s+de\s+bolsa/i,
    /n[uú]mero\s+de\s+vagas|cadastro\s+de\s+reserva/i,
  );
  const formacao = textoEntre(
    texto,
    /forma[cç][aã]o\s+necess[aá]ria/i,
    /requisitos\s+b[aá]sicos|conhecimentos\s+necess[aá]rios/i,
  );
  const requisitosBasicos = textoEntre(
    texto,
    /requisitos\s+b[aá]sicos/i,
    /conhecimentos\s+necess[aá]rios|habilidades\s+desej[aá]veis|5\.\s*das\s+inscri[cç]/i,
  );
  return {
    numeroVagas,
    cadastroReserva,
    cargaHoraria,
    turno: turno?.slice(0, 100) || null,
    modalidadeTrabalho: modalidadeTrabalho?.slice(0, 100) || null,
    tipoBolsa: tipoBolsa?.slice(0, 100) || null,
    formacao: formacao?.slice(0, 400) || null,
    requisitosBasicos: requisitosBasicos?.slice(0, 700) || null,
  };
}
function limparTrechoPdf(texto) {
  return String(texto || '')
    .replace(/MINIST[ÉE]RIO[\s\S]{0,350}?www\.imd\.ufrn\.br/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function extrairExperienciaDaVaga(texto) {
  const conhecimentosNecessarios = textoEntre(
    texto,
    /conhecimentos?\s+necess[aá]rios?/i,
    /principais\s+atividades\s+a\s+serem\s+executadas|documentos\s+exigidos|perfil\s*\d+/i,
  );
  const atividadesVaga = textoEntre(
    texto,
    /principais\s+atividades\s+a\s+serem\s+executadas/i,
    /documentos\s+exigidos|perfil\s*\d+/i,
  );
  return {
    conhecimentosNecessarios: conhecimentosNecessarios?.slice(0, 2400) || null,
    atividadesVaga: atividadesVaga?.slice(0, 1500) || null,
  };
}
function extrairPerfisVaga(texto) {
  const marcadores = Array.from(texto.matchAll(/PERFIL\s*\d+\s*[–-]\s*/gi));
  return marcadores
    .map((marcador, indice) => {
      const inicio = marcador.index;
      const fim = marcadores[indice + 1]?.index || texto.length;
      const bloco = texto.slice(inicio, fim);
      const tituloPerfil = limparTrechoPdf(bloco.slice(0, bloco.search(/tipo\s+de\s+bolsa/i))).replace(
        /^PERFIL\s*\d+\s*[–-]\s*/i,
        '',
      );
      const detalhes = extrairDetalhesDaVaga(bloco);
      const experiencia = extrairExperienciaDaVaga(bloco);
      return { tituloPerfil: tituloPerfil || `Perfil ${indice + 1}`, ...detalhes, ...experiencia };
    })
    .filter((perfil) => perfil.tituloPerfil || perfil.conhecimentosNecessarios || perfil.atividadesVaga);
}
function extrairDocumentosInscricao(texto) {
  return (
    texto
      .match(
        /(?:mandat[oó]rio|obrigat[oó]rio)[^.!?]{0,100}documentos?\s*:\s*([\s\S]{0,300}?)(?=5\.2\.|a\s+responsabilidade)/i,
      )?.[1]
      ?.replace(/\s+/g, ' ')
      .trim() || null
  );
}
function extrairEtapasSelecao(texto) {
  return (
    texto
      .match(/processo\s+seletivo\s+ser[aá]\s+realizado[^.!?]{0,420}/i)?.[0]
      ?.replace(/\s+/g, ' ')
      .trim() || null
  );
}
function extrairPrevisaoResultado(texto) {
  const contexto =
    texto.match(/[\s\S]{0,140}divulga[cç][aã]o\s+do\s+resultado\s+do\s+processo\s+seletivo/i)?.[0] || '';
  return datasNoTexto(contexto).at(-1) || null;
}
function extrairInicioInscricao(texto) {
  const contexto = texto.match(/(?:inscri[cç](?:[aã]o|[õo]es?))[\s\S]{0,420}/i)?.[0] || '';
  return datasNoTexto(contexto).at(0) || null;
}
async function detalhar(item) {
  const html = await buscar(item.url);
  const textoPagina = limparHtml(html).split(/\bOutros Editais\b/i)[0];
  const anexosComTexto = await Promise.all(
    extrairLinksAnexos(html).map(async (anexo) => ({ ...anexo, texto: await textoDoPdf(anexo) })),
  );
  const anexoPrincipal =
    anexosComTexto.find((anexo) => anexo.tipo === 'edital' && anexo.texto) ||
    anexosComTexto.find((anexo) => anexo.texto) ||
    null;
  const textoVerdade = anexoPrincipal?.texto || textoPagina;
  const textoComplementar = anexosComTexto
    .map((anexo) => anexo.texto)
    .filter(Boolean)
    .join(' ');
  const dataInicioInscricao =
    extrairInicioInscricao(textoVerdade) || extrairInicioInscricao(textoComplementar);
  const dataFinalInscricao =
    extrairDataFinalInscricao(textoVerdade) || extrairDataFinalInscricao(textoComplementar);
  const perfisVaga = extrairPerfisVaga(textoVerdade);
  const detalhesVaga = perfisVaga[0] || extrairDetalhesDaVaga(textoVerdade);
  const experienciaVaga = perfisVaga[0] || extrairExperienciaDaVaga(textoVerdade);
  const documentosInscricao = extrairDocumentosInscricao(textoVerdade);
  const etapasSelecao = extrairEtapasSelecao(textoVerdade);
  const previsaoResultado = extrairPrevisaoResultado(textoVerdade);
  const resultadoAnexo = identificarResultadoComLista(anexosComTexto);
  const prazoEncerrado = dataJaPassou(dataFinalInscricao);
  const situacao = dataFinalInscricao
    ? prazoEncerrado
      ? resultadoAnexo
        ? resultadoAnexo.situacao
        : 'aguardando_resultados_parciais'
      : 'inscricoes_abertas'
    : resultadoAnexo
      ? resultadoAnexo.situacao
      : 'prazo_a_confirmar';
  const inscricao = extrairInscricao(textoVerdade);
  const requisitos = trecho(
    textoVerdade,
    /(?:dos\s+)?requisitos|perfil\s+(?:do\s+)?candidat|poder[aã]o\s+se\s+candidatar|para\s+participar/i,
  );
  const requisitosEstruturados = detalhesVaga.requisitosBasicos || requisitos;
  const exclusivaUfrn = extrairExclusividadeUfrn(textoVerdade);
  const ehGraduacao = /gradu[aã]c[aã]o|graduando|gradua[cç][aã]o/i.test(`${item.resumo} ${textoVerdade}`);
  const possuiDadosAnexo = Boolean(
    anexoPrincipal &&
    [
      extrairValor(textoVerdade),
      inscricao.linkInscricao,
      inscricao.emailInscricao,
      detalhesVaga.numeroVagas,
      perfisVaga.length,
    ].some(Boolean),
  );
  return {
    ...item,
    prazo: dataFinalInscricao,
    dataInicioInscricao,
    dataFinalInscricao,
    valorVaga: extrairValor(textoVerdade),
    periodoVaga: extrairPeriodoVaga(textoVerdade),
    possuiDadosAnexo,
    documentosInscricao,
    etapasSelecao,
    previsaoResultado,
    perfisVaga,
    ...experienciaVaga,
    ...detalhesVaga,
    processoSeletivo: extrairProcesso(textoVerdade, item.titulo),
    periodo:
      textoPagina.match(
        /Per[ií]odo\s+do\s+Processo\s*:\s*([0-3]?\d\/\d{2}\/\d{4}\s*-\s*[0-3]?\d\/\d{2}\/\d{4})/i,
      )?.[1] || null,
    ehGraduacao,
    exclusivaUfrn,
    requisitos:
      requisitosEstruturados ||
      'Os requisitos não foram identificados automaticamente; consulte o anexo oficial.',
    anexos: anexosComTexto.map(({ texto, ...anexo }) => anexo),
    anexoPrincipal: anexoPrincipal ? { nome: anexoPrincipal.nome, url: anexoPrincipal.url } : null,
    resultadoUrl: resultadoAnexo?.url || null,
    situacao,
    fonteAnexo: anexoPrincipal
      ? `anexo principal: ${anexoPrincipal.nome}`
      : 'página pública do edital (sem anexo legível)',
    ...inscricao,
    atualizadoEm: new Date().toISOString(),
    notificacaoId: `${item.id}:${situacao}:${resultadoAnexo?.url || dataFinalInscricao || 'sem-data'}`,
  };
}
async function listarEditais({ force = false } = {}) {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const cards = extrairLinksDeEditais(await buscar(EDITAIS_URL));
  const results = await Promise.allSettled(cards.map(detalhar));
  const data = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (!data.length && cards.length)
    throw new Error('Não foi possível analisar os editais do IMD neste momento.');
  cache = { at: Date.now(), data };
  return data;
}
module.exports = { listarEditais, EDITAIS_URL };
