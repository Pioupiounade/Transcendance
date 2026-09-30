export async function findCommune(location: number[]): Promise<string | null> {
  const [latitude, longitude] = location;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const url = new URL('https://geo.api.gouv.fr/communes');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('fields', 'nom');

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return null;

    const communes: unknown = await response.json();
    if (!Array.isArray(communes)) return null;

    const nom = communes[0]?.nom;
    return typeof nom === 'string' && nom.trim() ? nom : null;
  } catch {
    return null;
  }
}