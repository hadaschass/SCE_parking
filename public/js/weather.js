'use strict';

(function () {
  const form = document.getElementById('weatherForm');
  const flash = document.getElementById('flashMessage');
  const result = document.getElementById('weatherResult');
  const button = form.querySelector('button[type="submit"]');

  function showFlash(message, kind) {
    flash.textContent = message;
    flash.className = `flash ${kind}`;
  }

  function row(label, value) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    p.append(strong, String(value));
    return p;
  }

  function renderWeather(w) {
    result.replaceChildren(
      Object.assign(document.createElement('h3'), { textContent: w.location }),
      row('Conditions', w.conditions),
      row('Temperature', `${w.temperature} °C (feels like ${w.feelsLike} °C)`),
      row("Today's range", `${w.todayMin} °C – ${w.todayMax} °C`),
      row('Humidity', `${w.humidity}%`),
      row('Wind', `${w.windSpeed} km/h`)
    );
    result.classList.remove('hidden');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const location = form.location.value.trim();
    button.disabled = true;
    button.textContent = 'Sending…';
    result.classList.add('hidden');
    try {
      const res = await fetch('/api/weather/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.details ? data.details.map((d) => d.message).join(' ') : '';
        throw new Error(detail || data.error || 'Request failed.');
      }
      showFlash(data.message, 'success');
      renderWeather(data.weather);
    } catch (err) {
      showFlash(err.message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Send weather';
    }
  });
})();
