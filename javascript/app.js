/**
 * logica_agendamento.js
 * Código leve e comentado em português simples.
 * Responsável por:
 * - armazenar e ler agendamentos no localStorage
 * - validar conflitos (mesmo dia + mesma hora)
 * - bloquear domingos
 * - preencher lista de horários na página cliente
 * - renderizar calendário (Out-Dez 2025) no painel ADM
 *
 * Chave de armazenamento: 'agenda_demo_barbearia'
 */

/* ===================== CONFIGURAÇÕES E NOMES CLAROS ===================== */

// Nome da chave usada no localStorage (onde guardamos os agendamentos)
const CHAVE_ARMAZENAMENTO = 'agenda_demo_barbearia';

// Lista de horários fixos que a barbearia oferece (modelo)
const LISTA_DE_HORARIOS_FIXOS = [
  '09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'
];

// Meses permitidos (0-index): outubro=9, novembro=10, dezembro=11
const MESES_PERMITIDOS = [9, 10, 11];

// Ano alvo
const ANO_PERMITIDO = 2025;

/* ===================== FUNÇÕES DE ARMAZENAMENTO ===================== */

/**
 * pegarListaDeAgendamentos()
 * Retorna a lista atual de agendamentos (array).
 * Se não existir nada no localStorage, retorna array vazio.
 */
function pegarListaDeAgendamentos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || '[]');
  } catch (erro) {
    return [];
  }
}

/**
 * salvarListaDeAgendamentos(lista)
 * Salva a lista completa no localStorage (substitui o valor atual).
 */
function salvarListaDeAgendamentos(lista) {
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(lista));
}

/* ===================== VALIDAÇÕES SIMPLES ===================== */

/**
 * horarioEstaOcupado(dataISO, hora)
 * Retorna true se já existir um agendamento para a data e hora passadas.
 * dataISO = 'YYYY-MM-DD'
 * hora = 'HH:MM'
 */
function horarioEstaOcupado(dataISO, hora) {
  const lista = pegarListaDeAgendamentos();
  return lista.some(item => item.data === dataISO && item.hora === hora);
}

/**
 * dataEstaDentroDoPeriodoPermitido(dataISO)
 * Verifica ano e mês (out, nov, dez 2025)
 */
function dataEstaDentroDoPeriodoPermitido(dataISO) {
  const d = new Date(dataISO + 'T00:00:00');
  if (isNaN(d)) return false;
  return d.getFullYear() === ANO_PERMITIDO && MESES_PERMITIDOS.includes(d.getMonth());
}

/**
 * ehDomingo(dataISO)
 * Retorna true se a data passada for domingo.
 */
function ehDomingo(dataISO) {
  const d = new Date(dataISO + 'T00:00:00');
  return d.getDay() === 0; // 0 = domingo
}

/* ===================== FUNÇÕES EXPÕE PARA A PÁGINA CLIENTE ===================== */

/**
 * atualizarListaDeHorarios(dataISO)
 * Preenche o select #hora na página cliente com os horários fixos.
 * Desabilita os horários que já estão ocupados para a data escolhida.
 * Se dataISO for '', mostra instrução.
 *
 * Esta função é atribuída a window para poder ser chamada no HTML.
 */
window.atualizarListaDeHorarios = function(dataISO) {
  const selectHora = document.getElementById('hora');
  const mensagem = document.getElementById('msg');
  if (!selectHora) return;

  // limpa opções existentes
  selectHora.innerHTML = '';

  // Sem data selecionada
  if (!dataISO) {
    const opc = document.createElement('option');
    opc.value = '';
    opc.textContent = 'Selecione uma data para ver horários';
    opc.disabled = true;
    opc.selected = true;
    selectHora.appendChild(opc);
    if (mensagem) mensagem.textContent = '(Domingos e Fériados bloqueados).';
    return;
  }

  // Valida se a data está dentro do período (Out-Dez 2025)
  if (!dataEstaDentroDoPeriodoPermitido(dataISO)) {
    const opc = document.createElement('option');
    opc.value = '';
    opc.textContent = 'Data fora do período permitido';
    opc.disabled = true;
    opc.selected = true;
    selectHora.appendChild(opc);
    if (mensagem) mensagem.textContent = 'Escolha uma data dentro do período permitido.';
    return;
  }

  // Bloqueia domingos
  if (ehDomingo(dataISO)) {
    const opc = document.createElement('option');
    opc.value = '';
    opc.textContent = 'Domingo (não permitido)';
    opc.disabled = true;
    opc.selected = true;
    selectHora.appendChild(opc);
    if (mensagem) mensagem.textContent = 'Domingo não é permitido para agendamento.';
    return;
  }

  // Pegar horários já ocupados para a data
  const ocupados = pegarListaDeAgendamentos()
    .filter(a => a.data === dataISO)
    .map(x => x.hora);

  // Preencher opções: habilita ou desabilita conforme ocupação
  LISTA_DE_HORARIOS_FIXOS.forEach(h => {
    const opc = document.createElement('option');
    opc.value = h;
    opc.textContent = h + (ocupados.includes(h) ? ' — ocupado' : '');
    if (ocupados.includes(h)) opc.disabled = true;
    selectHora.appendChild(opc);
  });

  if (mensagem) mensagem.textContent = ocupados.length ? `${ocupados.length} horário(s) ocupado(s) nesta data.` : 'Todos os horários disponíveis.';
};

