const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const PDFS_KEY = 'pdfs';
const msPerMinute = 60000;

const pdfTextElement = document.getElementById('pdf-text-element');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');
const speedReadingRangeInput = document.getElementById('speed-reading-range-input');
const speedReadingRangeOutput = document.getElementById('speed-reading-range-output');
const wordPartStart = document.getElementById('word-part-start');
const wordPartMiddle = document.getElementById('word-part-middle');
const wordPartEnd = document.getElementById('word-part-end');
const languageSelector = document.getElementById('language-selector');

let pdf = null;
let readingTimeoutId = null;
let currentPage = 1;
let delay = 100;
let translations = {};
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
  alt="close-thick"
  src="/src/assets/icons/close-outline.svg"
  class="icon"
>
</button>
<button class="button">Продолжить чтение</button>
<p class="notification__text">Этот файл уже был загружен. Желаете ли продолжить его чтение?</p>
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

const onInputChangeSpeedReading = () => {
  delay = msPerMinute / speedReadingRangeInput.value;

  speedReadingRangeOutput.value = parseInt(speedReadingRangeInput.value);
};

const renderPage = () => {
  // TODO: написать обработку исключений
  pdf
    .getPage(currentPage)
    .then((page) => page.getTextContent())
    .then((textContent) => {
      const pageText = textContent.items.map((item) => item.str).join(' ');

      const wordsFromPdfTextElement = pageText.replace(
        /(?<=[а-яёa-z])-\s+(?=[а-яёa-z])/gi,
        '',
      ).split(/(?<!-|–)\s+/i);

      let currentWordIndex = 0;

      onInputChangeSpeedReading();

      const displayNextWord = () => {
        if (currentWordIndex >= wordsFromPdfTextElement.length) {
          return;
        }
        const word = wordsFromPdfTextElement[currentWordIndex];

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
    });
};


const onChangeUploadedFile = (event) => {
  const input = event.target;

  file = input.files?.[0];

  if (!file) {
    return;
  }

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
  renderPage();
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

const onClickButtonPrev = () => {
  stopSpeedReading();
  setCurrentPage(currentPage - 1);
};

const onClickButtonNext = () => {
  stopSpeedReading();
  setCurrentPage(currentPage + 1);
};

const updateButtonsDisability = () => {
  if (!pdf) {
    return;
  }

  previousPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= pdf.numPages;
};

const onClickStartSpeedReading = () => {
  renderPage();
};

const stopSpeedReading = () => {
  if (!readingTimeoutId) {
    return;
  }

  clearTimeout(readingTimeoutId);
  readingTimeoutId = null;
};

const onClickStopSpeedReading = () => {
  stopSpeedReading();
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
