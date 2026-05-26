(function initLeonhardQuestionnaire() {
  const form = document.getElementById('questionnaire');
  const questionsList = document.getElementById('questions-list');
  const resultsSection = document.getElementById('results');
  const resultsBody = document.getElementById('results-body');
  const accentuationsBody = document.getElementById('accentuations-body');
  const validationMessage = document.getElementById('validation-message');
  const resetBtn = document.getElementById('reset-btn');

  function renderQuestions() {
    const fragment = document.createDocumentFragment();
    for (const q of QUESTIONS) {
      const item = document.createElement('fieldset');
      item.className = 'question-item';
      item.dataset.questionId = String(q.id);
      item.id = `question-${q.id}`;

      const legend = document.createElement('legend');
      legend.className = 'question-text';
      legend.innerHTML = `<span class="question-num">${q.id}.</span> ${escapeHtml(q.text)}`;

      const options = document.createElement('div');
      options.className = 'question-options';
      options.setAttribute('role', 'radiogroup');
      options.setAttribute('aria-label', `Вопрос ${q.id}`);

      options.appendChild(createRadio(q.id, 'yes', 'Да'));
      options.appendChild(createRadio(q.id, 'no', 'Нет'));

      item.appendChild(legend);
      item.appendChild(options);
      fragment.appendChild(item);
    }
    questionsList.appendChild(fragment);
  }

  function createRadio(questionId, value, label) {
    const id = `q${questionId}-${value}`;
    const wrapper = document.createElement('label');
    wrapper.className = 'option-label';
    wrapper.htmlFor = id;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `q${questionId}`;
    input.id = id;
    input.value = value;
    input.required = true;

    wrapper.appendChild(input);
    wrapper.appendChild(document.createTextNode(label));
    return wrapper;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function collectAnswers() {
    /** @type {Record<number, boolean|undefined>} */
    const answers = {};
    for (const q of QUESTIONS) {
      const selected = form.querySelector(`input[name="q${q.id}"]:checked`);
      if (!selected) {
        answers[q.id] = undefined;
      } else {
        answers[q.id] = selected.value === 'yes';
      }
    }
    return answers;
  }

  function clearHighlights() {
    validationMessage.hidden = true;
    validationMessage.textContent = '';
    questionsList.querySelectorAll('.question-item.unanswered').forEach((el) => {
      el.classList.remove('unanswered');
    });
  }

  function highlightMissing(missing) {
    for (const id of missing) {
      const el = document.getElementById(`question-${id}`);
      if (el) el.classList.add('unanswered');
    }
    const list = missing.slice(0, 15).join(', ');
    const suffix = missing.length > 15 ? ` и ещё ${missing.length - 15}` : '';
    validationMessage.textContent = `Ответьте на все вопросы. Не заполнены: ${list}${suffix}.`;
    validationMessage.hidden = false;
    const first = document.getElementById(`question-${missing[0]}`);
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function renderAccentuationsTable(scales) {
    const scoreById = Object.fromEntries(scales.map((s) => [s.id, s]));
    accentuationsBody.innerHTML = '';

    for (const item of ACCENTUATION_DESCRIPTIONS) {
      const score = scoreById[item.scaleId];
      const tr = document.createElement('tr');
      if (score) {
        tr.className = `accent-row level-${score.level}`;
      }

      const descriptionParts = [];
      if (item.brief) {
        descriptionParts.push(`<p class="accent-brief">${escapeHtml(item.brief)}</p>`);
      }
      if (item.description && item.description !== item.brief) {
        descriptionParts.push(`<p class="accent-detail">${escapeHtml(item.description)}</p>`);
      }

      tr.innerHTML = `
        <td class="accent-num">${item.scaleId}</td>
        <td class="accent-name">${escapeHtml(item.name)}</td>
        <td class="accent-score">${score ? score.total : '—'}</td>
        <td class="accent-description">${descriptionParts.join('')}</td>
      `;
      accentuationsBody.appendChild(tr);
    }
  }

  function renderResults(scales) {
    resultsBody.innerHTML = '';
    for (const row of scales) {
      const tr = document.createElement('tr');
      tr.className = `level-${row.level}`;
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.total}</td>
        <td>${escapeHtml(row.levelLabel)}</td>
      `;
      resultsBody.appendChild(tr);
    }
    renderAccentuationsTable(scales);
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearHighlights();
    const answers = collectAnswers();
    const result = calculateScores(answers);
    if (!result.complete) {
      highlightMissing(result.missing);
      return;
    }
    renderResults(result.scales);
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    clearHighlights();
    resultsSection.hidden = true;
    resultsBody.innerHTML = '';
    accentuationsBody.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const check = validateKeyCoverage();
  if (!check.ok) {
    console.error('Ошибка ключа опросника:', check.reason);
  }

  renderQuestions();
})();
