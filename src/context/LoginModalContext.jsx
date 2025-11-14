import { createContext, useContext } from "react";

const LoginModalContext = createContext({
  openLoginModal: () => {},
});

export const LoginModalProvider = LoginModalContext.Provider;

export const useLoginModal = () => useContext(LoginModalContext);

export default LoginModalContext;
