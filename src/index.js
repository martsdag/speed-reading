const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const PDFS_KEY = 'pdfs';
const msPerMinute = 60000;

const pdfTextElement = document.getElementById('pdf-text-element');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');
const SpeedReadingRangeInput = document.getElementById('speed-reading-range-input');
const SpeedReadingRangeOutput = document.getElementById('speed-reading-range-output');

let pdf = null;
let currentPage = 1;
let file;
let delay = 100;

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

const renderPage = () => {
  // TODO: написать обработку исключений
  pdf
    .getPage(currentPage)
    .then((page) => page.getTextContent())
    .then((textContent) => {
      const pageText = textContent.items.map((item) => item.str).join(' ');

      const wordsFromPdfTextElementArray = pageText.split(/\s+/);

      let currentWordIndex = 0;

      pdfTextElement.textContent = '';

      const displayNextWord = () => {
        if (currentWordIndex < wordsFromPdfTextElementArray.length) {
          pdfTextElement.textContent = wordsFromPdfTextElementArray[currentWordIndex];
          currentWordIndex++;
          setTimeout(
            displayNextWord,
            delay,
          );
        }
      };

      setTimeout(
        displayNextWord,
        delay,
      );
    });
};

const onInputChangeSpeedReading = () => {
  delay = msPerMinute / SpeedReadingRangeInput.value;

  SpeedReadingRangeOutput.value = parseInt(SpeedReadingRangeInput.value);
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
  setCurrentPage(currentPage - 1);
};

const onClickButtonNext = () => {
  setCurrentPage(currentPage + 1);
};

const updateButtonsDisability = () => {
  if (!pdf) {
    return;
  }

  previousPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= pdf.numPages;
};

const startSpeedReading = () => {
  renderPage();
};
