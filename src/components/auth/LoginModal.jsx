import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import GoogleOneTap from "./GoogleOneTap";
import logo from "../../assets/images/logo.png";
import restaurant from "../../assets/images/restaurant-img.jpg";

const LoginModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-[#111]">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 text-white bg-black/40 hover:bg-black/70 rounded-full p-2"
        >
          <IoMdClose size={20} />
        </button>
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-1/2 min-h-[260px]">
            <img
              src={restaurant}
              alt="Nativhos"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="relative h-full w-full bg-black/60 p-6 md:p-10 flex flex-col justify-center gap-4 text-white">
              <h2 className="text-2xl font-bold">Nativho&apos;s</h2>
              <p className="text-sm leading-relaxed text-gray-100">
                "En Nativhos creemos que compartir un helado es compartir un pedacito de alegría.
                Por eso, ofrecemos a cada cliente los mejores sabores de mi tierra, con un servicio amable
                y lleno de calidez, para que cada visita se sienta como volver a casa. Porque cuando el corazón
                se llena de sabor... siempre quieres regresar."
              </p>
              <p className="text-sm text-yellow-400 font-semibold">- Nativho&apos;s</p>
            </div>
          </div>
          <div className="md:w-1/2 bg-[#1c1c1c] p-8 flex flex-col items-center justify-center gap-4 text-center">
            <img src={logo} alt="logo" className="h-14 w-14 rounded-full" />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-400">NPOS</p>
              <h3 className="text-2xl font-semibold text-white">Sign in with Google</h3>
            </div>
            <GoogleOneTap />
            <p className="text-xs text-gray-400 max-w-xs">
              Puedes cerrar esta ventana y seguir explorando. Siempre podrás iniciar sesión desde el icono de perfil en la barra superior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

LoginModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

LoginModal.defaultProps = {
  open: false,
  onClose: () => {},
};

export default LoginModal;
