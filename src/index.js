const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const fileUploadInput = document.querySelector('.file-upload__input');
const pdfText = document.getElementById('pdf-text');
const previousPageButton = document.getElementById('previous-page-button');
const nextPageButton = document.getElementById('next-page-button');

let pdf = null;
let currentPage = 1;

const renderPage = (pageNumber) => {
  pdf
    .getPage(pageNumber)
    .then((page) => page.getTextContent())
    .then((textContent) => {
      //TODO: написать обработку исключений
      const pageText = textContent.items.map((item) => item.str).join(' ');

      pdfText.textContent = pageText;
    });
};

const handlingPDF = (file) => {
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

const sendFile = () => {
  const file = fileUploadInput.files[0];

  if (!file) {
    return;
  }

  handlingPDF(file);
};

const getToPreviousPage = () => {
  if (!pdf || currentPage <= 1) {
    return;
  }

  currentPage--;
  renderPage(currentPage);
  updateButtonsDisability();
};

const getToNextPage = () => {
  if (!pdf || currentPage >= pdf.numPages) {
    return;
  }

  currentPage++;
  renderPage(currentPage);
  updateButtonsDisability();
};

const updateButtonsDisability = () => {
  if (!pdf) {
    return;
  }

  previousPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= pdf.numPages;
};
