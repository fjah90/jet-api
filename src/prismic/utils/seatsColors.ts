interface SeatColor {
  code: string;
  color: string;
}

interface CustomSeat {
  code: string;
  'en-us-description': string;
  'es-es-description': string;
  'pt-pt-description': string;
  color: string;
}

export const prismicSeatsColors: SeatColor[] = [
  {
    code: 'SPRM',
    color: '#F5BD10',
  },
  {
    code: 'STC1',
    color: '#34A853',
  },
  {
    code: 'STC2',
    color: '#1F497D',
  },
  {
    code: 'SXL',
    color: '#370037',
  },
  {
    code: 'STUR',
    color: '#F5BD10',
  },
];

export const customSeats: CustomSeat[] = [
  {
    code: 'HCRES',
    'en-us-description': 'Reserved',
    'es-es-description': 'Reservado',
    'pt-pt-description': 'Reservado',
    color: '#999999',
  },
  {
    code: 'HCPRE',
    'en-us-description': 'Pre-selected',
    'es-es-description': 'Preseleccionado',
    'pt-pt-description': 'Pré-selecionado',
    color: '#474747',
  },
  {
    code: 'HCBLO',
    'en-us-description': 'Blocked',
    'es-es-description': 'Bloqueado',
    'pt-pt-description': 'Bloqueado',
    color: '#B9B9B9',
  },
  {
    code: 'HCEXI',
    'en-us-description': 'Emergency exit',
    'es-es-description': 'Salida de emergencia',
    'pt-pt-description': 'Saída de emergência',
    color: '#CE0031',
  },
  {
    code: 'HCCAB',
    'en-us-description': 'Restricted cabin',
    'es-es-description': 'Cabina restringida',
    'pt-pt-description': 'Cabine restrita',
    color: '#111111',
  },
  {
    code: 'HCSEL',
    'en-us-description': 'Selected',
    'es-es-description': 'Seleccionado',
    'pt-pt-description': 'Selecionado',
    color: '#00ff00',
  },
];