/* ===================== FORMULÁRIO CLIENTE (SUBMISSÃO) ===================== */

(function inicializarFormularioCliente(){
  const form = document.getElementById('form-agenda');
  if (!form) return;

  // Limites do campo data (por segurança)
  const campoData = document.getElementById('data');
  campoData.min = '2025-10-01';
  campoData.max = '2025-12-31';

  // Quando o usuário muda a data, atualizamos a lista de horários
  campoData.addEventListener('change', () => {
    const valor = campoData.value;
    if (window.atualizarListaDeHorarios) window.atualizarListaDeHorarios(valor);
  });

  // Ao enviar o formulário:
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const nomeDoCliente = (document.getElementById('nome') || {}).value || '';
    const telefoneDoCliente = (document.getElementById('telefone') || {}).value || '';
    const servicoEscolhido = (document.getElementById('servico') || {}).value || '';
    const dataDoAgendamento = (document.getElementById('data') || {}).value || '';
    const horaEscolhida = (document.getElementById('hora') || {}).value || '';

    // Validações simples e amigáveis
    if (!nomeDoCliente || !telefoneDoCliente || !dataDoAgendamento || !horaEscolhida) {
      alert('Preencha todos os campos obrigatórios (nome, telefone, data e hora).');
      return;
    }
    if (!dataEstaDentroDoPeriodoPermitido(dataDoAgendamento)) {
      alert('Escolha uma data em Outubro, Novembro ou Dezembro de 2025.');
      return;
    }
    if (ehDomingo(dataDoAgendamento)) {
      alert('Domingos não são permitidos. Escolha outra data.');
      return;
    }
    if (horarioEstaOcupado(dataDoAgendamento, horaEscolhida)) {
      alert('Esse horário já está ocupado. Escolha outro horário.');
      // atualizar lista visual para refletir ocupação
      if (window.atualizarListaDeHorarios) window.atualizarListaDeHorarios(dataDoAgendamento);
      return;
    }

    // Monta o objeto do agendamento
    const novoAgendamento = {
      nome: nomeDoCliente,
      telefone: telefoneDoCliente,
      servico: servicoEscolhido,
      data: dataDoAgendamento,
      hora: horaEscolhida
    };

    // Salva no localStorage
    const listaAtual = pegarListaDeAgendamentos();
    listaAtual.push(novoAgendamento);
    salvarListaDeAgendamentos(listaAtual);

    // Feedback para o usuário
    alert('Agendamento salvo com sucesso!');

    // limpa formulário
    form.reset();
    // atualiza horários (para mostrar que o horário agora ficou ocupado)
    if (window.atualizarListaDeHorarios) window.atualizarListaDeHorarios(dataDoAgendamento);

    // Observação: outras abas verão a mudança via evento 'storage' e atualizarão automaticamente
  });
})();

/* ===================== FUNÇÕES DO PAINEL ADM (CALENDÁRIO) ===================== */

/*
  Variável interna para controlar o mês sendo exibido:
  valorInicialMes = 9 (outubro), 10 (nov), 11 (dez)
*/
let mesAtualExibido = 9; // começamos em outubro por padrão

/**
 * mudarMesAtual(delta)
 * delta = +1 para próximo mês, -1 para mês anterior
 * limita navegação entre outubro e dezembro de 2025
 */
window.mudarMesAtual = function(delta) {
  const novo = mesAtualExibido + delta;
  if (MESES_PERMITIDOS.includes(novo)) {
    mesAtualExibido = novo;
    if (window.mostrarCalendarioAdministrador) window.mostrarCalendarioAdministrador();
  }
};

