type SignalSnapshot = {
  precipitationMm: number
  precipitationProbability: number
  aqi: number
  source: 'live' | 'fallback'
}

const zoneCoordinates: Array<{ match: RegExp; latitude: number; longitude: number }> = [
  { match: /koramangala/i, latitude: 12.9352, longitude: 77.6245 },
  { match: /indiranagar/i, latitude: 12.9719, longitude: 77.6412 },
  { match: /hsr/i, latitude: 12.9121, longitude: 77.6446 },
  { match: /saket/i, latitude: 28.5245, longitude: 77.2066 },
  { match: /noida/i, latitude: 28.5355, longitude: 77.3910 },
]

const fallbackSignal: SignalSnapshot = {
  precipitationMm: 14,
  precipitationProbability: 62,
  aqi: 86,
  source: 'fallback',
}

export async function getZoneSignals(zone: string): Promise<SignalSnapshot> {
  const coordinates = zoneCoordinates.find((item) => item.match.test(zone))
  if (!coordinates) {
    return fallbackSignal
  }

  try {
    const [weatherResponse, aqiResponse] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&hourly=precipitation,precipitation_probability&forecast_days=1&timezone=auto`,
        { signal: AbortSignal.timeout(5000) },
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&hourly=us_aqi&forecast_days=1&timezone=auto`,
        { signal: AbortSignal.timeout(5000) },
      ),
    ])

    if (!weatherResponse.ok || !aqiResponse.ok) {
      return fallbackSignal
    }

    const weatherPayload = await weatherResponse.json() as {
      hourly?: {
        precipitation?: number[]
        precipitation_probability?: number[]
      }
    }
    const aqiPayload = await aqiResponse.json() as {
      hourly?: {
        us_aqi?: number[]
      }
    }

    const precipitationMm = weatherPayload.hourly?.precipitation?.[0] ?? fallbackSignal.precipitationMm
    const precipitationProbability =
      weatherPayload.hourly?.precipitation_probability?.[0] ?? fallbackSignal.precipitationProbability
    const aqi = aqiPayload.hourly?.us_aqi?.[0] ?? fallbackSignal.aqi

    return {
      precipitationMm,
      precipitationProbability,
      aqi,
      source: 'live',
    }
  } catch {
    return fallbackSignal
  }
}
