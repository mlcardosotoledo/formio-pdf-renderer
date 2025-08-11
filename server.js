const express = require('express');
const { chromium } = require('playwright');

const app = express();
const PORT = 3002;

app.get('/generate-pdf/:pathName/:submissionId', async (req, res) => {
  const { pathName, submissionId } = req.params;

  // Endpoint local que devuelve el formulario renderizado con datos
  const renderUrl = `http://localhost:${PORT}/render-form/${encodeURIComponent(pathName)}/${encodeURIComponent(submissionId)}`;

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(renderUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pathName}_submission_${submissionId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generando PDF');
  }
});

// Endpoint que sirve el HTML con formulario + submission
app.get('/render-form/:pathName/:submissionId', (req, res) => {
  const { pathName, submissionId } = req.params;

  const formUrl = `http://localhost:3001/${encodeURIComponent(pathName)}`;
  const submissionUrl = `http://localhost:3001/${encodeURIComponent(pathName)}/submission/${encodeURIComponent(submissionId)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap/dist/css/bootstrap.min.css" />
  <script src="https://cdn.form.io/js/formio.embed.js"></script>
</head>
<body>
  <div id="formio" style="margin-left: 30px"></div>
  <script type="module">
    (async () => {
      try {
        const response = await fetch('${submissionUrl}', {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          document.getElementById('formio').innerText = 'Error cargando submission: ' + response.status;
          return;
        }
        const submissionData = await response.json();
        Formio.createForm(document.getElementById('formio'), '${formUrl}').then(form => {
          form.submission = submissionData;
        });
      } catch (err) {
        document.getElementById('formio').innerText = 'Error: ' + err.message;
      }
    })();
  </script>
</body>
</html>
`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
