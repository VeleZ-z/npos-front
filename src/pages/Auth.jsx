import React, { useEffect } from "react";
import restaurant from "../assets/images/restaurant-img.jpg";
import logo from "../assets/images/logo.png";
// GIS One Tap only
import GoogleOneTap from "../components/auth/GoogleOneTap";

const Auth = () => {
  useEffect(() => {
    document.title = "NPOS | Auth";
  }, []);

  // One Tap

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Section */}
      <div className="w-1/2 relative flex items-center justify-center bg-cover">
        {/* BG Image */}
        <img
          className="w-full h-full object-cover"
          src={restaurant}
          alt="Restaurant Image"
        />

        {/* Black Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>

        {/* Quote at bottom */}
        <blockquote className="absolute bottom-10 px-8 mb-10 text-2xl italic text-white">
          &quot;En Nativhos creemos que compartir un helado es compartir un
          pedacito de alegría. Por eso, ofrecemos a cada cliente
          los mejores sabores de mi tierra, con un servicio amable y
          lleno de calidez, para que cada visita se sienta como
          volver a casa. 
          Porque cuando el corazón se llena de sabor… siempre
          quieres regresar.&quot;
          <br />
          <span className="block mt-4 text-yellow-400">- Nativho&apos;s</span>
        </blockquote>
      </div>

      {/* Right Section */}
      <div className="w-1/2 min-h-screen bg-[#1a1a1a] p-10">
        <div className="flex flex-col items-center gap-2">
          <img
            src={logo}
            alt="Restro Logo"
            className="h-14 w-14 border-2 rounded-full p-1"
          />
          <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
            NativP
          </h1>
        </div>

        <h2 className="text-4xl text-center mt-10 font-semibold text-yellow-400 mb-10">
          Sign in with Google
        </h2>

        {/* Google One Tap Component */}
        <GoogleOneTap />

        {/* No register/login toggles; Google One Tap only */}
      </div>
    </div>
  );
};

export default Auth;
