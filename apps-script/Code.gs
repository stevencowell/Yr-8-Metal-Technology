function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');

  // Normalise quizNumber: allow 'M1', 'S1', 'A1' or just numbers.
  if (data.quizNumber && typeof data.quizNumber === 'string') {
    const prefix = data.quizNumber.charAt(0);
    const num = parseInt(data.quizNumber.slice(1), 10);
    if (!isNaN(num)) data.quizNumber = prefix + num;
  }

  // Date string formatted as dd/MM/yy in spreadsheet timezone
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const dateStr = Utilities.formatDate(new Date(), tz, 'dd/MM/yy');

  // Route based on kind
  const kind = data.kind || 'quiz';
  if (kind === 'quiz') {
    writeQuiz(ss, data, dateStr);
  } else if (kind === 'advanced') {
    writeDynamicRow(ss, 'Advanced Theory Sheet', buildDynamicRow(data, ['user', 'unit', 'timestamp']));
  } else if (kind === 'scenario') {
    writeDynamicRow(ss, 'Scenario Responses', buildDynamicRow(data, ['user', 'unit', 'timestamp']));
  }

  return ContentService.createTextOutput('Success');
}

function writeQuiz(ss, data, dateStr) {
  // Determine sheet: Main/Support/Advanced by quizNumber prefix
  let sheetName = 'Main Theory Sheet';
  if (data.quizNumber && typeof data.quizNumber === 'string') {
    if (data.quizNumber.startsWith('S')) sheetName = 'Support Theory Sheet';
    else if (data.quizNumber.startsWith('A')) sheetName = 'Advanced Theory Sheet';
  }
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // Ensure header
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Name', 'Quiz', 'Score', 'Date']);
  }

  const name = data.user || '';
  const quizLabel = data.quizNumber || `M${data.unit || ''}`;
  const scoreText = formatScore(data.score, data.total);
  sheet.appendRow([name, quizLabel, scoreText, dateStr]);
}

function formatScore(score, total) {
  if (typeof score === 'number' && typeof total === 'number' && total > 0) {
    return `${score}/${total}`;
  }
  if (typeof score === 'number' && !total) return String(score);
  return '';
}

// Builds a row object with dynamic headers: keys become columns.
function buildDynamicRow(data, fixedKeys) {
  const row = {};
  fixedKeys.forEach(k => row[capitalize(k)] = data[k] || '');
  // Include responses object if present
  if (data.responses && typeof data.responses === 'object') {
    Object.keys(data.responses).forEach(k => {
      row[k.toUpperCase()] = stringifyValue(data.responses[k]);
    });
  }
  // Also include any top-level q1, q2 ... fields
  Object.keys(data).forEach(k => {
    if (/^q\d+$/i.test(k)) {
      row[k.toUpperCase()] = stringifyValue(data[k]);
    }
  });
  return row;
}

function stringifyValue(v) {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object' && v !== null) return JSON.stringify(v);
  return v == null ? '' : String(v);
}

function writeDynamicRow(ss, sheetName, rowObj) {
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const headers = getOrCreateHeaders(sheet, Object.keys(rowObj));
  const row = headers.map(h => rowObj[h] || '');
  sheet.appendRow(row);
}

function getOrCreateHeaders(sheet, keys) {
  const existing = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  const headerSet = new Set(existing.filter(String));
  // Ensure fixed columns first if missing
  const preferredOrder = ['User', 'Unit', 'Timestamp'];
  preferredOrder.forEach(h => headerSet.add(h));
  keys.forEach(k => headerSet.add(k));
  const headers = Array.from(headerSet);
  // Write headers if empty or changed (simple strategy)
  if (existing.length === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else if (headers.length > existing.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return headers;
}

function capitalize(s) {
  return (s || '').charAt(0).toUpperCase() + (s || '').slice(1);
}