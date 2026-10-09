'use strict';

const { getWeatherForLocation } = require('../services/weather.service');
const { sendMail } = require('../services/mailer.service');

// The recipient is fixed server-side so this endpoint cannot be abused to
// send mail to arbitrary addresses.
function recipient() {
  return process.env.WEATHER_EMAIL_TO || 'hadasch@ac.sce.ac.il';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatReport(w) {
  const lines = [
    ['Conditions', w.conditions],
    ['Temperature', `${w.temperature} °C (feels like ${w.feelsLike} °C)`],
    ["Today's range", `${w.todayMin} °C – ${w.todayMax} °C`],
    ['Chance of rain', `${w.precipitationChance ?? 'n/a'}%`],
    ['Humidity', `${w.humidity}%`],
    ['Wind', `${w.windSpeed} km/h`],
    ['Observed at', `${w.time} (${w.timezone})`],
  ];
  const text = [`Weather in ${w.location}`, '', ...lines.map(([k, v]) => `${k}: ${v}`)].join('\n');
  const html = `<h2>Weather in ${escapeHtml(w.location)}</h2><table>${lines
    .map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`)
    .join('')}</table>`;
  return { text, html };
}

async function emailWeather(req, res, next) {
  try {
    const weather = await getWeatherForLocation(req.body.location);
    const { text, html } = formatReport(weather);
    const to = recipient();
    await sendMail({ to, subject: `Weather in ${weather.location}`, text, html });
    return res.json({ message: `Weather for ${weather.location} was sent to ${to}.`, sentTo: to, weather });
  } catch (err) {
    return next(err);
  }
}

module.exports = { emailWeather, formatReport };
