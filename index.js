const functions = require('@google-cloud/functions-framework');

functions.http('githubWebhook', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Solo se aceptan peticiones POST');
  }

  const githubEvent = req.headers['x-github-event'];
  console.log(`Evento recibido de GitHub: ${githubEvent}`);

  res.status(200).send(`Evento ${githubEvent} procesado correctamente por el portal GCP.`);
});
