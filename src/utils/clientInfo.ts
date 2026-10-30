// Dados do cliente (nome, CPF/CNPJ, CEP, endereço) procurados em todos os lugares
// onde contratos antigos, manuais e novos guardam essas informações.

// Base de dados de clientes conhecidos históricos/retroativos para fallback perfeito
export const KNOWN_CLIENTS_EXTRA: Record<string, { cpf?: string; address?: string; cep?: string }> = {
  'fabio chalita m a samra': {
    cpf: '029.208.028-01',
    address: 'Rua Ypês, 92 - Salto de Baixo, Extrema - MG, 37647-364',
    cep: '37647-364'
  },
  'fabio chalita': {
    cpf: '029.208.028-01',
    address: 'Rua Ypês, 92 - Salto de Baixo, Extrema - MG, 37647-364',
    cep: '37647-364'
  },
  'everton de araujo': {
    cpf: '313.386.728-86',
    address: 'Rua Vasco da Gama, 63 - Cipava, Osasco - SP, 06065-420',
    cep: '06065-420'
  },
  'everton': {
    cpf: '313.386.728-86',
    address: 'Rua Vasco da Gama, 63 - Cipava, Osasco - SP, 06065-420',
    cep: '06065-420'
  },
  'jose guilherme severini': {
    cpf: '443.023.396-91',
    address: 'Rua Tangará, 20 - Condomínio Campo da Cachoeira, Poços de Caldas - MG, 37704-900',
    cep: '37704-900'
  },
  'severini': {
    cpf: '443.023.396-91',
    address: 'Rua Tangará, 20 - Condomínio Campo da Cachoeira, Poços de Caldas - MG, 37704-900',
    cep: '37704-900'
  },
  'marcia campos nogueira': {
    cpf: '955.892.797-04',
    address: 'Rua Joaquim Ferreira, 191 - Casa 02 - Jardim Sulacap, Rio de Janeiro - RJ, 21741-290',
    cep: '21741-290'
  },
  'marcia campos': {
    cpf: '955.892.797-04',
    address: 'Rua Joaquim Ferreira, 191 - Casa 02 - Jardim Sulacap, Rio de Janeiro - RJ, 21741-290',
    cep: '21741-290'
  },
  'alexandre bergamo de oliveira': {
    address: 'Jardim Residencial Chácara Ondina, Sorocaba - SP'
  },
  'alexandre bergamo': {
    address: 'Jardim Residencial Chácara Ondina, Sorocaba - SP'
  },
  'maria helena jara guastamacchia': {
    cpf: '250.587.428-02',
    address: 'Rua das Gilias, 389 - Vila Bela, São Paulo - SP, 03201-070',
    cep: '03201-070'
  },
  'maria helena': {
    cpf: '250.587.428-02',
    address: 'Rua das Gilias, 389 - Vila Bela, São Paulo - SP, 03201-070',
    cep: '03201-070'
  }
};

export const normalizeName = (str?: string) =>
  (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const firstFilled = (...vals: any[]) => {
  const v = vals.find(x => x !== undefined && x !== null && String(x).trim() !== '' && String(x).trim() !== 'N/A');
  return v !== undefined ? String(v).trim() : '';
};

export interface ClientInfoSources {
  contract: any;
  parsedData: any;
  queueItem?: any;
  quoteItem?: any;
}

// Mesma ordem de busca usada no Termo de Instalação
export const resolveClientInfo = ({ contract, parsedData, queueItem, quoteItem }: ClientInfoSources) => {
  const c = contract || {};
  const p = parsedData || {};
  const clientNorm = normalizeName(c.clientName || p?.userData?.name);
  const known = KNOWN_CLIENTS_EXTRA[clientNorm]
    || Object.entries(KNOWN_CLIENTS_EXTRA).find(([k]) => clientNorm && (clientNorm.includes(k) || k.includes(clientNorm)))?.[1];

  const u = p.userData || quoteItem?.userData || c.userData || {};
  const qu = quoteItem?.userData || {};

  const name = firstFilled(u.name, c.clientName, queueItem?.clientName, quoteItem?.clientName);

  const doc = firstFilled(
    u.cpf, u.cpfCnpj, u.cnpj, u.clientCpf, u.clientDoc, u.doc, u.document,
    qu.cpf, qu.cpfCnpj, qu.cnpj, qu.clientCpf,
    p.cpf, p.cpfCnpj, p.cnpj, p.clientCpf, p.clientDoc, p.doc,
    c.cpf, c.cpfCnpj, c.cnpj, c.clientCpf, c.clientDoc, c.doc,
    queueItem?.cpf, queueItem?.cpfCnpj,
    known?.cpf,
  );

  // Endereço já separado em campos (contratos feitos pela página de Contrato)
  if (u.street) {
    return {
      name, cpf: doc,
      street: u.street, number: u.number, neighborhood: u.neighborhood,
      city: u.city, state: u.state,
      zip: firstFilled(u.zip, u.cep, qu.zip, qu.cep, c.cep, c.zip, p.zip, p.cep, known?.cep),
    };
  }

  // Endereço em uma linha só (contratos antigos/manuais)
  const address = firstFilled(
    u.address, qu.address, c.customAddress, c.location, c.address, c.deliveryAddress,
    queueItem?.customAddress, queueItem?.location,
    p.customAddress, p.location, p.address, known?.address,
  );
  let zip = firstFilled(u.zip, u.cep, qu.zip, qu.cep, c.cep, c.zip, p.zip, p.cep, known?.cep);
  if (!zip && address) {
    const m = address.match(/\b\d{5}-?\d{3}\b/);
    if (m) zip = m[0];
  }
  return { name, cpf: doc, address, zip };
};
