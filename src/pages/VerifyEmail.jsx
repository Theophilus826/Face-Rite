// src/pages/VerifyEmail.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyEmail, reset } from "../features/AuthSlice";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function VerifyEmail() {
    const { token } = useParams();
    const dispatch = useDispatch();
    const { isSuccess, isError, message } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(verifyEmail(token));
    }, [dispatch, token]);

    useEffect(() => {
        if (isSuccess) toast.success(message);
        if (isError) toast.error(message);
        dispatch(reset());
    }, [isSuccess, isError, message, dispatch]);

    return <h2>Verifying Email...</h2>;
}
