const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const pdfTextElement = document.getElementById('pdf-text-element');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');

let pdf = null;
let currentPage = 1;
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

const createHasAlreadyReadNotification = () => createInteractiveFragment(
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
        // здесь нужно переходить на последнюю прочитанную страницу
        setCurrentPage(currentPage);
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

      pdfTextElement.textContent = pageText;
    });
};

const savedPdfs = (file, currentPage) => {
  const pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];

  const savedPdf = {
    name: file.name,
    size: file.size,
    lastPageRead: currentPage,
  };

  pdfs.push(savedPdf);

  localStorage.setItem(
    'pdfs',
    JSON.stringify(pdfs),
  );
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

    loadingTask.promise.then((savedPdf) => {
      pdf = savedPdf;

      currentPage = 1;
      renderPage(currentPage);
      updateButtonsDisability();

      savedPdfs(
        file,
        currentPage,
      );
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

  const pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];

  const pdfIndex = pdfs.findIndex((pdf) => pdf.name === file.name && pdf.size === file.size);

  if (pdfIndex !== -1) {
    pdfs[pdfIndex].lastPageRead = currentPage;
  }

  localStorage.setItem(
    'pdfs',
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
