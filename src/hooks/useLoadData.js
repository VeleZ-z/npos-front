import React from "react";
import { useDispatch } from "react-redux";
import { getUserData } from "../https/index";
import { removeUser, setUser } from "../redux/slices/userSlice";

const useLoadData = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getUserData();
        const { _id, name, email, phone, role } = data.data;
        dispatch(setUser({ _id, name, email, phone, role }));
      } catch (error) {
        console.error("Error loading user:", error);
        dispatch(removeUser());
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [dispatch]);

  return isLoading;
};

export default useLoadData;