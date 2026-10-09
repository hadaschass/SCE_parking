const request = require('supertest');

jest.mock('../src/services/mailer.service', () => ({ sendMail: jest.fn().mockResolvedValue({}) }));

const { sendMail } = require('../src/services/mailer.service');
const createApp = require('../src/app');

const app = createApp();

function jsonResponse(body, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

const geocodeBody = {
  results: [{ name: 'Beit Kama', admin1: 'Southern District', country: 'Israel', latitude: 31.44, longitude: 34.76, timezone: 'Asia/Jerusalem' }],
};
const forecastBody = {
  timezone: 'Asia/Jerusalem',
  current: {
    time: '2026-10-09T12:00',
    temperature_2m: 28.4,
    apparent_temperature: 29.1,
    relative_humidity_2m: 45,
    wind_speed_10m: 12.3,
    weather_code: 1,
  },
  daily: { temperature_2m_max: [30.2], temperature_2m_min: [18.7], precipitation_probability_max: [5] },
};

beforeEach(() => {
  sendMail.mockClear();
  global.fetch = jest.fn((url) => jsonResponse(url.includes('geocoding') ? geocodeBody : forecastBody));
});

describe('POST /api/weather/email', () => {
  it('looks up the weather and emails it to the fixed recipient', async () => {
    const res = await request(app).post('/api/weather/email').send({ location: 'Beit Kama' });

    expect(res.status).toBe(200);
    expect(res.body.sentTo).toBe('hadasch@ac.sce.ac.il');
    expect(res.body.weather.conditions).toBe('Mainly clear');
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe('hadasch@ac.sce.ac.il');
    expect(mail.subject).toBe('Weather in Beit Kama, Southern District, Israel');
    expect(mail.text).toContain('28.4 °C');
  });

  it('returns 404 and sends nothing when the location is unknown', async () => {
    global.fetch = jest.fn(() => jsonResponse({}));
    const res = await request(app).post('/api/weather/email').send({ location: 'Nowhereville' });

    expect(res.status).toBe(404);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rejects a missing location', async () => {
    const res = await request(app).post('/api/weather/email').send({});

    expect(res.status).toBe(422);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns 502 when the weather service fails', async () => {
    global.fetch = jest.fn(() => jsonResponse({}, false));
    const res = await request(app).post('/api/weather/email').send({ location: 'Beit Kama' });

    expect(res.status).toBe(502);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
