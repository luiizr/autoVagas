const cards = document.querySelector('#cards');
const loading = document.querySelector('#loading');
const form = document.querySelector('#signup-form');
const message = document.querySelector('#form-message');
const sourceOptions = document.querySelector('#source-options');
const selectedSourceName = document.querySelector('#selected-source-name');
const vacancyEyebrow = document.querySelector('#vacancies-eyebrow');
const filterToggle = document.querySelector('#toggle-filters');
const filterPanel = document.querySelector('#filter-panel');
const filterCount = document.querySelector('#filter-count');
const filterSummary = document.querySelector('#filter-summary');
let selectedSource = 'imd'; let sources = []; let vagasAtuais = [];
const filterInputs = { open: document.querySelector('#filter-open'), result: document.querySelector('#filter-result'), waiting: document.querySelector('#filter-waiting'), deadline: document.querySelector('#filter-deadline'), value: document.querySelector('#filter-value') };
const situacoes = { inscricoes_abertas: 'INSCRIÇÕES ABERTAS', aguardando_resultados_parciais: 'AGUARDANDO RESULTADOS PARCIAIS', resultados_parciais_publicados: 'RESULTADOS PARCIAIS PUBLICADOS', resultado_final_publicado: 'RESULTADO FINAL PUBLICADO', prazo_a_confirmar: 'PRAZO A CONFIRMAR' };
function escapeHtml(text = '') { return String(text).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
function currentSource() { return sources.find((source) => source.id === selectedSource); }
function situacaoDa(vaga) { return vaga.situacao || 'inscricoes_abertas'; }
function dataAindaValida(data) { if (!data) return false; const [dia, mes, ano] = String(data).split('/').map(Number); return Boolean(ano && mes && dia) && new Date(ano, mes - 1, dia, 23, 59, 59) >= new Date(); }
function valorNumerico(valor) { return Number(String(valor || '').replace(/[R$\s.]/g, '').replace(',', '.')) || 0; }
function filtrosAtivos() { return { open: filterInputs.open.checked, result: filterInputs.result.checked, waiting: filterInputs.waiting.checked, deadline: filterInputs.deadline.checked, institution: document.querySelector('input[name="institution"]:checked').value, value: Number(filterInputs.value.value) || 0 }; }
function filtrarVagas() {
  const filters = filtrosAtivos(); const etapas = [];
  if (filters.open) etapas.push('inscricoes_abertas'); if (filters.result) etapas.push('resultados_parciais_publicados', 'resultado_final_publicado'); if (filters.waiting) etapas.push('aguardando_resultados_parciais');
  return vagasAtuais.filter((vaga) => {
    if (etapas.length && !etapas.includes(situacaoDa(vaga))) return false;
    if (filters.deadline && !dataAindaValida(vaga.dataFinalInscricao || vaga.prazo)) return false;
    if (filters.institution === 'exclusive' && !vaga.exclusivaUfrn) return false;
    if (filters.institution === 'other' && vaga.exclusivaUfrn) return false;
    if (filters.value && valorNumerico(vaga.valorVaga) < filters.value) return false;
    return true;
  });
}
function card(vaga) {
  const detalhes = [['Inscrições até', vaga.dataFinalInscricao || vaga.prazo || 'Consulte o anexo'], ['Valor da vaga', vaga.valorVaga || 'Não informado'], ['Inscrição', vaga.formaInscricao || 'Consulte o anexo'], ['Processo', vaga.processoSeletivo || 'Consulte o anexo']];
  const inscricao = vaga.linkInscricao ? `<a href="${escapeHtml(vaga.linkInscricao)}" target="_blank" rel="noopener">Abrir formulário ↗</a>` : vaga.emailInscricao ? `<span>${escapeHtml(vaga.emailInscricao)}</span>` : '';
  const resultado = vaga.resultadoUrl ? `<a href="${escapeHtml(vaga.resultadoUrl)}" target="_blank" rel="noopener">Ver resultado ↗</a>` : '';
  return `<article class="card status-${escapeHtml(situacaoDa(vaga))}"><div class="card-top"><div class="badges"><span>${escapeHtml(situacoes[situacaoDa(vaga)] || situacoes.inscricoes_abertas)}</span>${vaga.ehGraduacao ? '<span>GRADUAÇÃO</span>' : ''}${vaga.exclusivaUfrn ? '<span>EXCLUSIVA UFRN</span>' : ''}</div></div><h3>${escapeHtml(vaga.titulo)}</h3><dl class="meta-grid">${detalhes.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${vaga.periodoVaga ? `<p class="periodo-vaga"><strong>Período:</strong> ${escapeHtml(vaga.periodoVaga)}</p>` : ''}<p class="requirements">${escapeHtml(vaga.requisitos)}</p><div class="card-bottom"><small>Base: ${escapeHtml(vaga.fonteAnexo)}</small><div class="card-links">${inscricao}${resultado}<a href="${escapeHtml(vaga.url)}" target="_blank" rel="noopener">Edital oficial ↗</a></div></div></article>`;
}
function renderVagas() { const vagas = filtrarVagas(); cards.innerHTML = vagas.length ? vagas.map(card).join('') : '<div class="empty-state"><strong>Nenhuma vaga encontrada.</strong><span>Ajuste ou limpe os filtros para ver outras oportunidades.</span></div>'; const activeFilters = filtrosAtivos(); const active = [activeFilters.open, activeFilters.result, activeFilters.waiting, activeFilters.deadline, activeFilters.institution !== 'all', activeFilters.value > 0].filter(Boolean).length; filterCount.textContent = active; filterSummary.textContent = `${vagas.length} vaga${vagas.length === 1 ? '' : 's'} encontrada${vagas.length === 1 ? '' : 's'}`; }
function renderSources() { sourceOptions.innerHTML = sources.map((source) => { const available = source.status === 'disponivel'; const selected = source.id === selectedSource; return `<button class="source-option ${selected ? 'selected' : ''}" type="button" data-source="${escapeHtml(source.id)}" ${available ? '' : 'disabled'}><span class="source-status">${available ? 'DISPONÍVEL' : 'EM BREVE'}</span><strong>${escapeHtml(source.nome)}</strong><small>${escapeHtml(source.descricao)}</small>${available ? '<span class="source-action">Ver vagas →</span>' : '<span class="source-action">Integração em preparação</span>'}</button>`; }).join(''); }
function updateSourceLabels() { const source = currentSource(); selectedSourceName.textContent = source?.nome || 'Fonte de vagas'; vacancyEyebrow.textContent = source?.nome || 'VAGAS'; }
async function loadVagas(force = false) { loading.hidden = false; cards.innerHTML = ''; try { const response = await fetch(`/api/vagas?fonte=${encodeURIComponent(selectedSource)}${force ? '&atualizar=true' : ''}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); vagasAtuais = data.vagas; loading.hidden = true; renderVagas(); } catch (error) { loading.textContent = `Não foi possível consultar as vagas: ${error.message}`; } }
async function loadSources() { try { const response = await fetch('/api/fontes'); const data = await response.json(); if (!response.ok) throw new Error(data.error); sources = data.fontes; if (!sources.some((source) => source.id === selectedSource && source.status === 'disponivel')) selectedSource = sources.find((source) => source.status === 'disponivel')?.id; renderSources(); updateSourceLabels(); loadVagas(); } catch (error) { sourceOptions.textContent = `Não foi possível carregar as fontes: ${error.message}`; } }
sourceOptions.addEventListener('click', (event) => { const option = event.target.closest('[data-source]'); if (!option || option.disabled || option.dataset.source === selectedSource) return; selectedSource = option.dataset.source; renderSources(); updateSourceLabels(); loadVagas(); });
filterToggle.addEventListener('click', () => { const willOpen = filterPanel.hidden; filterPanel.hidden = !willOpen; filterToggle.setAttribute('aria-expanded', String(willOpen)); filterToggle.classList.toggle('is-open', willOpen); });
document.querySelector('#apply-filters').addEventListener('click', () => { renderVagas(); filterPanel.hidden = true; filterToggle.setAttribute('aria-expanded', 'false'); filterToggle.classList.remove('is-open'); });
document.querySelector('#clear-filters').addEventListener('click', () => { Object.values(filterInputs).forEach((input) => { if (input.type === 'checkbox') input.checked = false; else input.value = ''; }); document.querySelector('#filter-institution-all').checked = true; renderVagas(); });
form.addEventListener('submit', async (event) => { event.preventDefault(); message.textContent = 'Cadastrando e consultando as vagas…'; const data = Object.fromEntries(new FormData(form)); data.consentimento = form.elements.consentimento.checked; data.somenteGraduacao = form.elements.somenteGraduacao.checked; data.fontes = [selectedSource]; try { const response = await fetch('/api/inscricoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); localStorage.setItem('autovagas-subscription', result.subscription.id); message.textContent = result.notification.sent ? 'Cadastro concluído. As atualizações foram enviadas para seu WhatsApp.' : 'Cadastro concluído. As vagas encontradas estão listadas abaixo; os avisos serão enviados quando o bot estiver conectado.'; vagasAtuais = result.editais; renderVagas(); loading.hidden = true; } catch (error) { message.textContent = error.message; } });
document.querySelector('#refresh').addEventListener('click', () => loadVagas(true));
loadSources();


