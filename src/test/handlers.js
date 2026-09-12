import { http } from 'msw';

const BASE = 'http://localhost:4000';

export const handlers = [
  http.get(`${BASE}/api/order`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('guest') !== 'true') {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    return new Response(
      JSON.stringify({
        data: {
          data: [
            {
              _id: 'o1',
              orderStatus: 'PENDIENTE',
              orderDate: new Date().toISOString(),
              items: [{ _id: 'i1', name: 'Pizza', quantity: 1 }],
            },
            {
              _id: 'o2',
              orderStatus: 'LISTO',
              orderDate: new Date(Date.now() - 40 * 86400000).toISOString(),
              items: [{ _id: 'i2', name: 'Hamburguesa', quantity: 2 }],
            },
            {
              _id: 'o3',
              orderStatus: 'PAGADO',
              orderDate: new Date().toISOString(),
              items: [{ _id: 'i3', name: 'Jugo', quantity: 1 }],
            },
            {
              _id: 'o4',
              orderStatus: 'ENTREGADO',
              orderDate: new Date().toISOString(),
              items: [],
            },
          ],
        },
      }),
      { status: 200 }
    );
  }),

  http.get(`${BASE}/api/table`, () =>
    new Response(
      JSON.stringify({
        data: {
          data: [
            { _id: 't1', number: 1, status: 'free', capacity: 4, currentOrder: null },
            { _id: 't2', number: 2, status: 'booked', capacity: 2, currentOrder: { customer: { name: 'Juan' } } },
          ],
        },
      }),
      { status: 200 }
    )
  ),

  http.get(`${BASE}/api/auth/state`, () =>
    new Response(JSON.stringify({ state: 'state-123' }), { status: 200 })
  ),
];