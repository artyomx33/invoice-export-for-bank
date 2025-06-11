import { PayingCompany } from '../types/Invoice';

export const PAYING_COMPANIES: PayingCompany[] = [
  {
    id: 'teddy-kids',
    name: 'Teddy Kids B.V.',
    iban: 'NL91ABNA0417164300',
    bic: 'ABNANL2A',
    address: 'Amsterdam, Netherlands',
    vatNumber: 'NL123456789B01'
  },
  {
    id: 'tisa',
    name: 'TISA - Teddy Kids B.V.',
    iban: 'NL29INGB0123456789',
    bic: 'INGBNL2A',
    address: 'Amsterdam, Netherlands',
    vatNumber: 'NL987654321B01'
  },
  {
    id: 'daycare',
    name: 'Teddy Kids Daycare',
    iban: 'NL39RABO0300065264',
    bic: 'RABONL2U',
    address: 'Amsterdam, Netherlands',
    vatNumber: 'NL456789123B01'
  },
  {
    id: 'cafe',
    name: 'Teddy\'s Cafe B.V.',
    iban: 'NL20TRIO0786543210',
    bic: 'TRIONL2U',
    address: 'Amsterdam, Netherlands',
    vatNumber: 'NL321654987B01'
  }
];
