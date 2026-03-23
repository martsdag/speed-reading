const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const PDFS_KEY = 'pdfs';
const MS_PER_MINUTE = 60000;

const pdfTextElement = document.getElementById('pdf-text-element');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');
const speedReadingRangeInput = document.getElementById('speed-reading-range-input');
const speedReadingNumberInput = document.getElementById('speed-reading-number-input');
const wordPartStart = document.getElementById('word-part-start');
const wordPartMiddle = document.getElementById('word-part-middle');
const wordPartEnd = document.getElementById('word-part-end');
const languageSelector = document.getElementById('language-selector');
const playPauseIcon = document.getElementById('play-pause-icon');
const playPauseButton = document.getElementById('play-pause-button');
const wordShown = document.getElementById('word-shown');
const totalWordsShown = document.getElementById('total-words-shown');
const wordsCounter = document.getElementById('words-counter');

let pdf = null;
let readingTimeoutId = null;
let currentPage = 1;
let currentWordIndex = 0;
let delay = 100;
let translations = {};
let pageText = '';
let file;

/**
 * @callback InteractiveFragmentCallback
 * @param {DocumentFragment} documentFragment
 * @returns {void}
 */

/**
 * Создаёт интерактивный элемент из строки htmlString и добавляет его в ноду appendTo
 * @param {string} htmlString
 * @param {HTMLElement=} appendTo
 * @param {InteractiveFragmentCallback=} interactive
 */
const createInteractiveFragment = (htmlString, appendTo = document.body, interactive) => {
  const documentFragment = new Range().createContextualFragment(htmlString);

  interactive(documentFragment);

  appendTo.appendChild(documentFragment);
};

const createHasAlreadyReadNotification = (lastPageRead) => createInteractiveFragment(
  `
<div class="notification" id="notification">
<button class="button-close">
<img
  alt="close-outline"
  src="/src/assets/icons/close-outline.svg"
  class="icon"
>
</button>
<button data-i18n="continueReading" class="button">Continue reading</button>
<p data-i18n="fileHasAlreadyBeenUploaded" class="notification__text">This file has already been uploaded. Would you like to continue reading it?</p>
</div>
`,
  document.body,
  (notificationFragment) => {
    notificationFragment.querySelector('.button-close')?.addEventListener(
      'click',
      () => document.getElementById('notification').remove(),
    );

    notificationFragment.querySelector('.button')?.addEventListener(
      'click',
      () => {
        document.getElementById('notification').remove();
        setCurrentPage(lastPageRead);
      },
    );
  },
);

const onInputRangeChangeSpeedReading = () => {
  delay = MS_PER_MINUTE / speedReadingRangeInput.value;

  speedReadingNumberInput.value = speedReadingRangeInput.value;
};

const onBlurNumberChangeSpeedReading = () => {
  delay = MS_PER_MINUTE / speedReadingRangeInput.value;

  speedReadingRangeInput.value = speedReadingNumberInput.value;

  if (Number(speedReadingNumberInput.value) > speedReadingNumberInput.getAttribute('max')) {
    speedReadingNumberInput.value = speedReadingNumberInput.getAttribute('max');
  }

  speedReadingNumberInput.value = speedReadingNumberInput.value.replace(
    /[^0-9]/g,
    '',
  );
};

const renderPage = async () => {
  try {
    const page = await pdf.getPage(currentPage);
    const textContent = await page.getTextContent();

    pageText = textContent.items.map((item) => item.str).join(' ');
  } catch (error) {
    console.error(
      'Error while extracting text from PDF:',
      error,
    );

    return;
  }

  if (!pageText) {
    console.warn('Page text is empty, skipping processing.');

    return;
  }

  const wordsFromPdfTextElement = pageText
    .replace(
      /(?<=[а-яёa-z])-\s+(?=[а-яёa-z])/gi,
      '',
    )
    .split(/(?<!-|–)\s+/i);

  onInputRangeChangeSpeedReading();
  onBlurNumberChangeSpeedReading();

  const displayNextWord = () => {
    if (!readingTimeoutId) {
      return;
    }

    if (currentWordIndex >= wordsFromPdfTextElement.length) {
      playPauseIcon.src = '/src/assets/icons/play.svg';

      return;
    }

    const word = wordsFromPdfTextElement[currentWordIndex];

    const wordNumber = currentWordIndex + 1;
    const lastWordNumber = wordsFromPdfTextElement.length;

    wordShown.textContent = wordNumber;
    totalWordsShown.textContent = lastWordNumber;

    const partsOfWord = [
      word.slice(
        0,
        Math.floor(word.length / 2),
      ),
      word[Math.floor(word.length / 2)],
      word.slice(Math.floor(word.length / 2) + 1),
    ];

    wordPartStart.textContent = partsOfWord[0];
    wordPartMiddle.textContent = partsOfWord[1];
    wordPartEnd.textContent = partsOfWord[2];

    currentWordIndex++;
    readingTimeoutId = setTimeout(
      displayNextWord,
      delay,
    );
  };

  readingTimeoutId = setTimeout(
    displayNextWord,
    delay,
  );
};

