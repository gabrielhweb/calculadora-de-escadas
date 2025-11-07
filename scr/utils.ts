const getBasePrice = (width: number): number => {
  if (width >= 40 && width <= 50) return 410;
  if (width >= 51 && width <= 70) return 425;
  if (width >= 71 && width <= 80) return 440;
  if (width >= 81 && width <= 90) return 490;
  return 425; // Default price if out of range
};

const getMultiplier = (depth: number): number => {
  if (depth <= 20) return 1.0;
  if (depth >= 21 && depth <= 25) return 1.05;
  if (depth >= 26 && depth <= 30) return 1.10;
  return 1.0; // Default multiplier
};

export const calculateTotalPrice = (width: number, depth: number, steps: number): number => {
  const basePrice = getBasePrice(width);
  const multiplier = getMultiplier(depth);
  if (steps <= 0) return 0;
  return basePrice * multiplier * steps;
};

export const calculateFreightCost = (distance: number, fuelPrice: number, consumption: number): number => {
  if (distance <= 0 || fuelPrice <= 0 || consumption <= 0) return 0;
  // Calculate for round trip
  const roundTripDistance = distance * 2;
  const totalFuelNeeded = roundTripDistance / consumption;
  return totalFuelNeeded * fuelPrice;
};

export const formatCurrencyBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// --- NEW FUNCTIONS ---

interface Coordinates {
  latitude: number;
  longitude: number;
}

export const getCoordinatesForCep = async (cep: string): Promise<Coordinates> => {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep.replace(/\D/g, '')}`);
  if (!response.ok) {
    throw new Error('Não foi possível encontrar o CEP. Verifique o número digitado.');
  }
  const data = await response.json();
  if (!data.location || !data.location.coordinates) {
    throw new Error('Coordenadas não encontradas para este CEP.');
  }
  return data.location.coordinates;
};

export const getRouteDistance = async (coords1: Coordinates, coords2: Coordinates): Promise<number> => {
  // CORREÇÃO: Acessa a chave de API da forma correta para projetos Vite
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('A chave de API do Google Maps não está configurada. Adicione-a ao arquivo .env na raiz do projeto.');
  }
  
  const origin = `${coords1.latitude},${coords1.longitude}`;
  const destination = `${coords2.latitude},${coords2.longitude}`;
  
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      if (data.routes && data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        if (leg.distance && typeof leg.distance.value === 'number') {
          return leg.distance.value / 1000; // Converte metros para km
        }
      }
      throw new Error('Distância não encontrada na resposta da rota.');
    } else if (data.status === 'ZERO_RESULTS') {
      throw new Error('Não foi possível encontrar uma rota de carro entre os CEPs informados.');
    } else if (data.status === 'REQUEST_DENIED') {
        console.error('Google Maps Error Details:', data.error_message);
      throw new Error('A solicitação para o Google Maps foi negada. Verifique se a chave de API é válida e habilitada.');
    } else {
      throw new Error(`Erro do Google Maps: ${data.status}. ${data.error_message || ''}`);
    }
  } catch (error) {
    console.error("Google Maps API Error:", error);
    throw new Error('Falha ao comunicar com a API do Google Maps.');
  }
};