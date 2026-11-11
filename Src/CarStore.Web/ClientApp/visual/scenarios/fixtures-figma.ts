/**
 * Figma-parity customers for the Home dashboard ("Central da frota", EOvtzuJAvw1UnoH9tsYmiO 2005:5266).
 *
 * The prototype's own content, so a whole-screen pixel comparison measures layout and styling, not data:
 * - the first five rows (sorted by name, like `CustomerService`) are the table rows of node 2009:212:
 *   names, e-mails and car names exactly as drawn;
 * - all 15 `createdAt` values reproduce the chart annotation on node 2035:268
 *   (`data: [0,2,2,2,1,0,1,2,1,2,1,1]`, December 2025 to November 2026, with the harness clock at
 *   2026-11-10 — see `FIXED_NOW`), and 15 is the "Clientes cadastrados" KPI.
 *
 * The prototype is internally inconsistent: its table dates (08/11, 06/11, 03/11, 29/10, 27/10) put three
 * customers in November and two in October, while its chart has one in each. The chart wins here (a whole
 * series), so four of the five table dates differ from the frame; the day of month is kept.
 *
 * Cars and brands stay the seeded fixtures: they already produce the frame's KPI values (R$ 20,8 mi, 538,
 * 92%) and brand shares (19/16/14/11/8/32%).
 */
import type { CustomerDto } from '../../src/types'

const at = (date: string) => `${date}T12:00:00Z`

/** Sorted by `fullName`, the API's order. Ids are arbitrary but stable. */
export const figmaCustomers: CustomerDto[] = [
  { id: 101, fullName: 'Ana Paula Ribeiro', email: 'ana.ribeiro@email.com', phoneNumber: null, createdAt: at('2026-11-08'), carId: 1, carName: 'Toyota Corolla XEi 2.0' },
  { id: 102, fullName: 'Bruno Carvalho', email: 'bruno.carvalho@email.com', phoneNumber: null, createdAt: at('2026-10-06'), carId: 34, carName: 'Ford Ranger XLT' },
  { id: 103, fullName: 'Carla Menezes de Albuquerque Figueiredo', email: 'carla.figueiredo@email.com', phoneNumber: null, createdAt: at('2026-09-03'), carId: 7, carName: 'BMW 320i M Sport' },
  { id: 104, fullName: 'Diego Santos', email: 'diego.santos@email.com', phoneNumber: null, createdAt: at('2026-09-29'), carId: 10, carName: 'Honda Civic Touring' },
  { id: 105, fullName: 'Elisa Moura', email: 'elisa.moura@email.com', phoneNumber: null, createdAt: at('2026-08-27'), carId: 20, carName: 'Audi A3 Sedan' },
  { id: 106, fullName: 'Fernanda Lima', email: 'fernanda.lima@email.com', phoneNumber: null, createdAt: at('2026-07-21'), carId: 2, carName: 'Toyota Camry' },
  { id: 107, fullName: 'Gustavo Rocha', email: 'gustavo.rocha@email.com', phoneNumber: null, createdAt: at('2026-07-09'), carId: 32, carName: 'Ford Escape' },
  { id: 108, fullName: 'Helena Costa', email: 'helena.costa@email.com', phoneNumber: null, createdAt: at('2026-06-15'), carId: 36, carName: 'BMW X3' },
  { id: 109, fullName: 'Igor Almeida', email: 'igor.almeida@email.com', phoneNumber: null, createdAt: at('2026-04-18'), carId: 11, carName: 'Honda Accord' },
  { id: 110, fullName: 'Julia Martins', email: 'julia.martins@email.com', phoneNumber: null, createdAt: at('2026-03-24'), carId: 21, carName: 'Audi Q5' },
  { id: 111, fullName: 'Lucas Pereira', email: 'lucas.pereira@email.com', phoneNumber: null, createdAt: at('2026-03-05'), carId: 3, carName: 'Toyota RAV4' },
  { id: 112, fullName: 'Marina Souza', email: 'marina.souza@email.com', phoneNumber: null, createdAt: at('2026-02-17'), carId: 33, carName: 'Ford Bronco' },
  { id: 113, fullName: 'Natália Gomes', email: 'natalia.gomes@email.com', phoneNumber: null, createdAt: at('2026-02-02'), carId: 8, carName: 'BMW X5' },
  { id: 114, fullName: 'Otávio Ramos', email: 'otavio.ramos@email.com', phoneNumber: null, createdAt: at('2026-01-26'), carId: 12, carName: 'Honda CR-V' },
  { id: 115, fullName: 'Paula Nunes', email: 'paula.nunes@email.com', phoneNumber: null, createdAt: at('2026-01-12'), carId: 24, carName: 'Hyundai Tucson' },
]
