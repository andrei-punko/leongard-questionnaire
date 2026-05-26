/**
 * Подсчёт по методике Леонгарда:
 * совпадение ответа с ключом → +1 балл по шкале, затем × коэффициент.
 */

function scoreScaleRaw(answers, scale) {
  let raw = 0;
  for (const q of scale.yes) {
    if (answers[q] === true) raw += 1;
  }
  for (const q of scale.no) {
    if (answers[q] === false) raw += 1;
  }
  return raw;
}

function interpretScore(total) {
  if (total <= 12) {
    return { level: 'norm', label: 'Норма (слабо выражено)' };
  }
  if (total <= 18) {
    return { level: 'tendency', label: 'Тенденция к акцентуации' };
  }
  return { level: 'accent', label: 'Выраженная акцентуация' };
}

/**
 * @param {Record<number, boolean|undefined>} answers — id вопроса → true (да) / false (нет)
 * @returns {{ complete: boolean, missing: number[], scales: object[] }}
 */
function calculateScores(answers) {
  const missing = [];
  for (let i = 1; i <= 88; i += 1) {
    if (answers[i] !== true && answers[i] !== false) {
      missing.push(i);
    }
  }

  if (missing.length > 0) {
    return { complete: false, missing, scales: [] };
  }

  const scales = SCALES.map((scale) => {
    const raw = scoreScaleRaw(answers, scale);
    const total = raw * scale.coefficient;
    const interpretation = interpretScore(total);
    return {
      id: scale.id,
      name: scale.name,
      raw,
      coefficient: scale.coefficient,
      total,
      level: interpretation.level,
      levelLabel: interpretation.label,
    };
  });

  return { complete: true, missing: [], scales };
}

/** Проверка: каждый вопрос входит в ключ */
function validateKeyCoverage() {
  const covered = new Set();
  for (const scale of SCALES) {
    for (const q of scale.yes) {
      if (covered.has(`q${q}`)) return { ok: false, reason: `Дубликат для вопроса ${q}` };
      covered.add(`q${q}`);
    }
    for (const q of scale.no) {
      if (covered.has(`q${q}`)) return { ok: false, reason: `Дубликат для вопроса ${q}` };
      covered.add(`q${q}`);
    }
  }
  if (covered.size !== 88) {
    return { ok: false, reason: `Покрыто ${covered.size} из 88 вопросов` };
  }
  return { ok: true };
}
