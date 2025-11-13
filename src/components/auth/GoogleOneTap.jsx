import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../redux/slices/userSlice";
import { googleLogin, getAuthState } from "../../https/index";

const GoogleOneTap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  // state only for displaying errors

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const onCredential = async (response) => {
      try {
        const cred = response?.credential;
        if (!cred) return;
        const { data } = await googleLogin(cred, window.__GIS_STATE__);
        const token = data?.token;
        if (token) {
          localStorage.setItem("token", token);
        }
        const { _id, name, email, phone, role } = data.data;
        dispatch(setUser({ _id, name, email, phone, role }));
        navigate("/");
      } catch (err) {
        const resp = err?.response;
        const msg = resp?.data?.message || err?.message || "Google sign-in failed";
        enqueueSnackbar(msg, { variant: "error" });
        const looksLikeStateError = (resp?.status === 400) && /state/i.test(String(resp?.data?.message || resp?.statusText));
        if (looksLikeStateError) {
          await refreshStateAndPrompt();
        }
      }
    };
    if (!clientId) {
      setError("Falta VITE_GOOGLE_CLIENT_ID en el frontend");
      return;
    }

    // Fetch server-generated state first
    const fetchState = async () => {
      try {
        const { data } = await getAuthState();
        window.__GIS_STATE__ = data?.state;
        window.__GIS_STATE_TS__ = Date.now();
        // schedule a refresh at ~9 minutes (server expiry is 10 min)
        if (window.__GIS_STATE_TIMER__) clearTimeout(window.__GIS_STATE_TIMER__);
        window.__GIS_STATE_TIMER__ = setTimeout(async () => {
          try {
            const { data: d2 } = await getAuthState();
            window.__GIS_STATE__ = d2?.state;
            window.__GIS_STATE_TS__ = Date.now();
            const api = window.google?.accounts?.id;
            if (api && clientId) {
              api.initialize({
                client_id: clientId,
                callback: onCredential,
                auto_select: false,
                cancel_on_tap_outside: false,
                use_fedcm_for_prompt: true,
                state: window.__GIS_STATE__ || undefined,
              });
            }
          } catch { /* empty */ }
        }, 9 * 60 * 1000);
      } catch (e) {
        setError("No se pudo obtener 'state' del servidor");
      }
    };

    // Prevent double init in React StrictMode
    if (window.__GSI_INIT_DONE) return;
    window.__GSI_INIT_DONE = true;

    let cancelled = false;
    const init = () => {
      const api = window.google?.accounts?.id;
      if (!api) return false;
      // Initialize
      api.initialize({
        client_id: clientId,
        callback: onCredential,
        auto_select: false,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true,
        state: window.__GIS_STATE__ || undefined,
      });
      // Render official button
      if (btnRef.current && !btnRef.current.hasChildNodes()) {
        api.renderButton(btnRef.current, {
          theme: "filled_black",
          size: "large",
          type: "standard",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: 280,
        });
      }
      // One Tap prompt (ignore if browser disables FedCM)
      try {
        api.prompt();
      } catch { /* empty */ }
      setReady(true);
      return true;
    };

    const refreshStateAndPrompt = async () => {
      try {
        await fetchState();
        const api = window.google?.accounts?.id;
        if (api) {
          api.initialize({
            client_id: clientId,
            callback: onCredential,
            auto_select: false,
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: true,
            state: window.__GIS_STATE__ || undefined,
          });
          api.prompt();
        }
      } catch { /* empty */ }
    };

    // If API not present, try to inject the script
    if (!window.google?.accounts?.id) {
      const existing = document.getElementById("google-identity-services");
      if (!existing) {
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.id = "google-identity-services";
        s.onload = async () => { await fetchState(); init(); };
        s.onerror = () => setError("No se pudo cargar el script de Google (revisar bloqueadores)");
        document.head.appendChild(s);
      }
    }

    if (!window.__GIS_STATE__) { fetchState(); }
    if (!init()) {
      // Retry a few times while the script loads
      let tries = 0;
      const iv = setInterval(() => {
        if (cancelled) {
          clearInterval(iv);
          return;
        }
        tries += 1;
        if (init()) {
          clearInterval(iv);
        } else if (tries > 100) {
          clearInterval(iv);
          setError("No se pudo inicializar Google Identity Services");
        }
      }, 100);
      return () => clearInterval(iv);
    }

    return () => {
      cancelled = true;
      if (window.__GIS_STATE_TIMER__) clearTimeout(window.__GIS_STATE_TIMER__);
    };
  }, [dispatch, navigate]);

  return (
    <div className="mt-6 flex flex-col items-center">
      {error && (
        <div className="text-red-400 text-sm mb-2">
          {error}. intentalo de nuevo mas tarde.
        </div>
      )}
      <div ref={btnRef} style={{ minHeight: 48 }} />
    </div>
  );
};

export default GoogleOneTap;