/**
 * mostrarCalendarioAdministrador()
 * Renderiza o calendário do mês em mesAtualExibido (Out/Nov/Dez 2025)
 * Dias domingos são mostrados como placeholder (não clicáveis).
 * Dias com agendamento ficam destacados (occupied).
 */
window.mostrarCalendarioAdministrador = function() {
  const container = document.getElementById('calendar');
  if (!container) return;

  const ano = ANO_PERMITIDO;
  const mes = mesAtualExibido;

  // Número de dias no mês
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  // Pega todos os agendamentos atuais
  const lista = pegarListaDeAgendamentos();

  // Cabeçalho do mês
  const nomeMes = new Date(ano, mes, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  let html = `<h4 style="margin:0 0 8px 0; text-transform:capitalize;">${nomeMes}</h4>`;
  html += '<div class="calendar-grid">';

  // Gera os dias do mês
  for (let dia = 1; dia <= totalDias; dia++) {
    const diaStr = String(dia).padStart(2,'0');
    const dataISO = `${ano}-${String(mes + 1).padStart(2,'0')}-${diaStr}`;
    const objData = new Date(dataISO + 'T00:00:00');
    const diaSemana = objData.getDay(); // 0 = domingo

    // Se for domingo: placeholder (não clicável)
    if (diaSemana === 0) {
      html += `<div class="day placeholder" data-date="${dataISO}"><span>—</span></div>`;
      continue;
    }

    // Conta quantos agendamentos tem nesse dia
    const agNoDia = lista.filter(it => it.data === dataISO);
    const classes = agNoDia.length ? 'day occupied' : 'day';
    const pequenoInfo = agNoDia.length ? `<small>${agNoDia.length} ag.</small>` : '';
    html += `<div class="${classes}" data-date="${dataISO}"><span>${dia}</span>${pequenoInfo}</div>`;
  }

  html += '</div>';
  container.innerHTML = html;

  // Atualiza o rótulo do nome do mês no painel
  const labelMes = document.getElementById('nome-do-mes');
  if (labelMes) labelMes.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

  // Adiciona evento de clique em cada dia que não é placeholder
  container.querySelectorAll('.day').forEach(no => {
    if (no.classList.contains('placeholder')) return;
    no.addEventListener('click', () => {
      const dataClicada = no.dataset.date;
      if (window.mostrarDetalhesDoDia) window.mostrarDetalhesDoDia(dataClicada);
    });
  });
};

/**
 * mostrarDetalhesDoDia(dataISO)
 * Exibe tabela com os agendamentos do dia selecionado.
 */
window.mostrarDetalhesDoDia = function(dataISO) {
  const caixa = document.getElementById('day-details');
  if (!caixa) return;

  const lista = pegarListaDeAgendamentos().filter(x => x.data === dataISO)
    .sort((a,b) => LISTA_DE_HORARIOS_FIXOS.indexOf(a.hora) - LISTA_DE_HORARIOS_FIXOS.indexOf(b.hora));

  caixa.dataset.date = dataISO;

  if (!lista.length) {
    caixa.innerHTML = `<h4>Agendamentos em ${dataISO}</h4><p>Nenhum agendamento neste dia.</p>`;
    caixa.style.display = 'block';
    return;
  }

  let html = `<h4>Agendamentos em ${dataISO}</h4>`;
  html += `<table><thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th></tr></thead><tbody>`;
  lista.forEach(item => {
    html += `<tr><td>${item.hora}</td><td>${item.nome}</td><td>${item.servico}</td></tr>`;
  });
  html += `</tbody></table>`;
  caixa.innerHTML = html;
  caixa.style.display = 'block';
};

/* ===================== SINCRONIZAÇÃO ENTRE ABAS ===================== */
/*
  Se o usuário salvar um agendamento em uma aba, outra aba com o painel ADM
  receberá evento 'storage' e chamará mostrarCalendarioAdministrador automaticamente.
*/
window.addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_ARMAZENAMENTO) {
    if (window.mostrarCalendarioAdministrador) window.mostrarCalendarioAdministrador();
    const detalhe = document.getElementById('day-details');
    if (detalhe && detalhe.dataset.date && window.mostrarDetalhesDoDia) {
      window.mostrarDetalhesDoDia(detalhe.dataset.date);
    }
  }
});