const onChangeUploadedFile = (event) => {
  const input = event.target;

  file = input.files?.[0];

  if (!file) {
    return;
  }

  playPauseButton.style.display = 'flex';
  wordsCounter.style.display = 'flex';

  const fileReader = new FileReader();

  fileReader.onload = function (event) {
    const pdfData = event.target.result;

    const loadingTask = pdfjsLib.getDocument({ data: pdfData });

    loadingTask.promise.then((pdfLoaded) => {
      pdf = pdfLoaded;

      currentPage = 1;
      updateButtonsDisability();

      const pdfs = JSON.parse(localStorage.getItem(PDFS_KEY)) || [];
      const maybeLastPageRead = pdfs.find((pdf) => pdf.name === file.name && pdf.size === file.size)?.lastPageRead;

      if (!maybeLastPageRead) {
        return;
      }

      createHasAlreadyReadNotification(maybeLastPageRead);
    });
  };

  fileReader.readAsArrayBuffer(file);
};

const setCurrentPage = (pageNumber) => {
  if (!pdf || pageNumber < 1 || pageNumber > pdf.numPages) {
    return;
  }

  currentPage = pageNumber;
  updateButtonsDisability();

  const pdfs = JSON.parse(localStorage.getItem(PDFS_KEY)) || [];
  const pdfIndex = pdfs.findIndex((pdf) => pdf.name === file.name && pdf.size === file.size);

  if (pdfIndex === -1 && currentPage > 1) {
    pdfs.push({
      name: file.name,
      size: file.size,
      lastPageRead: currentPage,
    });
  } else {
    if (currentPage < 2) {
      pdfs.splice(
        pdfIndex,
        1,
      );
    } else {
      const pdf = pdfs[pdfIndex];

      pdfs.splice(
        pdfIndex,
        1,
        {
          ...pdf,
          lastPageRead: currentPage,
        },
      );
    }
  }

  localStorage.setItem(
    PDFS_KEY,
    JSON.stringify(pdfs),
  );
};

const clearWordDisplay = () => {
  wordPartStart.textContent = '';
  wordPartMiddle.textContent = '';
  wordPartEnd.textContent = '';
};

const onClickButtonPrev = () => {
  onClickStartStopSpeedReading();
  currentWordIndex = 0;
  clearWordDisplay();
  setCurrentPage(currentPage - 1);
};

const onClickButtonNext = () => {
  onClickStartStopSpeedReading();
  currentWordIndex = 0;
  clearWordDisplay();
  setCurrentPage(currentPage + 1);
};

const updateButtonsDisability = () => {
  if (!pdf) {
    return;
  }

  previousPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= pdf.numPages;
};

const onClickStartStopSpeedReading = () => {
  if (readingTimeoutId) {
    clearTimeout(readingTimeoutId);
    readingTimeoutId = null;
    playPauseIcon.src = '/src/assets/icons/play.svg';
  } else {
    renderPage();
    playPauseIcon.src = '/src/assets/icons/pause.svg';
  }
};

const loadTranslations = async (locale) => {
  const translationsResponse = await fetch(`./public/languages/${locale}.json`);
  const translations = await translationsResponse.json();

  const defaultTranslationsResponse = await fetch('../public/languages/en.json');
  const defaultTranslations = await defaultTranslationsResponse.json();

  return translations || defaultTranslations;
};

const translatePage = (translations) => {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');

    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
};

const setLanguage = async (locale) => {
  const translations = await loadTranslations(locale);

  translatePage(translations);
  document.documentElement.lang = locale;
};

const onChangeSelectLanguage = () => {
  setLanguage(languageSelector.value);
};

setLanguage('en');
