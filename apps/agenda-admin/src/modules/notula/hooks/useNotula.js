import { useState, useEffect, useCallback } from 'react';
import { getNotulas, getAgendas, createNotula, getNotula, updateNotula } from '../../../api/notulaApi';
import { toast } from 'react-toastify';

export const useNotulaList = () => {
    const [notulas, setNotulas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotulas = useCallback(async (params = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getNotulas(params);
            setNotulas(res.data || []);
        } catch (err) {
            setError(err.message || 'Gagal memuat daftar notula');
            toast.error('Gagal memuat daftar notula');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotulas();
    }, [fetchNotulas]);

    return {
        notulas,
        isLoading,
        error,
        fetchNotulas
    };
};

export const useAgendaList = () => {
    const [agendas, setAgendas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAgendas = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getAgendas();
            setAgendas(res.data || []);
        } catch (err) {
            console.error('Gagal memuat agenda', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgendas();
    }, [fetchAgendas]);

    return { agendas, isLoading };
};
