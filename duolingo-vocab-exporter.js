/*
 * Duolingo Vocab Exporter
 * Updated for the current Duolingo vocabulary page
 */

(async function () {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Store collected words and translations
  const vocab = new Map();

  // Collect words from the current DOM
  function collectVocab() {
    document.querySelectorAll('.AeY9P').forEach(element => {
      const word = element.querySelector('h3')?.textContent.trim();
      const translation = element.querySelector('p')?.textContent.trim();

      if (word && translation) {
        vocab.set(word, translation);
      }
    });
  }

  // Find the "Load more" button
  function findLoadMoreButton() {
    return [...document.querySelectorAll('[role="button"]')]
      .find(element =>
        element.textContent.includes('Загрузить больше')
      );
  }

  let idleCycles = 0;
  let clicks = 0;

  collectVocab();

  // Load more words until no new batches are available
  while (idleCycles < 8) {
    const button = findLoadMoreButton();

    if (!button) {
      idleCycles++;
      await sleep(1500);
      collectVocab();

      continue;
    }

    idleCycles = 0;

    const wordsBefore = vocab.size;

    button.scrollIntoView({
      behavior: 'instant',
      block: 'center'
    });

    await sleep(300);

    button.click();
    clicks++;

    // Wait for new words to appear
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      collectVocab();

      if (vocab.size > wordsBefore) {
        console.log(`Collected: ${vocab.size} words`);
        break;
      }

      if (!findLoadMoreButton()) {
        break;
      }
    }

    await sleep(1000);
  }

  // Collect all remaining words
  collectVocab();

  // Generate CSV content
  const csv = [
    ['word', 'translation'],
    ...vocab.entries()
  ]
    .map(row =>
      row
        .map(value =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(';')
    )
    .join('\r\n');

  // Create the CSV file
  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'duolingo_vocabulary_full.csv';

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Release the temporary object URL
  setTimeout(() => URL.revokeObjectURL(url), 5000);
})();
