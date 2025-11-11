Google Identity Services (One Tap)


Script GSI
- `<script src="https://accounts.google.com/gsi/client" async defer></script>` en `pos-frontend/index.html`.

Flujo
- En `Auth.jsx` se monta `GoogleOneTap`, el cual inicializa One Tap y, al recibir el `credential`, llama a `POST /api/user/google-login`.
- El backend verifica el ID token y retorna el usuario + un JWT interno. Se guarda en `localStorage` para seguir usando el header `Authorization`.

URLs de desarrollo
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

