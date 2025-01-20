const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const pdfTextElement = document.getElementById('pdf-text-element');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');

let pdf = null;
let currentPage = 1;

// createContextualFragment преобразует строки в DOM елементы
const createFragment = (string) => new Range().createContextualFragment(string);

const notificationElement = `<div class="notification" id="notification">
          <button class="button-close" onclick="onClickClose()">
            <img
              alt="close-thick"
              src="/src/assets/icons/close-outline.svg"
              class="icon"
            >
          </button>
          <button class="button" onclick="onClickContinueReading()">Продолжить чтение</button>
          <p class="alert__text">Этот файл уже был загружен. Желаете ли продолжить его чтение?</p>
        </div>
`;

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

const onChangeUploadedFile = (event) => {
  const input = event.target;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  const savedPdfFile = localStorage.getItem('saved-pdf-file');

  if (savedPdfFile) {
    const { name, size } = JSON.parse(savedPdfFile);

    if (!name === file.name && size === file.size) {
      return;
    }

    document.body.append(createFragment(notificationElement));
  }

  localStorage.setItem(
    'saved-pdf-file',
    JSON.stringify({ name: file.name,
      size: file.size }),
  );

  const fileReader = new FileReader();

  fileReader.onload = function (event) {
    const pdfData = event.target.result;

    const loadingTask = pdfjsLib.getDocument({ data: pdfData });

    loadingTask.promise.then((savedPdf) => {
      pdf = savedPdf;

      currentPage = 1;
      renderPage(currentPage);
      updateButtonsDisability();
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

const onClickContinueReading = () => {
  const notification = document.getElementById('notification');

  notification.remove();
  setCurrentPage(currentPage);
};

const onClickClose = () => {
  const notification = document.getElementById('notification');

  if (!notification) {
    return;
  }

  notification.remove();
};
