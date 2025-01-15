const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const pdfTextElement = document.getElementById('pdf-text-element');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');

let pdf = null;
let currentPage = 1;

const renderPage = (pageNumber) => {
  //TODO: написать обработку исключений
  pdf
    .getPage(pageNumber)
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
  renderPage(currentPage);
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
